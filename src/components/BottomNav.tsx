import type { AppContextValue } from "../App";

const items = [
  { key: "generate", label: "生成", icon: "✦", path: "/generate" },
  { key: "collection", label: "作品集", icon: "▣", path: "/collection" },
  { key: "universe", label: "宇宙", icon: "◎", path: "/universe" },
  { key: "wall", label: "头版墙", icon: "◫", path: "/wall" },
  { key: "settings", label: "设置", icon: "⌁", path: "/settings" },
];

export function BottomNav({ app, active }: { app: AppContextValue; active: string }) {
  return (
    <nav className="bottom-nav" aria-label="底部导航栏">
      {items.map((item) => (
        <button
          key={item.key}
          className={active === item.key ? "active" : ""}
          type="button"
          onClick={() => app.navigate(item.path)}
        >
          <span className="tab-icon">{item.icon}</span>
          <span className="tab-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
