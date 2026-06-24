/**
 * 种子数据迁移脚本
 *
 * 将 mockData.ts 中的初始数据写入 Supabase
 * 使用方法：在浏览器控制台执行 seedDatabase()
 */
import { isSupabaseReady, supabase } from "./supabase";
import { initialData } from "../mockData";

/** 检查是否已经导入过种子数据 */
const SEED_KEY = "origin-seed-data-v1";
function isSeeded(): boolean {
  return localStorage.getItem(SEED_KEY) === "done";
}

function markSeeded(): void {
  localStorage.setItem(SEED_KEY, "done");
}

/**
 * 将种子数据导入 Supabase
 */
export async function seedDatabase(): Promise<boolean> {
  if (!isSupabaseReady()) {
    console.error("[Seed] Supabase 未配置，请检查 .env 文件");
    return false;
  }

  if (isSeeded()) {
    console.log("[Seed] 种子数据已导入过，跳过");
    return true;
  }

  console.log("[Seed] 开始导入种子数据...");
  console.log(`[Seed] 数据量: ${initialData.users.length} users, ${initialData.projects.length} projects, ${initialData.newspapers.length} newspapers, ${initialData.relations.length} relations, ${initialData.tags.length} tags`);

  try {
    // 1. 导入 users
    console.log("[Seed] 导入 users...");
    const usersRows = initialData.users.map(u => ({
      user_id: u.user_id,
      name: u.name,
      avatar: u.avatar,
      role: u.role,
      skills: u.skills,
      bio: u.bio,
      contact: u.contact,
      project_ids: u.projectIds,
      team_ids: u.teamIds,
      star_brightness: u.starBrightness,
      position: u.position,
    }));
    const { error: usersError } = await supabase!.from("users").upsert(usersRows, { onConflict: "user_id" });
    if (usersError) throw new Error(`users 导入失败: ${usersError.message}`);
    console.log(`[Seed] ✓ ${initialData.users.length} users 导入成功`);

    // 2. 导入 projects
    console.log("[Seed] 导入 projects...");
    const projectsRows = initialData.projects.map(p => ({
      project_id: p.project_id,
      name: p.name,
      one_sentence: p.oneSentence,
      description: p.description,
      document_text: p.documentText,
      tags: p.tags,
      tech_stack: p.techStack,
      track: p.track,
      member_ids: p.memberIds,
      demo_link: p.demoLink,
      github_link: p.githubLink,
      newspaper_id: p.newspaperId,
      planet_orbit_user_id: p.planetOrbitUserId,
    }));
    const { error: projectsError } = await supabase!.from("projects").upsert(projectsRows, { onConflict: "project_id" });
    if (projectsError) throw new Error(`projects 导入失败: ${projectsError.message}`);
    console.log(`[Seed] ✓ ${initialData.projects.length} projects 导入成功`);

    // 3. 导入 newspapers
    console.log("[Seed] 导入 newspapers...");
    const newspapersRows = initialData.newspapers.map(n => ({
      newspaper_id: n.newspaper_id,
      title: n.title,
      subtitle: n.subtitle,
      image_url: n.imageUrl,
      project_summary: n.projectSummary,
      editor_comment: n.editorComment,
      tags: n.tags,
      share_quote: n.shareQuote,
      future_headline: n.futureHeadline,
      template_style: n.templateStyle,
      created_at: n.createdAt,
      user_id: n.userId,
      project_id: n.projectId,
      team_name: n.teamName,
      highlights: n.highlights,
      published: n.published,
      heat: n.heat,
      ai_recommended: n.aiRecommended,
      future_score: n.futureScore,
    }));
    const { error: newspapersError } = await supabase!.from("newspapers").upsert(newspapersRows, { onConflict: "newspaper_id" });
    if (newspapersError) throw new Error(`newspapers 导入失败: ${newspapersError.message}`);
    console.log(`[Seed] ✓ ${initialData.newspapers.length} newspapers 导入成功`);

    // 4. 导入 relations
    console.log("[Seed] 导入 relations...");
    const relationsRows = initialData.relations.map(r => ({
      relation_id: r.relation_id,
      user_a: r.userA,
      user_b: r.userB,
      relation_type: r.relationType,
      relation_title: r.relationTitle,
      relation_color: r.relationColor,
      project_id: r.projectId,
      cooperation_roles: r.cooperationRoles,
      common_tags: r.commonTags,
      cooperation_count: r.cooperationCount,
      weight: r.weight,
    }));
    const { error: relationsError } = await supabase!.from("relations").upsert(relationsRows, { onConflict: "relation_id" });
    if (relationsError) throw new Error(`relations 导入失败: ${relationsError.message}`);
    console.log(`[Seed] ✓ ${initialData.relations.length} relations 导入成功`);

    // 5. 导入 tags
    console.log("[Seed] 导入 tags...");
    const tagsRows = initialData.tags.map(t => ({
      tag_id: t.tag_id,
      name: t.name,
      type: t.type,
    }));
    const { error: tagsError } = await supabase!.from("tags").upsert(tagsRows, { onConflict: "tag_id" });
    if (tagsError) throw new Error(`tags 导入失败: ${tagsError.message}`);
    console.log(`[Seed] ✓ ${initialData.tags.length} tags 导入成功`);

    // 6. 导入 settings
    console.log("[Seed] 导入 settings...");
    const settingsRow = {
      user_id: "default",
      sound_enabled: initialData.settings.soundEnabled,
      volume: initialData.settings.volume,
      motion: initialData.settings.motion,
    };
    const { error: settingsError } = await supabase!.from("user_settings").upsert(settingsRow, { onConflict: "user_id" });
    if (settingsError) throw new Error(`settings 导入失败: ${settingsError.message}`);
    console.log("[Seed] ✓ settings 导入成功");

    markSeeded();
    console.log("[Seed] ==============================");
    console.log("[Seed] ✅ 所有种子数据导入完成！");
    console.log("[Seed] ==============================");
    return true;

  } catch (error) {
    console.error("[Seed] 导入失败:", error);
    return false;
  }
}

/**
 * 清除种子数据标记（允许重新导入）
 */
export function resetSeedFlag(): void {
  localStorage.removeItem(SEED_KEY);
  console.log("[Seed] 种子数据标记已清除，下次执行 seedDatabase() 将重新导入");
}
