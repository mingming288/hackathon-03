// 这个脚本需要在浏览器控制台中运行
// 检查 localStorage 中的数据
const KEY = "origin-daily-universe-data-v1";
const data = localStorage.getItem(KEY);
if (data) {
  const parsed = JSON.parse(data);
  console.log("localStorage 中有数据:");
  console.log("newspapers 数量:", parsed.newspapers?.length || 0);
  console.log("projects 数量:", parsed.projects?.length || 0);
  console.log("users 数量:", parsed.users?.length || 0);
} else {
  console.log("localStorage 中没有数据，将使用 initialData");
}
