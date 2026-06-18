import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { Collection } from "./routes/Collection";
import { Generate } from "./routes/Generate";
import { Home } from "./routes/Home";
import { Profile } from "./routes/Profile";
import { Project } from "./routes/Project";
import { Relation } from "./routes/Relation";
import { Result } from "./routes/Result";
import { Settings } from "./routes/Settings";
import { Universe } from "./routes/Universe";
import { Wall } from "./routes/Wall";
import { loadData } from "./storage";
import type { AppData } from "./types";

export type Route =
  | { name: "home" }
  | { name: "generate" }
  | { name: "result"; newspaperId: string }
  | { name: "universe" }
  | { name: "profile"; userId: string }
  | { name: "project"; projectId: string }
  | { name: "relation"; relationId: string }
  | { name: "collection" }
  | { name: "wall" }
  | { name: "settings" };

function parseRoute(pathname: string): Route {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "generate") return { name: "generate" };
  if (parts[0] === "result" && parts[1]) return { name: "result", newspaperId: parts[1] };
  if (parts[0] === "universe") return { name: "universe" };
  if (parts[0] === "profile" && parts[1]) return { name: "profile", userId: parts[1] };
  if (parts[0] === "project" && parts[1]) return { name: "project", projectId: parts[1] };
  if (parts[0] === "relation" && parts[1]) return { name: "relation", relationId: parts[1] };
  if (parts[0] === "collection") return { name: "collection" };
  if (parts[0] === "wall") return { name: "wall" };
  if (parts[0] === "settings") return { name: "settings" };
  return { name: "home" };
}

export function pathFor(route: Route | string) {
  if (typeof route === "string") return route;
  if (route.name === "home") return "/";
  if (route.name === "generate") return "/generate";
  if (route.name === "result") return `/result/${route.newspaperId}`;
  if (route.name === "universe") return "/universe";
  if (route.name === "profile") return `/profile/${route.userId}`;
  if (route.name === "project") return `/project/${route.projectId}`;
  if (route.name === "relation") return `/relation/${route.relationId}`;
  if (route.name === "collection") return "/collection";
  if (route.name === "wall") return "/wall";
  return "/settings";
}

export type AppContextValue = {
  data: AppData;
  refresh: () => void;
  navigate: (route: Route | string) => void;
};

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(location.pathname));
  const [data, setData] = useState<AppData>(() => loadData());

  const refresh = () => setData(loadData());
  const navigate = (target: Route | string) => {
    const path = pathFor(target);
    history.pushState(null, "", path);
    setRoute(parseRoute(path));
    setData(loadData());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const onPop = () => setRoute(parseRoute(location.pathname));
    const onData = () => setData(loadData());
    window.addEventListener("popstate", onPop);
    window.addEventListener("origin-data-change", onData);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("origin-data-change", onData);
    };
  }, []);

  const ctx = useMemo(() => ({ data, refresh, navigate }), [data]);
  const page =
    route.name === "home" ? <Home app={ctx} /> :
    route.name === "generate" ? <Generate app={ctx} /> :
    route.name === "result" ? <Result app={ctx} newspaperId={route.newspaperId} /> :
    route.name === "universe" ? <Universe app={ctx} /> :
    route.name === "profile" ? <Profile app={ctx} userId={route.userId} /> :
    route.name === "project" ? <Project app={ctx} projectId={route.projectId} /> :
    route.name === "relation" ? <Relation app={ctx} relationId={route.relationId} /> :
    route.name === "collection" ? <Collection app={ctx} /> :
    route.name === "wall" ? <Wall app={ctx} /> :
    <Settings app={ctx} />;

  return <AppShell app={ctx} active={route.name}>{page}</AppShell>;
}
