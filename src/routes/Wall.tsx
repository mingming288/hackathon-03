import { useMemo, useState } from "react";
import type { AppContextValue } from "../App";

type Sort = "最新" | "最热" | "AI 主编推荐" | "最具未来感";

export function Wall({ app }: { app: AppContextValue }) {
  const [sort, setSort] = useState<Sort>("最新");
  const [track, setTrack] = useState("全部");
  const [carousel, setCarousel] = useState(false);
  const tracks = ["全部", ...new Set(app.data.projects.map((p) => p.track))];
  const papers = useMemo(() => {
    const list = app.data.newspapers
      .filter((paper) => paper.published)
      .filter((paper) => {
        const project = app.data.projects.find((p) => p.project_id === paper.projectId);
        return track === "全部" || project?.track === track;
      });
    return [...list].sort((a, b) => {
      if (sort === "最热") return b.heat - a.heat;
      if (sort === "AI 主编推荐") return Number(b.aiRecommended) - Number(a.aiRecommended);
      if (sort === "最具未来感") return b.futureScore - a.futureScore;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
  }, [app.data.newspapers, app.data.projects, sort, track]);

  return (
    <section className="page wall-page">
      <header className="page-head compact">
        <span className="label">今日头版墙</span>
        <h1>线下围观点和公共共创沉淀</h1>
        <p>报纸卡片墙、大屏轮播、赛道筛选和排序都在这里。</p>
      </header>
      <div className="toolbar">
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>{["最新", "最热", "AI 主编推荐", "最具未来感"].map((item) => <option key={item}>{item}</option>)}</select>
        <select value={track} onChange={(e) => setTrack(e.target.value)}>{tracks.map((item) => <option key={item}>{item}</option>)}</select>
        <button onClick={() => setCarousel(!carousel)}>{carousel ? "退出大屏轮播" : "大屏轮播模式"}</button>
        <button className="primary" onClick={() => app.navigate("/generate")}>我也要生成头版</button>
      </div>
      <div className={carousel ? "wall-carousel" : "wall-grid"}>
        {papers.map((paper) => {
          const project = app.data.projects.find((p) => p.project_id === paper.projectId);
          return (
            <article className="wall-paper" key={paper.newspaper_id}>
              <button className={`paper-cover ${paper.imageUrl ? "has-image" : ""}`} onClick={() => app.navigate(`/result/${paper.newspaper_id}`)}>
                {paper.imageUrl ? <img src={paper.imageUrl} alt={paper.title} /> : <span>原点日报</span>}
              </button>
              <div className="split-actions">
                <button onClick={() => app.navigate(`/result/${paper.newspaper_id}`)}>报纸详情</button>
                {project && <button onClick={() => app.navigate(`/project/${project.project_id}`)}>项目行星</button>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
