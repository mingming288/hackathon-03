import type { AppContextValue } from "../App";
import type { Project, User } from "../types";

export function MiniUser({ user, app }: { user: User; app: AppContextValue }) {
  return (
    <button className="mini-card" type="button" onClick={() => app.navigate(`/profile/${user.user_id}`)}>
      <span className="avatar">{user.avatar}</span>
      <b>{user.name}</b>
      <small>{user.role}</small>
    </button>
  );
}

export function MiniProject({ project, app }: { project: Project; app: AppContextValue }) {
  return (
    <button className="mini-card project" type="button" onClick={() => app.navigate(`/project/${project.project_id}`)}>
      <b>{project.name}</b>
      <small>{project.oneSentence}</small>
      <span>{project.track}</span>
    </button>
  );
}
