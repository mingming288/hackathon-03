import { initialData } from "./mockData";
import type { AppData, AppSettings, Newspaper, Project, Relation, User } from "./types";

const KEY = "origin-daily-universe-data-v1";

export function loadData(): AppData {
  const raw = localStorage.getItem(KEY);
  if (!raw) return structuredClone(initialData);
  try {
    return { ...structuredClone(initialData), ...JSON.parse(raw) };
  } catch {
    return structuredClone(initialData);
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("origin-data-change"));
}

export function resetData() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("origin-data-change"));
}

// 一次性迁移:把改默认值之前生成的旧海报全部刷成 published,使其补上头版墙。
const MIGRATION_KEY = "origin-daily-publish-migration-v1";

export function runPublishMigration() {
  if (localStorage.getItem(MIGRATION_KEY)) return;
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw) as Partial<AppData>;
      if (Array.isArray(data.newspapers)) {
        data.newspapers = data.newspapers.map((paper) => ({ ...paper, published: true }));
        localStorage.setItem(KEY, JSON.stringify(data));
      }
    } catch {
      // 解析失败则跳过,不阻塞启动
    }
  }
  localStorage.setItem(MIGRATION_KEY, "done");
}

export function upsertGenerated(payload: {
  user: User;
  project: Project;
  newspaper: Newspaper;
  relation?: Relation;
}) {
  const data = loadData();
  data.users = [payload.user, ...data.users.filter((item) => item.user_id !== payload.user.user_id)];
  data.projects = [payload.project, ...data.projects.filter((item) => item.project_id !== payload.project.project_id)];
  data.newspapers = [payload.newspaper, ...data.newspapers.filter((item) => item.newspaper_id !== payload.newspaper.newspaper_id)];
  if (payload.relation) {
    data.relations = [payload.relation, ...data.relations.filter((item) => item.relation_id !== payload.relation?.relation_id)];
  }
  saveData(data);
}

export function updateNewspaper(id: string, patch: Partial<Newspaper>) {
  const data = loadData();
  data.newspapers = data.newspapers.map((paper) => (paper.newspaper_id === id ? { ...paper, ...patch } : paper));
  saveData(data);
}

export function updateSettings(settings: AppSettings) {
  const data = loadData();
  data.settings = settings;
  saveData(data);
}

// ── 观众模式:不进入原点宇宙的共享图谱(星图/作品集),单独存放,仅结果页读取 ──
const AUDIENCE_KEY = "origin-daily-audience-papers-v1";

export function saveAudiencePaper(newspaper: Newspaper) {
  let list: Newspaper[] = [];
  try {
    list = JSON.parse(localStorage.getItem(AUDIENCE_KEY) ?? "[]");
  } catch {
    list = [];
  }
  const next = [newspaper, ...list.filter((p) => p.newspaper_id !== newspaper.newspaper_id)];
  localStorage.setItem(AUDIENCE_KEY, JSON.stringify(next));
}

export function getAudiencePaper(id: string): Newspaper | undefined {
  try {
    const list: Newspaper[] = JSON.parse(localStorage.getItem(AUDIENCE_KEY) ?? "[]");
    return list.find((p) => p.newspaper_id === id);
  } catch {
    return undefined;
  }
}
