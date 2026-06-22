// 测试 storage 逻辑
const KEY = "origin-daily-universe-data-v1";
const MIGRATION_KEY = "origin-daily-publish-migration-v1";

console.log("=== 检查 localStorage ===");
console.log("DATA_KEY 存在:", localStorage.getItem(KEY) !== null);
console.log("MIGRATION_KEY 存在:", localStorage.getItem(MIGRATION_KEY) !== null);

const raw = localStorage.getItem(KEY);
if (raw) {
  try {
    const data = JSON.parse(raw);
    console.log("=== localStorage 中的数据 ===");
    console.log("newspapers 数量:", data.newspapers?.length || 0);
    console.log("projects 数量:", data.projects?.length || 0);
    console.log("users 数量:", data.users?.length || 0);
  } catch (e) {
    console.log("解析失败:", e);
  }
} else {
  console.log("localStorage 中没有数据");
}

// 检查 initialData
console.log("\n=== 检查 initialData ===");
console.log("initialData 应该有 2 条 newspapers");
