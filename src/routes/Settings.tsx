import { useState } from "react";
import type { AppContextValue } from "../App";
import { resetData, updateSettings } from "../storage";

export function Settings({ app }: { app: AppContextValue }) {
  const [settings, setSettings] = useState(app.data.settings);

  function save(next = settings) {
    setSettings(next);
    updateSettings(next);
    app.refresh();
  }

  return (
    <section className="page settings-page">
      <header className="page-head">
        <span className="label">设置</span>
        <h1>原点宇宙控制台</h1>
        <p>音效、风铃音量、动效强度和本地 mock 数据都在这里。</p>
      </header>
      <div className="settings-grid">
        <section className="glass-panel">
          <h2>音效开关</h2>
          <label className="switch"><input type="checkbox" checked={settings.soundEnabled} onChange={(e) => save({ ...settings, soundEnabled: e.target.checked })} /> 风铃 / 玻璃 / 魔法生成音</label>
        </section>
        <section className="glass-panel">
          <h2>风铃音量</h2>
          <input type="range" min="0" max="1" step="0.01" value={settings.volume} onChange={(e) => save({ ...settings, volume: Number(e.target.value) })} />
        </section>
        <section className="glass-panel">
          <h2>动效强度</h2>
          <input type="range" min="0.2" max="1" step="0.05" value={settings.motion} onChange={(e) => save({ ...settings, motion: Number(e.target.value) })} />
        </section>
        <section className="glass-panel">
          <h2>清空本地 mock 数据</h2>
          <button className="danger" onClick={() => { resetData(); app.refresh(); }}>恢复初始数据</button>
        </section>
        <section className="glass-panel about">
          <h2>关于项目</h2>
          <p>原点日报机 × 原点宇宙：前台是 AI 报纸打卡机，后台是沉淀人、作品、关系的社区星图。</p>
        </section>
      </div>
    </section>
  );
}
