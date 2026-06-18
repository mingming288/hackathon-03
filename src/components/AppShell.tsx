import type { ReactNode } from "react";
import type { AppContextValue } from "../App";
import { BottomNav } from "./BottomNav";

export function LinkButton({
  app,
  to,
  children,
  className = "",
}: {
  app: AppContextValue;
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button className={className} type="button" onClick={() => app.navigate(to)}>
      {children}
    </button>
  );
}

export function AppShell({
  app,
  active,
  children,
}: {
  app: AppContextValue;
  active: string;
  children: ReactNode;
}) {
  const titles: Record<string, string> = {
    home: "Hackaverse 原点宇宙",
    generate: "生成海报",
    result: "原点日报",
    universe: "宇宙关系网",
    profile: "参赛者恒星",
    project: "作品行星",
    relation: "星链关系",
    collection: "作品集",
    wall: "今日头版墙",
    settings: "设置",
  };

  return (
    <div className={`app app-${active}`}>
      <div className="starscape" />
      <section className="mini-program" aria-label="原点日报机小程序 Demo">
        <header className={`mini-titlebar ${active === "home" || active === "generate" ? "transparent" : ""}`}>
          {active !== "home" && active !== "generate" && active !== "universe" ? (
            <button className="mini-back" type="button" onClick={() => history.length > 1 ? history.back() : app.navigate("/")}>‹</button>
          ) : <span />}
          <b>{titles[active] ?? "原点日报机"}</b>
          {active === "universe" ? (
            <button 
              className="u-top-filter-btn" 
              onClick={() => {
                const event = new CustomEvent("toggle-universe-filter");
                window.dispatchEvent(event);
              }}
            >
              ◎ 筛选
            </button>
          ) : (
            <div className="mini-capsule" aria-label="小程序胶囊">
              <span />
              <i />
            </div>
          )}
        </header>
        <main className="mini-content">{children}</main>
        <BottomNav app={app} active={active} />
      </section>
    </div>
  );
}
