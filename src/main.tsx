import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { runPublishMigration } from "./storage";
import "./styles.css";

// 启动前跑一次:把旧海报补成 published(幂等,带标记位)。
runPublishMigration();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
