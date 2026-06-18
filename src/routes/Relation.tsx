import type { AppContextValue } from "../App";
import { MiniProject, MiniUser } from "../components/ArchiveList";

export function Relation({ app, relationId }: { app: AppContextValue; relationId: string }) {
  const relation = app.data.relations.find((item) => item.relation_id === relationId);
  if (!relation) return <section className="page"><h1>没有找到这条星链</h1></section>;
  const a = app.data.users.find((user) => user.user_id === relation.userA);
  const b = app.data.users.find((user) => user.user_id === relation.userB);
  const project = app.data.projects.find((item) => item.project_id === relation.projectId);
  const paper = app.data.newspapers.find((item) => item.projectId === relation.projectId);
  const sharedTags = project?.tags ?? [];

  return (
    <section className="page detail-page">
      <header className="page-head compact">
        <span className="label">星链关系详情</span>
        <h1>{relation.relationType} · 合作 {relation.cooperationCount} 次</h1>
        <p>星链权重 {relation.weight}，合作角色：{relation.cooperationRoles.join(" / ")}</p>
      </header>
      <div className="detail-grid">
        <section className="glass-panel"><h2>两个参赛者</h2>{a && <MiniUser user={a} app={app} />}{b && <MiniUser user={b} app={app} />}</section>
        <section className="glass-panel"><h2>共同项目 / 相关作品行星</h2>{project && <MiniProject project={project} app={app} />}</section>
        <section className="glass-panel"><h2>共同标签</h2><div className="tag-row">{sharedTags.map((tag) => <em key={tag}>#{tag}</em>)}</div></section>
        <section className="glass-panel"><h2>相关报纸</h2>{paper && <button className="line-button" onClick={() => app.navigate(`/result/${paper.newspaper_id}`)}>{paper.title}</button>}</section>
      </div>
    </section>
  );
}
