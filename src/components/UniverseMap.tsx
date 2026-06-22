import { useRef, useState, useMemo, useEffect, Fragment, type CSSProperties } from "react";
import type { AppContextValue } from "../App";
import { playPlanetChime } from "../audio";
import type { Relation, User, Project } from "../types";
import { NewspaperPoster } from "./NewspaperPoster";
import { getUserRelations, getRecommendedUsers, createRecommendedRelation } from "../relationUtils";

type Filters = { track: string; role: string; skill: string; relation: string; q: string };

export function UniverseMap({ app }: { app: AppContextValue }) {
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [activeRelation, setActiveRelation] = useState<Relation | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, z: -800 });
  const [filters, setFilters] = useState<Filters>({ track: "全部", role: "全部", skill: "全部", relation: "全部", q: "" });
  const [isFocused, setIsFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, camX: 0, camY: 0 });

  const users = app.data.users;
  const active = activeUser ? app.data.users.find((u) => u.user_id === activeUser) : null;
  const activeNewspaper = active ? app.data.newspapers.find(n => n.userId === active.user_id) || app.data.newspapers[0] : null;
  const activeProject = active ? app.data.projects.find(p => p.memberIds.includes(active.user_id)) : undefined;

  // 获取活跃用户的关系（按权重排序）
  const activeRelations = useMemo(() => {
    if (!activeUser) return [];
    return getUserRelations(app.data.relations, activeUser);
  }, [activeUser, app.data.relations]);

  // 获取推荐认识的用户
  const recommendedUsers = useMemo(() => {
    if (!active) return [];
    return getRecommendedUsers(active, users, app.data.relations, 3);
  }, [active, users, app.data.relations]);

  // Derive filter options
  const tracks = ["全部", "AI", "社区", "视觉", "AI 互动装置", "社交图谱", "黑客松工具", "其他"];
  const roles = ["全部", "产品", "设计", "前端", "后端", "算法", "运营", "路演策划"];
  const skills = ["全部", "React", "Three.js", "Prompt", "UI/UX", "Agent", "AIGC", "数据可视化", "线下装置"];
  const relations = ["全部", "队友关系", "同赛道", "技能互补", "推荐认识"];

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const projects = app.data.projects.filter(p => user.projectIds.includes(p.project_id));
      const text = [user.name, user.role, ...user.skills, ...projects.map(p => p.name)].join(" ");
      return (filters.role === "全部" || user.role.includes(filters.role))
        && (filters.skill === "全部" || user.skills.includes(filters.skill))
        && (filters.track === "全部" || projects.some(p => p.track === filters.track))
        && (!filters.q || text.toLowerCase().includes(filters.q.toLowerCase()));
    });
  }, [users, app.data.projects, filters]);

  const hasActiveFilters = filters.role !== "全部" || filters.skill !== "全部" || filters.track !== "全部" || filters.q !== "";

  // 搜索结果（实时搜索）
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return users
      .filter(user => {
        const projects = app.data.projects.filter(p => user.projectIds.includes(p.project_id));
        const text = [
          user.name,
          user.role,
          user.bio,
          ...user.skills,
          ...projects.map(p => p.name),
          ...projects.map(p => p.oneSentence),
        ].join(" ").toLowerCase();
        return text.includes(query);
      })
      .slice(0, 8); // 最多显示 8 条结果
  }, [users, app.data.projects, searchQuery]);

  // Connected users for the active star
  const connectedUserIds = useMemo(() => {
    if (!activeUser) return new Set<string>();
    const set = new Set<string>([activeUser]);
    app.data.relations.forEach(r => {
      if (r.userA === activeUser) set.add(r.userB);
      if (r.userB === activeUser) set.add(r.userA);
    });
    return set;
  }, [activeUser, app.data.relations]);

  // Listen for custom event from AppShell to toggle filters
  useEffect(() => {
    const handleToggle = () => setShowFilters(prev => !prev);
    window.addEventListener("toggle-universe-filter", handleToggle);
    return () => window.removeEventListener("toggle-universe-filter", handleToggle);
  }, []);

  function focusUser(user: User) {
    setActiveUser(user.user_id);
    setActiveRelation(null);
    setIsFocused(true);
    setView({ x: -user.position.x, y: -user.position.y, z: -user.position.z + 500 });

    // Play Wind Chime Sound based on star properties
    const note = 261.63 * Math.pow(1.059463, (user.starBrightness % 12));
    playPlanetChime(note, app.data.settings.volume, app.data.settings.soundEnabled);
  }

  function handleCreateRecommend(targetUserId: string) {
    if (!active) return;
    const targetUser = users.find((u) => u.user_id === targetUserId);
    if (!targetUser) return;

    createRecommendedRelation(active, targetUser, app.data.relations);
    app.refresh();
  }

  function handleSearchSelect(userId: string) {
    const user = users.find((u) => u.user_id === userId);
    if (user) {
      focusUser(user);
      setSearchQuery("");
      setShowSearch(false);
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setSearchQuery("");
      setShowSearch(false);
    }
    if (e.key === "Enter" && searchResults.length > 0) {
      handleSearchSelect(searchResults[0].user_id);
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest('.u-panel')) return;
    dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, camX: view.x, camY: view.y };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      if (isFocused) {
        setIsFocused(false);
        setActiveUser(null);
        setActiveRelation(null);
      }
    }
    setView(v => ({ ...v, x: dragRef.current.camX + dx, y: dragRef.current.camY + dy }));
  }

  function handlePointerUp() {
    dragRef.current.isDragging = false;
  }

  function handleWheel(e: React.WheelEvent) {
    if ((e.target as HTMLElement).closest('.u-panel')) return;
    if (isFocused) {
      setIsFocused(false);
      setActiveUser(null);
      setActiveRelation(null);
    }
    setView(v => ({ ...v, z: Math.min(1000, Math.max(-6000, v.z - e.deltaY * 2)) }));
  }

  const shootingStars = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: `meteor-${i}`,
      top: `${-20 + Math.random() * 120}%`,
      left: `${-20 + Math.random() * 120}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${1.5 + Math.random() * 1.5}s`,
    }));
  }, []);

  function renderLine(relation: Relation) {
    const a = users.find(u => u.user_id === relation.userA);
    const b = users.find(u => u.user_id === relation.userB);
    if (!a || !b) return null;

    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    const dz = b.position.z - a.position.z;
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    const rotZ = Math.atan2(dy, dx);
    const rotY = -Math.atan2(dz, Math.sqrt(dx*dx + dy*dy));

    const isActive = activeUser && (relation.userA === activeUser || relation.userB === activeUser);
    const isDimmed = activeUser && !isActive;

    const midX = (a.position.x + b.position.x) / 2;
    const midY = (a.position.y + b.position.y) / 2;
    const midZ = (a.position.z + b.position.z) / 2;

    return (
      <Fragment key={relation.relation_id}>
        <div
          className={`u-line type-${relation.relationType} ${isActive ? 'active' : ''} ${isDimmed ? 'dimmed' : ''}`}
          style={{
            width: `${dist}px`,
            transform: `translate3d(${a.position.x}px, ${a.position.y}px, ${a.position.z}px) rotateZ(${rotZ}rad) rotateY(${rotY}rad)`,
            background: relation.relationColor,
            opacity: isDimmed ? 0.05 : (isActive ? 0.8 : 0.3)
          }}
          onClick={(e) => {
            e.stopPropagation();
            setActiveRelation(relation);
          }}
        />
        {(isActive || activeRelation?.relation_id === relation.relation_id) && (
          <div 
            className="u-line-label-wrapper" 
            style={{ 
              transform: `translate3d(${midX}px, ${midY}px, ${midZ}px)` 
            }}
          >
            <div 
              className="u-line-label"
              style={{ 
                color: relation.relationColor, 
                borderColor: relation.relationColor,
              }}
            >
              {relation.relationTitle}
            </div>
          </div>
        )}
      </Fragment>
    );
  }

  function renderStar(user: User) {
    const isActive = user.user_id === activeUser;
    let isDimmed = false;
    
    if (activeUser) {
      isDimmed = !connectedUserIds.has(user.user_id);
    } else if (hasActiveFilters) {
      isDimmed = !filteredUsers.some(u => u.user_id === user.user_id);
    }

    const scale = isActive ? 1.6 : 1;
    const size = 10 + (user.starBrightness / 100) * 16; // Map 0-100 to 10px-26px
    const glow = user.starBrightness / 2;

    return (
      <div
        key={user.user_id}
        className={`u-star ${isActive ? 'active' : ''} ${isDimmed ? 'dimmed' : ''}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          marginLeft: `${-size/2}px`,
          marginTop: `${-size/2}px`,
          transform: `translate3d(${user.position.x}px, ${user.position.y}px, ${user.position.z}px) scale(${scale})`,
          boxShadow: isActive ? `0 0 ${glow*2}px var(--gold), 0 0 ${glow*4}px rgba(145,214,255,0.6)` : `0 0 ${glow}px var(--gold)`,
        }}
        onClick={(e) => { e.stopPropagation(); focusUser(user); }}
      >
        {isActive && <div className="u-star-burst" />}
        <span className="u-star-label">{user.name}</span>
      </div>
    );
  }

  return (
    <div className={`universe-app ${isFocused ? 'focus-mode' : ''}`} style={{ height: "calc(100vh - 120px)", position: "relative" }}>
      {/* Search Bar */}
      <div className={`u-search-container ${showSearch ? 'active' : ''}`}>
        <div className="u-search-bar">
          <span className="u-search-icon">🔍</span>
          <input
            className="u-search-input"
            placeholder="搜索恒星 / 项目 / 技能..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearch(true);
            }}
            onFocus={() => setShowSearch(true)}
            onKeyDown={handleSearchKeyDown}
          />
          {searchQuery && (
            <button className="u-search-clear" onClick={() => { setSearchQuery(""); setShowSearch(false); }}>
              ×
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearch && searchQuery && (
          <div className="u-search-results">
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  key={user.user_id}
                  className="u-search-result-item"
                  onClick={() => handleSearchSelect(user.user_id)}
                >
                  <div className="u-search-result-avatar">{user.name.charAt(0)}</div>
                  <div className="u-search-result-info">
                    <span className="u-search-result-name">{user.name}</span>
                    <span className="u-search-result-meta">{user.role} · {user.skills.slice(0, 2).join(", ")}</span>
                  </div>
                  <span className="u-search-result-arrow">→</span>
                </div>
              ))
            ) : (
              <div className="u-search-no-result">
                <span>未找到匹配的恒星</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dropdown Filter Panel */}
      {showFilters && (
        <div className="u-filter-dropdown">
          <input 
            className="u-input" 
            placeholder="搜索参赛者 / 项目 / 技术栈" 
            value={filters.q} 
            onChange={e => setFilters({...filters, q: e.target.value})} 
          />
          <div className="u-filter-grid">
            <Select label="赛道筛选" value={filters.track} options={tracks} onChange={v => setFilters({...filters, track: v})} />
            <Select label="角色筛选" value={filters.role} options={roles} onChange={v => setFilters({...filters, role: v})} />
            <Select label="技能标签" value={filters.skill} options={skills} onChange={v => setFilters({...filters, skill: v})} />
            <Select label="关系筛选" value={filters.relation} options={relations} onChange={v => setFilters({...filters, relation: v})} />
          </div>
        </div>
      )}

      {/* Center 3D Canvas */}
      <main 
        className="u-scene"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      >
        {/* Shooting Stars Background Layer */}
        <div className="u-shooting-stars">
          {shootingStars.map(star => (
            <div 
              key={star.id} 
              className="u-meteor"
              style={{
                top: star.top,
                left: star.left,
                animationDelay: star.delay,
                animationDuration: star.duration
              }}
            />
          ))}
        </div>

        <div className="u-camera" style={{ 
          transform: `translate3d(${view.x}px, ${view.y}px, ${view.z}px)`,
          transition: isFocused ? 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
        }}>
          <div className="u-world">
            {app.data.relations.map(renderLine)}
            {users.map(renderStar)}
          </div>
        </div>
      </main>

      {/* Right Profile Panel */}
      <aside className={`u-panel u-panel-right ${active || activeRelation ? 'open' : ''}`}>
        {active && !activeRelation && (
          <div className="profile-content">
            <button className="u-close-btn" onClick={() => { setActiveUser(null); setIsFocused(false); }}>×</button>
            <div className="p-header">
              <div className="p-avatar">{active.avatar || active.name.charAt(0)}</div>
              <div className="p-info">
                <h2>{active.name}</h2>
                <span className="p-role">{active.role}</span>
              </div>
            </div>
            
            <div className="p-section">
              <h3>技能标签</h3>
              <div className="p-tags">
                {active.skills.map(s => <span key={s} className="p-tag">{s}</span>)}
              </div>
            </div>

            <div className="p-section">
              <h3>本届作品</h3>
              {activeProject ? (
                <div className="p-project-card">
                  <h4>{activeProject.name}</h4>
                  <p>{activeProject.oneSentence}</p>
                  <div className="p-project-actions">
                    {activeNewspaper && (
                      <button className="u-btn primary" onClick={() => app.navigate(`/result/${activeNewspaper.newspaper_id}`)}>
                        查看头版
                      </button>
                    )}
                    <button className="u-btn" onClick={() => app.navigate(`/project/${activeProject.project_id}`)}>
                      进入行星
                    </button>
                  </div>
                </div>
              ) : (
                <p className="p-empty">暂无作品记录</p>
              )}
            </div>

            <div className="p-section">
              <h3>星链关系</h3>
              <div className="p-relations">
                {activeRelations.slice(0, 5).map((rel) => (
                  <div key={rel.relation_id} className="p-relation-item" onClick={() => setActiveRelation(rel)}>
                    <span className="p-relation-dot" style={{ background: rel.relationColor }} />
                    <span className="p-relation-title">{rel.relationTitle}</span>
                    <span className="p-relation-weight">权重 {rel.weight}</span>
                  </div>
                ))}
                {activeRelations.length === 0 && <p className="p-empty">暂无星链</p>}
              </div>
            </div>

            {recommendedUsers.length > 0 && (
              <div className="p-section">
                <h3>推荐认识</h3>
                <div className="p-recommended">
                  {recommendedUsers.map((u) => (
                    <div key={u.user_id} className="p-recommended-item">
                      <div className="p-avatar small">{u.name.charAt(0)}</div>
                      <span>{u.name}</span>
                      <button className="u-btn tiny" onClick={() => handleCreateRecommend(u.user_id)}>
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-section">
              <h3>宇宙名片</h3>
              <p className="p-bio">{active.bio}</p>
              <button className="u-btn block" onClick={() => app.navigate(`/profile/${active.user_id}`)}>
                查看完整档案
              </button>
            </div>
          </div>
        )}

        {activeRelation && (
          <div className="profile-content relation-detail">
            <button className="u-close-btn" onClick={() => setActiveRelation(null)}>×</button>
            <div className="p-header" style={{ marginBottom: "20px" }}>
              <div className="p-info">
                <h2 style={{ color: activeRelation.relationColor, fontSize: "20px" }}>
                  {activeRelation.relationTitle}
                </h2>
                <span className="p-role">星链关系详情</span>
              </div>
            </div>

            <div className="p-section">
              <h3>连接的恒星</h3>
              <div className="r-users-row">
                <div className="r-user" onClick={() => {
                  const u = users.find(x => x.user_id === activeRelation.userA);
                  if (u) focusUser(u);
                }}>
                  <div className="p-avatar small">{users.find(u => u.user_id === activeRelation.userA)?.name.charAt(0)}</div>
                  <span>{users.find(u => u.user_id === activeRelation.userA)?.name}</span>
                </div>
                <div className="r-link-line" style={{ background: activeRelation.relationColor }} />
                <div className="r-user" onClick={() => {
                  const u = users.find(x => x.user_id === activeRelation.userB);
                  if (u) focusUser(u);
                }}>
                  <div className="p-avatar small">{users.find(u => u.user_id === activeRelation.userB)?.name.charAt(0)}</div>
                  <span>{users.find(u => u.user_id === activeRelation.userB)?.name}</span>
                </div>
              </div>
            </div>

            <div className="p-section">
              <h3>合作信息</h3>
              <div className="r-info-list">
                <div className="r-info-item">
                  <span className="r-label">共同项目</span>
                  <span className="r-value">{activeRelation.projectId}</span>
                </div>
                <div className="r-info-item">
                  <span className="r-label">合作角色</span>
                  <span className="r-value">{activeRelation.cooperationRoles.join(" & ")}</span>
                </div>
                <div className="r-info-item">
                  <span className="r-label">合作次数</span>
                  <span className="r-value">{activeRelation.cooperationCount} 次</span>
                </div>
              </div>
            </div>

            {activeRelation.commonTags.length > 0 && (
              <div className="p-section">
                <h3>共同标签</h3>
                <div className="p-tags">
                  {activeRelation.commonTags.map(tag => <span key={tag} className="p-tag">{tag}</span>)}
                </div>
              </div>
            )}
            
            <div className="p-section" style={{ marginTop: "auto" }}>
              <button className="u-btn block" onClick={() => app.navigate(`/project/${activeRelation.projectId}`)}>
                查看共同项目
              </button>
            </div>
          </div>
        )}
      </aside>

    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="u-select-wrapper">
      <span className="u-select-label">{label}</span>
      <select className="u-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}
