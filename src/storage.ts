/**
 * 数据存储层
 *
 * 策略：Supabase（云端）+ localStorage（离线缓存）双写
 * - 读取：优先 Supabase，失败则回退 localStorage
 * - 写入：同时写入 Supabase 和 localStorage（双写）
 * - 离线：只写 localStorage，网络恢复后同步
 */
import { initialData } from "./mockData";
import type { AppData, AppSettings, Newspaper, Project, Relation, User } from "./types";
import { isSupabaseReady } from "./lib/supabase";
import {
  fetchUsers,
  fetchProjects,
  fetchNewspapers,
  fetchRelations,
  fetchTags,
  fetchUserSettings,
  upsertUsers,
  upsertProjects,
  upsertNewspapers,
  upsertRelations,
  upsertUserSettings,
} from "./lib/db";
import { isOnline } from "./lib/network";
import { migrateToSupabase } from "./lib/migrate";

// ── localStorage 常量 ──
const KEY = "origin-daily-universe-data-v1";
const AUDIENCE_KEY = "origin-daily-audience-papers-v1";

// ── 初始化标记 ──
const INIT_KEY = "origin-supabase-initialized-v1";
let initialized = false;

// ──────────────────────────────────────────────
// localStorage 工具函数
// ──────────────────────────────────────────────

/** 安全读取 localStorage，解析失败时返回默认值 */
function safeGetStorage<T>(key: string, defaultValue: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

/** 写入 localStorage */
function setStorage(key: string, data: unknown): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ──────────────────────────────────────────────
// 核心读取函数
// ──────────────────────────────────────────────

/** 从 localStorage 读取数据（同步，始终可用） */
function loadFromLocalStorage(): AppData {
  const data = safeGetStorage<Partial<AppData>>(KEY, {});
  return { ...structuredClone(initialData), ...data };
}

/** 从 Supabase 读取数据（异步，可能失败） */
async function loadFromSupabase(): Promise<AppData | null> {
  if (!isSupabaseReady() || !isOnline()) return null;

  try {
    const [users, projects, newspapers, relations, tags, settings] =
      await Promise.all([
        fetchUsers(),
        fetchProjects(),
        fetchNewspapers(),
        fetchRelations(),
        fetchTags(),
        fetchUserSettings(),
      ]);

    return {
      users: users.length > 0 ? users : initialData.users,
      projects: projects.length > 0 ? projects : initialData.projects,
      newspapers: newspapers.length > 0 ? newspapers : initialData.newspapers,
      relations: relations.length > 0 ? relations : initialData.relations,
      tags: tags.length > 0 ? tags : initialData.tags,
      settings: settings ?? initialData.settings,
    };
  } catch (error) {
    console.error("[Storage] Supabase 读取失败，降级到 localStorage:", error);
    return null;
  }
}

/**
 * 加载数据（主函数）
 * 策略：优先 Supabase，失败则用 localStorage
 */
export async function loadDataAsync(): Promise<AppData> {
  // 首次初始化：执行数据迁移
  if (!initialized && isSupabaseReady()) {
    initialized = true;
    const localData = loadFromLocalStorage();
    migrateToSupabase(localData).then((migrated) => {
      if (migrated) {
        console.log("[Storage] 迁移完成，刷新数据...");
        // 迁移完成后触发刷新
        window.dispatchEvent(new Event("origin-data-change"));
      }
    });
  }

  // 尝试从 Supabase 加载
  const supabaseData = await loadFromSupabase();
  if (supabaseData) {
    // 成功：同步到 localStorage（保持缓存最新）
    setStorage(KEY, supabaseData);
    return supabaseData;
  }

  // 失败：降级到 localStorage
  console.log("[Storage] 使用 localStorage 数据");
  return loadFromLocalStorage();
}

/**
 * 同步加载数据（保持向后兼容）
 * 用于不需要等待 Supabase 的场景
 */
export function loadData(): AppData {
  return loadFromLocalStorage();
}

// ──────────────────────────────────────────────
// 核心写入函数
// ──────────────────────────────────────────────

/**
 * 保存数据（双写策略）
 * 同时写入 Supabase 和 localStorage
 */
export async function saveDataAsync(data: AppData): Promise<void> {
  // 始终写入 localStorage（保证离线可用）
  setStorage(KEY, data);
  window.dispatchEvent(new Event("origin-data-change"));

  // 异步写入 Supabase（不阻塞 UI）
  if (isSupabaseReady() && isOnline()) {
    try {
      await Promise.all([
        upsertUsers(data.users),
        upsertProjects(data.projects),
        upsertNewspapers(data.newspapers),
        upsertRelations(data.relations),
        upsertUserSettings(data.settings),
      ]);
      console.log("[Storage] Supabase 写入成功");
    } catch (error) {
      console.error("[Storage] Supabase 写入失败（数据已保存到 localStorage）:", error);
    }
  }
}

/**
 * 同步保存数据（保持向后兼容）
 * 只写入 localStorage
 */
export function saveData(data: AppData) {
  setStorage(KEY, data);
  window.dispatchEvent(new Event("origin-data-change"));
}

/**
 * 重置数据
 */
export async function resetDataAsync(): Promise<void> {
  localStorage.removeItem(KEY);
  localStorage.removeItem(INIT_KEY);
  initialized = false;
  window.dispatchEvent(new Event("origin-data-change"));
}

export function resetData() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("origin-data-change"));
}

