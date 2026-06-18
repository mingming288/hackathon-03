import type { ReactNode } from "react";
import type { AppContextValue } from "../App";
import { MiniProject, MiniUser } from "../components/ArchiveList";

export function Profile({ app, userId }: { app: AppContextValue; userId: string }) {
  const user = app.data.users.find((item) => item.user_id === userId);
  if (!user) return <section className="page"><h1>没有找到这颗恒星</h1></section>;
  const projects = app.data.projects.filter((project) => user.projectIds.includes(project.project_id));
  const relations = app.data.relations.filter((r) => r.userA === userId || r.userB === userId);
  const recommended = app.data.users.filter((item) => item.user_id !== userId && item.skills.some((skill) => user.skills.includes(skill))).slice(0, 3);

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
          {relations.map((relation) => <button className="line-button" key={relation.relation_id} onClick={() => app.navigate(`/relation/${relation.relation_id}`)}>{relation.relationType} · 合作 {relation.cooperationCount} 次</button>)}
        </Panel>
        <Panel title="推荐认识">{recommended.map((item) => <MiniUser key={item.user_id} user={item} app={app} />)}</Panel>
      </div>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="glass-panel"><h2>{title}</h2><div className="stack">{children}</div></section>;
}
