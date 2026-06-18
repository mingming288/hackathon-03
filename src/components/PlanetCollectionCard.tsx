import { useState, useMemo } from "react";
import { playPlanetChime } from "../audio";

export type ProjectPlanet = {
  id: string;
  ownerName: string;
  teamName: string;
  projectName: string;
  slogan: string;
  spriteIndex: number; // 0 to 14
  noteFreq: number; // Hz for the chime
  size: number;
  posX: number; // Percentage 0-100
  posY: number; // Percentage 0-100
  newspaperId?: string; // 真实头版 id,点击可打开结果页
};

// C4, D4, E4, G4, A4, C5, D5, E5, G5, A5 (Pentatonic scale)
const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];

const predefinedPositions = [
  { x: 15, y: 18 },
  { x: 42, y: 12 },
  { x: 78, y: 16 },
  { x: 88, y: 45 },
  { x: 62, y: 40 },
  { x: 28, y: 48 },
  { x: 12, y: 76 },
  { x: 46, y: 82 },
  { x: 72, y: 74 },
  { x: 92, y: 88 },
];

export const mockPlanetProjects: ProjectPlanet[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `planet-proj-${i}`,
  ownerName: ["King", "林澈", "阿璇", "叶白", "Mute", "Neo", "Luna", "Ray", "Zoe", "Kai"][i],
  teamName: ["原点星研究所", "星图小队", "视觉探索者", "AIGC 前沿", "黑客松突击队", "代码诗人", "宇宙拓荒者", "无限流", "创意工坊", "极客联盟"][i],
  projectName: ["原点日报机", "原点宇宙星图", "未来头版模板", "Hackaverse Agent", "社交共创图谱", "智能音效引擎", "3D星空画布", "跨端小程序生成", "AI项目总结器", "黑客松纪念碑"][i],
  slogan: [
    "让每一个黑客松作品，都拥有自己的宇宙坐标。",
    "用恒星与星链，连接现场的每一个创意火花。",
    "像发布会一样，第一眼记住你的作品。",
    "自动整理文档，化身你的专属宇宙向导。",
    "发现团队之外，那些与你技能互补的有趣灵魂。",
    "用风铃与合成器，聆听代码敲击的频率。",
    "不只是列表，而是一座可以漫游的三维展厅。",
    "写一次代码，在整个宇宙的终端中绽放。",
    "提炼千言万语，化作星空中的一句箴言。",
    "让短暂的 48 小时，成为永恒的宇宙印记。"
  ][i],
  spriteIndex: i, // We use first 10 planets from the sprite
  noteFreq: notes[i],
  size: 56 + Math.random() * 54, // 56px to 110px
  posX: predefinedPositions[i].x + (Math.random() * 4 - 2), // Slight randomization around the anchor
  posY: predefinedPositions[i].y + (Math.random() * 4 - 2),
}));

function ProjectMiniCard({ project, onClose, onOpen }: { project: ProjectPlanet, onClose: () => void, onOpen?: (id: string) => void }) {
  return (
    <div className="planet-mini-card" onClick={(e) => e.stopPropagation()}>
      <div className="pm-header">
        <h4>{project.projectName}</h4>
        <button className="pm-close" onClick={onClose}>×</button>
      </div>
      <div className="pm-owner">
        <span>归属人：{project.ownerName}</span>
        <span className="pm-dot">·</span>
        <span>归属团队：{project.teamName}</span>
      </div>
      <div className="pm-slogan">
        <p>“{project.slogan}”</p>
      </div>
      {project.newspaperId && onOpen && (
        <button className="pm-open" onClick={() => onOpen(project.newspaperId!)}>查看头版</button>
      )}
    </div>
  );
}

function PlanetNode({ 
  project, 
  isActive, 
  onClick 
}: { 
  project: ProjectPlanet, 
  isActive: boolean, 
  onClick: (p: ProjectPlanet) => void 
}) {
  
  // Sprite configuration
  const cols = 3;
  const rows = 5;
  const bgPosX = (project.spriteIndex % cols) * 50; // 0, 50, 100
  const bgPosY = Math.floor(project.spriteIndex / cols) * 25; // 0, 25, 50, 75, 100

  return (
    <div 
      className={`planet-node-container ${isActive ? 'active' : ''}`}
      style={{
        left: `${project.posX}%`,
        top: `${project.posY}%`,
        width: `${project.size}px`,
        height: `${project.size}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        // Uses default settings for standalone card component
        playPlanetChime(project.noteFreq, 0.42, true);
        onClick(project);
      }}
    >
      <div 
        className="planet-sprite"
        style={{
          backgroundImage: "url('/planets.png')",
          backgroundSize: "300% 500%",
          backgroundPosition: `${bgPosX}% ${bgPosY}%`,
          backgroundRepeat: "no-repeat"
        }}
      />
      {isActive && <div className="planet-pulse" />}
    </div>
  );
}

export function PlanetCollectionCard({ planets, onOpen }: { planets?: ProjectPlanet[]; onOpen?: (id: string) => void }) {
  const [activePlanetId, setActivePlanetId] = useState<string | null>(null);
  const list = planets && planets.length ? planets : mockPlanetProjects;

  const activePlanet = useMemo(() =>
    list.find(p => p.id === activePlanetId),
  [list, activePlanetId]);

  return (
    <div className="planet-collection-wrapper">
      <div className="pc-header">
        <h3>作品行星集</h3>
        <p>点击一颗行星，查看对应作品</p>
      </div>

      <div className="planet-collection-card" onClick={() => setActivePlanetId(null)}>
        {/* Background particles */}
        <div className="pc-particles" />

        {/* Planets */}
        {list.map(project => (
          <PlanetNode
            key={project.id}
            project={project}
            isActive={activePlanetId === project.id}
            onClick={(p) => setActivePlanetId(p.id)}
          />
        ))}

        {/* Mini Card Popup */}
        {activePlanet && (
          <div className="pc-popup-container">
            <ProjectMiniCard
              project={activePlanet}
              onClose={() => setActivePlanetId(null)}
              onOpen={onOpen}
            />
          </div>
        )}
      </div>
    </div>
  );
}