// ── 一次性迁移:把改默认值之前生成的旧海报全部刷成 published ──
const MIGRATION_KEY = "origin-daily-publish-migration-v1";

export function runPublishMigration() {
  if (localStorage.getItem(MIGRATION_KEY)) return;

  const data = safeGetStorage<Partial<AppData>>(KEY, {});
  if (Array.isArray(data.newspapers)) {
    data.newspapers = data.newspapers.map((paper) => ({ ...paper, published: true }));
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  localStorage.setItem(MIGRATION_KEY, "done");
}

// ── 生成结果入库 ──

/**
 * 插入/更新生成结果（异步版本）
 */
export async function upsertGeneratedAsync(payload: {
  user: User;
  project: Project;
  newspaper: Newspaper;
  relation?: Relation;
}): Promise<void> {
  const data = loadFromLocalStorage();
  data.users = [payload.user, ...data.users.filter((item) => item.user_id !== payload.user.user_id)];
  data.projects = [payload.project, ...data.projects.filter((item) => item.project_id !== payload.project.project_id)];
  data.newspapers = [payload.newspaper, ...data.newspapers.filter((item) => item.newspaper_id !== payload.newspaper.newspaper_id)];
  if (payload.relation) {
    data.relations = [payload.relation, ...data.relations.filter((item) => item.relation_id !== payload.relation?.relation_id)];
  }
  await saveDataAsync(data);
}

/**
 * 插入/更新生成结果（同步版本，保持向后兼容）
 */
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

// ── 更新报纸 ──

export async function updateNewspaperAsync(id: string, patch: Partial<Newspaper>): Promise<void> {
  const data = loadFromLocalStorage();
  data.newspapers = data.newspapers.map((paper) =>
    paper.newspaper_id === id ? { ...paper, ...patch } : paper,
  );
  await saveDataAsync(data);
}

export function updateNewspaper(id: string, patch: Partial<Newspaper>) {
  const data = loadData();
  data.newspapers = data.newspapers.map((paper) =>
    paper.newspaper_id === id ? { ...paper, ...patch } : paper,
  );
  saveData(data);
}

// ── 更新设置 ──

export async function updateSettingsAsync(settings: AppSettings): Promise<void> {
  const data = loadFromLocalStorage();
  data.settings = settings;
  await saveDataAsync(data);
}

export function updateSettings(settings: AppSettings) {
  const data = loadData();
  data.settings = settings;
  saveData(data);
}

// ── 观众模式（保持 localStorage，不进入共享图谱） ──

export function saveAudiencePaper(newspaper: Newspaper) {
  const list = safeGetStorage<Newspaper[]>(AUDIENCE_KEY, []);
  const next = [newspaper, ...list.filter((p) => p.newspaper_id !== newspaper.newspaper_id)];
  localStorage.setItem(AUDIENCE_KEY, JSON.stringify(next));
}

export function getAudiencePaper(id: string): Newspaper | undefined {
  const list = safeGetStorage<Newspaper[]>(AUDIENCE_KEY, []);
  return list.find((p) => p.newspaper_id === id);
}
