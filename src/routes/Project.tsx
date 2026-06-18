import type { AppContextValue } from "../App";
import { MiniProject, MiniUser } from "../components/ArchiveList";
import { NewspaperPoster } from "../components/NewspaperPoster";

export function Project({ app, projectId }: { app: AppContextValue; projectId: string }) {
  const project = app.data.projects.find((item) => item.project_id === projectId);
  if (!project) return <section className="page"><h1>没有找到这颗作品行星</h1></section>;
  const members = app.data.users.filter((user) => project.memberIds.includes(user.user_id));
  const paper = app.data.newspapers.find((item) => item.newspaper_id === project.newspaperId);
  const related = app.data.projects.filter((item) => item.project_id !== projectId && item.tags.some((tag) => project.tags.includes(tag))).slice(0, 3);

  return (
    <section className="page detail-page">
      <header className="page-head compact">
        <span className="label">作品行星详情</span>
        <h1>{project.name}</h1>
        <p>{project.oneSentence}</p>
      </header>
      <div className="project-layout">
        <section className="glass-panel">
          <h2>项目材料摘要</h2>
          <p>{project.description}</p>
          <p>{project.documentText}</p>
          <div className="tag-row">{project.tags.map((tag) => <em key={tag}>#{tag}</em>)}</div>
          <div className="link-row"><a>{project.demoLink}</a><a>{project.githubLink}</a></div>
        </section>
        {paper && <NewspaperPoster newspaper={paper} project={project} />}
      </div>
      <div className="detail-grid">
        <section className="glass-panel">
          <h2>团队成员 / 相关参赛者恒星</h2>
          <div className="mini-card-grid">
            {members.map((user) => <MiniUser key={user.user_id} user={user} app={app} />)}
          </div>
        </section>
        <section className="glass-panel">
          <h2>相关项目推荐</h2>
          <div className="mini-card-grid">
            {related.map((item) => <MiniProject key={item.project_id} project={item} app={app} />)}
          </div>
        </section>
      </div>
    </section>
  );
}
