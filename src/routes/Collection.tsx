import { useMemo, useState } from "react";
import type { AppContextValue } from "../App";
import { PlanetCollectionCard, type ProjectPlanet } from "../components/PlanetCollectionCard";

const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];
const anchors = [
  { x: 15, y: 18 }, { x: 42, y: 12 }, { x: 78, y: 16 }, { x: 88, y: 45 }, { x: 62, y: 40 },
  { x: 28, y: 48 }, { x: 12, y: 76 }, { x: 46, y: 82 }, { x: 72, y: 74 }, { x: 92, y: 88 },
];

export function Collection({ app }: { app: AppContextValue }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const planets = useMemo<ProjectPlanet[]>(() => {
    const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : -Infinity;
    const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
    return app.data.newspapers
      .filter((paper) => {
        const t = +new Date(paper.createdAt);
        return t >= start && t <= end;
      })
      .map((paper, i) => {
        const project = app.data.projects.find((p) => p.project_id === paper.projectId);
        const owner = app.data.users.find((u) => u.user_id === paper.userId);
        const anchor = anchors[i % anchors.length];
        return {
          id: paper.newspaper_id,
          ownerName: owner?.name ?? "匿名参赛者",
          teamName: paper.teamName ?? "未命名团队",
          projectName: project?.name ?? paper.title,
          slogan: project?.oneSentence || paper.subtitle || paper.shareQuote,
          spriteIndex: i % 15,
          noteFreq: notes[i % notes.length],
          size: 56 + (i % 5) * 11,
          posX: anchor.x + (Math.random() * 4 - 2),
          posY: anchor.y + (Math.random() * 4 - 2),
          newspaperId: paper.newspaper_id,
        };
      });
  }, [app.data.newspapers, app.data.projects, app.data.users, startDate, endDate]);

  return (
    <section className="page">
      <header className="page-head">
        <span className="label">作品集 / 历史产品集</span>
        <h1>每份头版都会成为一颗作品行星</h1>
      </header>
      <div className="toolbar" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="date-input-wrapper">
          <input 
            type="date" 
            className={`big-input custom-date-input ${startDate ? 'has-value' : ''}`}
            style={{ minHeight: '48px', fontSize: '15px' }}
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            placeholder="年 / 月 / 日"
          />
        </div>
        <div className="date-input-wrapper">
          <input 
            type="date" 
            className={`big-input custom-date-input ${endDate ? 'has-value' : ''}`}
            style={{ minHeight: '48px', fontSize: '15px' }}
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            placeholder="年 / 月 / 日"
          />
        </div>
      </div>
      
      <div className="collection-results" style={{ marginTop: '32px' }}>
        <PlanetCollectionCard planets={planets} onOpen={(id) => app.navigate(`/result/${id}`)} />
      </div>
    </section>
  );
}
