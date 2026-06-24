/**
 * Supabase 数据库服务层
 *
 * 提供 users / projects / newspapers / relations / tags / settings 的 CRUD
 * 所有函数在网络不可用时会抛出异常，由调用方决定是否降级到 localStorage
 */
import { supabase, isSupabaseReady } from "./supabase";
import type {
  User,
  Project,
  Newspaper,
  Relation,
  Tag,
  AppSettings,
} from "../types";

// ──────────────────────────────────────────────
// 通用工具
// ──────────────────────────────────────────────

/** 检查网络是否在线 */
function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

/** 前端 snake_case ↔ camelCase 转换（Supabase 返回 snake_case） */
function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  }
  return out;
}

function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const snake = k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    out[snake] = v;
  }
  return out;
}

// ──────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────

export async function fetchUsers(): Promise<User[]> {
  if (!isSupabaseReady() || !isOnline()) return [];
  const { data, error } = await supabase!.from("users").select("*");
  if (error) throw error;
  return (data ?? []).map((row) => snakeToCamel(row) as unknown as User);
}

export async function upsertUser(user: User): Promise<void> {
  if (!isSupabaseReady() || !isOnline()) return;
  const row = camelToSnake(user as unknown as Record<string, unknown>);
  const { error } = await supabase!.from("users").upsert(row, {
    onConflict: "user_id",
  });
  if (error) throw error;
}

export async function upsertUsers(users: User[]): Promise<void> {
  if (!isSupabaseReady() || !isOnline() || !users.length) return;
  const rows = users.map((u) =>
    camelToSnake(u as unknown as Record<string, unknown>),
  );
  const { error } = await supabase!.from("users").upsert(rows, {
    onConflict: "user_id",
  });
  if (error) throw error;
}

// ──────────────────────────────────────────────
// Projects
// ──────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  if (!isSupabaseReady() || !isOnline()) return [];
  const { data, error } = await supabase!.from("projects").select("*");
  if (error) throw error;
  return (data ?? []).map((row) => snakeToCamel(row) as unknown as Project);
}

export async function upsertProject(project: Project): Promise<void> {
  if (!isSupabaseReady() || !isOnline()) return;
  const row = camelToSnake(project as unknown as Record<string, unknown>);
  const { error } = await supabase!.from("projects").upsert(row, {
    onConflict: "project_id",
  });
  if (error) throw error;
}

export async function upsertProjects(projects: Project[]): Promise<void> {
  if (!isSupabaseReady() || !isOnline() || !projects.length) return;
  const rows = projects.map((p) =>
    camelToSnake(p as unknown as Record<string, unknown>),
  );
  const { error } = await supabase!.from("projects").upsert(rows, {
    onConflict: "project_id",
  });
  if (error) throw error;
}

// ──────────────────────────────────────────────
// Newspapers
// ──────────────────────────────────────────────

export async function fetchNewspapers(): Promise<Newspaper[]> {
  if (!isSupabaseReady() || !isOnline()) return [];
  const { data, error } = await supabase!.from("newspapers").select("*");
  if (error) throw error;
  return (data ?? []).map(
    (row) => snakeToCamel(row) as unknown as Newspaper,
  );
}

export async function upsertNewspaper(newspaper: Newspaper): Promise<void> {
  if (!isSupabaseReady() || !isOnline()) return;
  const row = camelToSnake(newspaper as unknown as Record<string, unknown>);
  const { error } = await supabase!.from("newspapers").upsert(row, {
    onConflict: "newspaper_id",
  });
  if (error) throw error;
}

export async function upsertNewspapers(
  newspapers: Newspaper[],
): Promise<void> {
  if (!isSupabaseReady() || !isOnline() || !newspapers.length) return;
  const rows = newspapers.map((n) =>
    camelToSnake(n as unknown as Record<string, unknown>),
  );
  const { error } = await supabase!.from("newspapers").upsert(rows, {
    onConflict: "newspaper_id",
  });
  if (error) throw error;
}

// ──────────────────────────────────────────────
// Relations
// ──────────────────────────────────────────────

export async function fetchRelations(): Promise<Relation[]> {
  if (!isSupabaseReady() || !isOnline()) return [];
  const { data, error } = await supabase!.from("relations").select("*");
  if (error) throw error;
  return (data ?? []).map(
    (row) => snakeToCamel(row) as unknown as Relation,
  );
}

export async function upsertRelation(relation: Relation): Promise<void> {
  if (!isSupabaseReady() || !isOnline()) return;
  const row = camelToSnake(relation as unknown as Record<string, unknown>);
  const { error } = await supabase!.from("relations").upsert(row, {
    onConflict: "relation_id",
  });
  if (error) throw error;
}

export async function upsertRelations(relations: Relation[]): Promise<void> {
  if (!isSupabaseReady() || !isOnline() || !relations.length) return;
  const rows = relations.map((r) =>
    camelToSnake(r as unknown as Record<string, unknown>),
  );
  const { error } = await supabase!.from("relations").upsert(rows, {
    onConflict: "relation_id",
  });
  if (error) throw error;
}

// ──────────────────────────────────────────────
// Tags
// ──────────────────────────────────────────────

export async function fetchTags(): Promise<Tag[]> {
  if (!isSupabaseReady() || !isOnline()) return [];
  const { data, error } = await supabase!.from("tags").select("*");
  if (error) throw error;
  return (data ?? []).map((row) => snakeToCamel(row) as unknown as Tag);
}

export async function upsertTags(tags: Tag[]): Promise<void> {
  if (!isSupabaseReady() || !isOnline() || !tags.length) return;
  const rows = tags.map((t) =>
    camelToSnake(t as unknown as Record<string, unknown>),
  );
  const { error } = await supabase!.from("tags").upsert(rows, {
    onConflict: "tag_id",
  });
  if (error) throw error;
}

// ──────────────────────────────────────────────
// User Settings
// ──────────────────────────────────────────────

export async function fetchUserSettings(): Promise<AppSettings | null> {
  if (!isSupabaseReady() || !isOnline()) return null;
  // 使用固定 user_id "default"（单用户模式）
  const { data, error } = await supabase!
    .from("user_settings")
    .select("*")
    .eq("user_id", "default")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    soundEnabled: (data.sound_enabled as boolean) ?? true,
    volume: (data.volume as number) ?? 0.42,
    motion: (data.motion as number) ?? 0.8,
  };
}

export async function upsertUserSettings(
  settings: AppSettings,
): Promise<void> {
  if (!isSupabaseReady() || !isOnline()) return;
  const row = {
    user_id: "default",
    sound_enabled: settings.soundEnabled,
    volume: settings.volume,
    motion: settings.motion,
  };
  const { error } = await supabase!.from("user_settings").upsert(row, {
    onConflict: "user_id",
  });
  if (error) throw error;
}
