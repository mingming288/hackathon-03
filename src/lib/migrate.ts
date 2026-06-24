/**
 * 数据迁移模块
 *
 * 首次连接 Supabase 时，将 localStorage 中的已有数据批量上传
 * 迁移完成后设置标记，避免重复执行
 */
import { isSupabaseReady } from "./supabase";
import {
  upsertUsers,
  upsertProjects,
  upsertNewspapers,
  upsertRelations,
  upsertTags,
  upsertUserSettings,
} from "./db";
import { isOnline } from "./network";
import type { AppData } from "../types";

const MIGRATION_KEY = "origin-supabase-migration-v1";

/** 检查是否已执行过迁移 */
function isMigrated(): boolean {
  return localStorage.getItem(MIGRATION_KEY) === "done";
}

/** 标记迁移完成 */
function markMigrated(): void {
  localStorage.setItem(MIGRATION_KEY, "done");
}

/**
 * 执行一次性数据迁移
 * 将 localStorage 中的数据上传到 Supabase
 */
export async function migrateToSupabase(
  localData: AppData,
): Promise<boolean> {
  // 条件检查
  if (!isSupabaseReady()) {
    console.log("[Migration] Supabase 未配置，跳过迁移");
    return false;
  }
  if (!isOnline()) {
    console.log("[Migration] 离线状态，跳过迁移");
    return false;
  }
  if (isMigrated()) {
    console.log("[Migration] 已迁移过，跳过");
    return false;
  }

  // 检查 localStorage 是否有数据
  const hasLocalData =
    localData.users.length > 5 || // 超过默认的 5 个用户
    localData.projects.length > 3 || // 超过默认的 3 个项目
    localData.newspapers.length > 2; // 超过默认的 2 个报纸

  if (!hasLocalData) {
    console.log("[Migration] localStorage 无需迁移的数据");
    markMigrated();
    return false;
  }

  console.log("[Migration] 开始迁移 localStorage → Supabase...");
  console.log(
    `[Migration] 数据量: ${localData.users.length} users, ${localData.projects.length} projects, ${localData.newspapers.length} newspapers, ${localData.relations.length} relations`,
  );

  try {
    // 分批上传，避免一次性写入过多数据
    if (localData.users.length > 0) {
      await upsertUsers(localData.users);
      console.log(`[Migration] ✓ ${localData.users.length} users 已迁移`);
    }

    if (localData.projects.length > 0) {
      await upsertProjects(localData.projects);
      console.log(
        `[Migration] ✓ ${localData.projects.length} projects 已迁移`,
      );
    }

    if (localData.newspapers.length > 0) {
      await upsertNewspapers(localData.newspapers);
      console.log(
        `[Migration] ✓ ${localData.newspapers.length} newspapers 已迁移`,
      );
    }

    if (localData.relations.length > 0) {
      await upsertRelations(localData.relations);
      console.log(
        `[Migration] ✓ ${localData.relations.length} relations 已迁移`,
      );
    }

    if (localData.tags.length > 0) {
      await upsertTags(localData.tags);
      console.log(`[Migration] ✓ ${localData.tags.length} tags 已迁移`);
    }

    await upsertUserSettings(localData.settings);
    console.log("[Migration] ✓ settings 已迁移");

    markMigrated();
    console.log("[Migration] 迁移完成！");
    return true;
  } catch (error) {
    console.error("[Migration] 迁移失败:", error);
    // 不标记为已迁移，下次重试
    return false;
  }
}
