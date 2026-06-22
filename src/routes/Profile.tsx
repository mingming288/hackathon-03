import type { ReactNode } from "react";
import type { AppContextValue } from "../App";
import { MiniProject, MiniUser } from "../components/ArchiveList";
import { getUserRelations, getRecommendedUsers, createRecommendedRelation } from "../relationUtils";

export function Profile({ app, userId }: { app: AppContextValue; userId: string }) {
  const user = app.data.users.find((item) => item.user_id === userId);
  if (!user) return <section className="page"><h1>没有找到这颗恒星</h1></section>;

  const projects = app.data.projects.filter((project) => user.projectIds.includes(project.project_id));
  const relations = getUserRelations(app.data.relations, userId);
  const recommended = getRecommendedUsers(user, app.data.users, app.data.relations, 5);

  function handleRecommend(targetUserId: string) {
    if (!user) return;
    const targetUser = app.data.users.find((u) => u.user_id === targetUserId);
    if (!targetUser) return;

    createRecommendedRelation(user, targetUser, app.data.relations);
    app.refresh();
  }

  return (
    <section className="page detail-page">
      <div className="profile-hero">
        <span className="avatar big">{user.avatar}</span>
        <div>
          <span className="label">参赛者恒星</span>
          <h1>{user.name}</h1>
          <p>{user.role}</p>
          <p>{user.bio}</p>
          <strong>{user.contact}</strong>
        </div>
      </div>
      <div className="detail-grid">
        <Panel title="技能标签">{user.skills.map((skill) => <em key={skill}>#{skill}</em>)}</Panel>
        <Panel title="参与项目列表 / 作品行星">{projects.map((project) => <MiniProject key={project.project_id} project={project} app={app} />)}</Panel>
        <Panel title="队友星链">
          {relations.map((relation) => (
            <button className="line-button" key={relation.relation_id} onClick={() => app.navigate(`/relation/${relation.relation_id}`)}>
              {relation.relationTitle} · 权重 {relation.weight}
            </button>
          ))}
          {relations.length === 0 && <p className="p-empty">暂无星链关系</p>}
        </Panel>
        <Panel title="推荐认识">
          {recommended.map((item) => (
            <div key={item.user_id} className="recommend-item">
              <MiniUser user={item} app={app} />
              <button
                className="u-btn small"
                onClick={() => handleRecommend(item.user_id)}
              >
                建立星链
              </button>
            </div>
          ))}
          {recommended.length === 0 && <p className="p-empty">暂无推荐</p>}
        </Panel>
      </div>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="glass-panel"><h2>{title}</h2><div className="stack">{children}</div></section>;
}
