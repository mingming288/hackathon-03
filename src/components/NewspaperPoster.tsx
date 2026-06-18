import type { Newspaper, Project } from "../types";

export function NewspaperPoster({ newspaper, project }: { newspaper: Newspaper; project?: Project }) {
  const styleClass = `poster-${newspaper.templateStyle.replace(/\s+/g, "-")}`;

  // AI 生成的图片本身就是一张完整的头版海报,直接展示,相框跟着海报走。
  if (newspaper.imageUrl) {
    return (
      <article className={`poster poster-ai ${styleClass}`}>
        <img className="poster-full" src={newspaper.imageUrl} alt={newspaper.title} />
      </article>
    );
  }

  // 兜底:没有 AI 图片时(mockAI 降级),用文字版头版保证内容不空。
  return (
    <article className={`poster ${styleClass}`}>
      <div className="poster-scan" />
      <header>
        <b>原点日报</b>
        <span>ORIGIN DAILY<br />HACKATHON SPECIAL</span>
      </header>
      <h1>{newspaper.title}</h1>
      <p className="subtitle">{newspaper.subtitle}</p>
      <div className="poster-image">
        <div className="empty-photo">ORIGIN STAR</div>
        <span>{project?.name ?? "未命名作品"}</span>
      </div>
      <section className="poster-copy">
        <p>{newspaper.projectSummary}</p>
        <p className="editor">{newspaper.editorComment}</p>
      </section>
      <div className="poster-tags">{newspaper.tags.map((tag) => <em key={tag}>#{tag}</em>)}</div>
      <strong className="share-quote">{newspaper.shareQuote}</strong>
    </article>
  );
}
