import type { GenerateInput, Newspaper, Project, User } from "../types";
import { toFrontendStyle } from "./styleMap";
import type { GenerateResponse } from "./client";

function id(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function rand(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

// 后端 GenerateResponse + 用户输入 → 前端三件套(User / Project / Newspaper)
// 生成结果会经 upsertGenerated 落入 localStorage,出现在原点宇宙
export function adaptToEntities(
  resp: GenerateResponse,
  input: GenerateInput,
): { user: User; project: Project; newspaper: Newspaper } {
  const copy = resp.poster_copy;
  const userId = id("u");
  const projectId = id("p");
  const newspaperId = id("n");

  const columns = copy.columns ?? [];
  const highlights = columns.map((c) => c.title).filter(Boolean);
  const summary = columns[0]?.body || copy.subheadline || "";
  const future = copy.easter_egg || columns[2]?.body || `一年后，${input.projectName} 仍在原点宇宙发光。`;

  const newspaper: Newspaper = {
    newspaper_id: newspaperId,
    title: copy.headline || `${input.projectName} 登上原点日报`,
    subtitle: copy.subheadline || `${input.name} · ${input.teamName}`,
    imageUrl: resp.image_url,
    projectSummary: summary,
    editorComment: copy.editor_comment || "",
    tags: copy.tags?.length ? copy.tags : [input.templateStyle.replace("风", "")],
    shareQuote: copy.share_line || "我被写进了黑客松头版。",
    futureHeadline: future,
    templateStyle: toFrontendStyle(resp.style),
    createdAt: new Date().toISOString(),
    userId,
    projectId,
    teamName: input.teamName || "未命名团队",
    highlights: highlights.length ? highlights : ["现场生成", "AI 主编锐评", "沉淀进原点宇宙"],
    published: true,
    heat: rand(20, 80),
    aiRecommended: false,
    futureScore: rand(60, 95),
  };

  const project: Project = {
    project_id: projectId,
    name: input.projectName || "未命名作品",
    oneSentence: copy.subheadline || summary,
    description: summary,
    documentText: columns.map((c) => `${c.title}：${c.body}`).join("\n"),
    tags: newspaper.tags,
    techStack: [],
    track: "黑客松",
    memberIds: [userId],
    demoLink: "",
    githubLink: "",
    newspaperId,
    planetOrbitUserId: userId,
  };

  const user: User = {
    user_id: userId,
    name: input.name || "匿名参赛者",
    avatar: (input.name || "?").slice(0, 1),
    role: input.role || "参赛者",
    skills: [],
    bio: `${input.teamName || "团队"} · ${input.role || "参赛者"}`,
    contact: "",
    projectIds: [projectId],
    teamIds: [],
    starBrightness: rand(55, 95),
    position: { x: rand(-450, 450), y: rand(-300, 300), z: rand(-300, 200) },
  };

  return { user, project, newspaper };
}
