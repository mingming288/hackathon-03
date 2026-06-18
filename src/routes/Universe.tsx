import type { AppContextValue } from "../App";
import { UniverseMap } from "../components/UniverseMap";

export function Universe({ app }: { app: AppContextValue }) {
  return (
    <section className="page universe-page" style={{ padding: 0, width: "100%", height: "100vh", overflow: "hidden" }}>
      <UniverseMap app={app} />
    </section>
  );
}
