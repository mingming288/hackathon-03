import { useEffect } from "react";
import type { AppContextValue } from "../App";

export function Home({ app }: { app: AppContextValue }) {
  // 因为现在将完整的沉浸式流程 (Landing -> Zoom -> Flash -> Chat) 
  // 全部合并到了 Generate.tsx 中，以保证状态机切换时没有路由跳转导致的闪屏。
  // 所以访问首页时，我们直接重定向到 generate 页面（即我们新的沉浸式入口）。
  useEffect(() => {
    app.navigate("/generate");
  }, [app]);

  return null;
}
