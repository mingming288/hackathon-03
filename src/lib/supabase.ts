/**
 * Supabase 客户端配置
 *
 * 使用 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 环境变量
 * 前端使用 anon key，通过 RLS 策略控制访问权限
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY 未配置，将降级到 localStorage 模式",
  );
}

/** Supabase 客户端（可能为 null，表示未配置） */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/** 检查 Supabase 是否可用 */
export function isSupabaseReady(): boolean {
  return supabase !== null;
}
