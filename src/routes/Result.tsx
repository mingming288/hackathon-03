import { useEffect, useState } from "react";
import type { AppContextValue } from "../App";
import { playMagic } from "../audio";
import { NewspaperPoster } from "../components/NewspaperPoster";
import { updateNewspaper, getAudiencePaper } from "../storage";

export function Result({ app, newspaperId }: { app: AppContextValue; newspaperId: string }) {
  const fromGraph = app.data.newspapers.find((item) => item.newspaper_id === newspaperId);
  const audiencePaper = fromGraph ? undefined : getAudiencePaper(newspaperId);
  const newspaper = fromGraph ?? audiencePaper;
  const isAudience = !!audiencePaper;
  const project = newspaper ? app.data.projects.find((item) => item.project_id === newspaper.projectId) : undefined;
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    playMagic(app.data.settings.volume, app.data.settings.soundEnabled);
    const timer = window.setTimeout(() => setDone(true), 1200);
    return () => window.clearTimeout(timer);
  }, [app.data.settings.soundEnabled, app.data.settings.volume]);

  if (!newspaper) return <section className="page"><h1>没有找到这份头版</h1></section>;
  const paper = newspaper;

  function publish() {
    updateNewspaper(newspaperId, { published: true });
    app.refresh();
    setToast("一份新头版诞生，一颗新的恒星进入原点宇宙。");
    window.setTimeout(() => app.navigate("/wall"), 900);
  }

  function download() {
    const node = document.querySelector(".poster");
    const text = node?.textContent ?? paper.title;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${paper.title}.txt`;
    link.click();
  }

  return (
    <section className="page result-page">
      {!done && (
        <div className="generating">
          <div className="origin-spinner" />
          <h1>AI 主编正在审稿</h1>
          <p>原点星周围的光粒子正在高速转动，头版即将出纸。</p>
        </div>
      )}
      {done && (
        <>
          <div className="result-layout">
            <NewspaperPoster newspaper={newspaper} project={project} />
            <aside className="result-info">
              <span className="label">生成完成</span>
              <h1>{newspaper.title}</h1>
              <p>{newspaper.subtitle}</p>
              <h3>产品亮点</h3>
              {newspaper.highlights.map((item) => <p className="bullet" key={item}>{item}</p>)}
              <h3>一年后标题</h3>
              <p>{newspaper.futureHeadline}</p>
              <strong>{newspaper.shareQuote}</strong>
            </aside>
          </div>
          <div className="action-bar">
            <button onClick={download}>下载</button>
            <button onClick={() => navigator.clipboard?.writeText(newspaper.shareQuote)}>分享</button>
            <button onClick={() => app.navigate("/generate")}>重新生成</button>
            {!isAudience && <button className="primary" onClick={publish}>发布到今日头版墙</button>}
            {!isAudience && <button onClick={() => app.navigate("/universe")}>进入原点宇宙</button>}
          </div>
        </>
      )}
      {toast && <div className="toast">{toast}</div>}
    </section>
  );
}
