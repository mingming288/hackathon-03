import type { GenerateInput } from "./types";

export function mockAIGenerateNewspaper(input: GenerateInput) {
  const seed = input.projectIntro || `${input.projectName}正在黑客松现场被写成产品发布会头版。`;
  const tags = Array.from(
    new Set([
      input.role.includes("AI") ? "AI互动装置" : "黑客松作品",
      seed.includes("社交") || seed.includes("关系") ? "黑客松社交" : "现场发布",
      seed.includes("图") || seed.includes("宇宙") ? "原点宇宙" : "产品发布会",
      input.templateStyle.replace("风", ""),
    ]),
  );

  return {
    title: `${input.projectName}登上原点日报：${input.teamName}把灵感做成现场发布会`,
    subtitle: `${input.name}以${input.role}身份，把 48 小时里的混乱、协作和亮点压缩成一张可转发的头版。`,
    oneSentence: `${input.projectName}让黑客松作品在路演前被看见、被理解、被收藏。`,
    projectSummary: `在${input.eventLocation}，${input.teamName}用${input.projectName}回应了一个真实现场问题：${seed.slice(0, 86)}${seed.length > 86 ? "..." : ""}`,
    editorComment: `AI 主编锐评：${input.projectName}最有价值的不是“做了一个功能”，而是把${input.name}、团队角色和作品关系一起留在原点宇宙。`,
    highlights: [
      "把参赛照片转化为产品发布会主视觉",
      "用 AI 主编口吻提炼项目高光和传播标题",
      "生成后自动沉淀为作品行星、参赛者恒星和队友星链",
    ],
    tags,
    shareQuote: `我被写进了黑客松头版，也在原点宇宙留下了一颗恒星。`,
    futureHeadline: `一年后，${input.projectName}成为黑客松作品沉淀与人脉拓展的新入口`,
  };
}
