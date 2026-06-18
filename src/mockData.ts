import type { AppData } from "./types";

export const initialData: AppData = {
  settings: { soundEnabled: true, volume: 0.42, motion: 0.8 },
  tags: [
    { tag_id: "t-ai", name: "AI", type: "track" },
    { tag_id: "t-social", name: "黑客松社交", type: "project" },
    { tag_id: "t-aigc", name: "AIGC视觉", type: "tech" },
    { tag_id: "t-front", name: "前端", type: "role" },
    { tag_id: "t-agent", name: "Agent", type: "tech" },
  ],
  users: [
    {
      user_id: "u-king",
      name: "King",
      avatar: "K",
      role: "AI 产品经理",
      skills: ["Prompt", "产品叙事", "黑客松运营"],
      bio: "把一次现场生成变成可传播、可沉淀的作品入口。",
      contact: "origin://king",
      projectIds: ["p-daily"],
      teamIds: ["team-origin"],
      starBrightness: 92,
      position: { x: -300, y: -150, z: 100 },
    },
    {
      user_id: "u-lin",
      name: "林澈",
      avatar: "林",
      role: "前端工程师",
      skills: ["React", "星图交互", "动效"],
      bio: "相信关系图谱应该能被点击、能发光，也能帮人找到人。",
      contact: "origin://lin",
      projectIds: ["p-universe"],
      teamIds: ["team-origin"],
      starBrightness: 78,
      position: { x: 200, y: -50, z: -50 },
    },
    {
      user_id: "u-xuan",
      name: "阿璇",
      avatar: "璇",
      role: "视觉设计师",
      skills: ["海报模板", "AIGC视觉", "品牌"],
      bio: "让每个项目都拥有发布会级别的第一眼。",
      contact: "origin://xuan",
      projectIds: ["p-poster"],
      teamIds: ["team-poster"],
      starBrightness: 72,
      position: { x: 400, y: 250, z: -200 },
    },
    {
      user_id: "u-ye",
      name: "叶白",
      avatar: "叶",
      role: "Prompt Designer",
      skills: ["AI主编", "内容生成", "传播标题"],
      bio: "先命名，再报道，最后让它被记住。",
      contact: "origin://ye",
      projectIds: ["p-editor"],
      teamIds: ["team-editor"],
      starBrightness: 66,
      position: { x: -400, y: 300, z: -300 },
    },
  ],
  projects: [
    {
      project_id: "p-daily",
      name: "原点日报机",
      oneSentence: "上传照片和项目材料，生成产品发布会头版。",
      description: "面向黑客松现场的 AI 报纸打卡机，让每个作品拥有可传播的发布时刻。",
      documentText: "AI 主编提炼标题、摘要、锐评、标签，并沉淀到原点宇宙。",
      tags: ["AI互动装置", "黑客松社交", "原点宇宙"],
      techStack: ["React", "Web Audio", "localStorage"],
      track: "AI",
      memberIds: ["u-king", "u-lin"],
      demoLink: "https://demo.local/origin-daily",
      githubLink: "https://github.com/origin/daily",
      newspaperId: "n-daily",
      planetOrbitUserId: "u-king",
    },
    {
      project_id: "p-universe",
      name: "原点宇宙星图",
      oneSentence: "用恒星、行星和星链表达参赛者、作品和合作关系。",
      description: "黑客松结束后，作品不消失，关系继续生长。",
      documentText: "左侧筛选、中央星图、右侧档案，让人和项目都能被继续发现。",
      tags: ["社交图谱", "星图", "前端"],
      techStack: ["React", "SVG", "交互动效"],
      track: "社区",
      memberIds: ["u-lin", "u-king"],
      demoLink: "https://demo.local/origin-universe",
      githubLink: "https://github.com/origin/universe",
      newspaperId: "n-universe",
      planetOrbitUserId: "u-lin",
    },
    {
      project_id: "p-poster",
      name: "未来头版模板",
      oneSentence: "让项目像发布会一样被第一眼记住。",
      description: "把照片、关键词和发布会叙事融合成可转发海报。",
      documentText: "六种模板覆盖复古报纸、未来发布会、JOJO 风、科技星空等风格。",
      tags: ["视觉设计", "AIGC视觉", "报纸"],
      techStack: ["CSS", "AIGC", "模板系统"],
      track: "视觉",
      memberIds: ["u-xuan"],
      demoLink: "https://demo.local/poster",
      githubLink: "https://github.com/origin/poster",
      newspaperId: "n-poster",
      planetOrbitUserId: "u-xuan",
    },
  ],
  newspapers: [
    {
      newspaper_id: "n-daily",
      title: "48 小时后，这台报纸机成为现场社交入口",
      subtitle: "AI 主编把黑客松作品写成产品发布会头版。",
      imageUrl: "",
      projectSummary: "参赛者上传照片与材料，即可获得未来发布会头版，并进入黑客松星图。",
      editorComment: "AI 主编锐评：这不是一张报纸，而是一张进入黑客松历史的门票。",
      tags: ["AI互动装置", "黑客松社交", "原点宇宙"],
      shareQuote: "生成一份头版，进入一座宇宙。",
      futureHeadline: "一年后，原点日报机成为黑客松作品沉淀的新基础设施",
      templateStyle: "复古头版",
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
      userId: "u-king",
      projectId: "p-daily",
      teamName: "原点小队",
      highlights: ["AI 主编审稿", "一键生成头版", "自动进入宇宙"],
      published: true,
      heat: 98,
      aiRecommended: true,
      futureScore: 95,
    },
    {
      newspaper_id: "n-universe",
      title: "他们把队友关系做成了一张会发光的地图",
      subtitle: "恒星、行星、星链，让作品和人都留在现场之后。",
      imageUrl: "",
      projectSummary: "用星图展示参赛者、作品、团队和技术栈之间的合作证据。",
      editorComment: "AI 主编锐评：社交图谱最动人的地方，是让合作关系不再只存在合照里。",
      tags: ["社交图谱", "星图", "前端"],
      shareQuote: "我的队友关系，也是一条发光的星链。",
      futureHeadline: "一年后，原点宇宙成为社区人才与项目图谱",
      templateStyle: "原点宇宙风",
      createdAt: new Date(Date.now() - 7200_000).toISOString(),
      userId: "u-lin",
      projectId: "p-universe",
      teamName: "星图小队",
      highlights: ["拖拽缩放星图", "风铃音阶", "关系推荐"],
      published: true,
      heat: 88,
      aiRecommended: true,
      futureScore: 91,
    },
  ],
  relations: [
    {
      relation_id: "r-king-lin",
      userA: "u-king",
      userB: "u-lin",
      relationType: "teammate",
      relationTitle: "并肩作战的队友",
      relationColor: "#F4D593",
      projectId: "p-daily",
      cooperationRoles: ["AI 产品经理", "前端工程师"],
      commonTags: ["AI互动装置", "黑客松", "原点日报"],
      cooperationCount: 2,
      weight: 82,
    },
    {
      relation_id: "r-lin-xuan",
      userA: "u-lin",
      userB: "u-xuan",
      relationType: "sameTrack",
      relationTitle: "同一片星云里的创造者",
      relationColor: "#8FA8FF",
      projectId: "p-poster",
      cooperationRoles: ["前端工程师", "视觉设计师"],
      commonTags: ["视觉探索", "前端动效"],
      cooperationCount: 1,
      weight: 61,
    },
    {
      relation_id: "r-king-ye",
      userA: "u-king",
      userB: "u-ye",
      relationType: "coreCreator",
      relationTitle: "核心引力伙伴",
      relationColor: "#FFB36A",
      projectId: "p-daily",
      cooperationRoles: ["产品叙事", "Prompt Designer"],
      commonTags: ["AI主编", "内容生成"],
      cooperationCount: 3,
      weight: 95,
    }
  ],
};

const relationColorMap = {
  teammate: "#F4D593",
  trio: "#C9A7FF",
  repeated: "#FFD36A",
  complementary: "#86FFF0",
  sameTrack: "#8FA8FF",
  coreCreator: "#FFB36A",
  recommended: "#9FE7FF"
};

const relationTitleMap = {
  teammate: ["并肩作战的队友", "同频闪耀的搭子", "一起熬夜的战友", "临时结盟的星旅人"],
  trio: ["携手并进的铁三角", "三星共振小队", "稳定发光的三角阵"],
  repeated: ["雷打不动的 Partner", "多次并轨的老队友", "反复同频的宇宙搭档"],
  complementary: ["天生互补的双星系统", "想法与代码的共振", "灵感与执行的双轨道"],
  sameTrack: ["同一片星云里的创造者", "同赛道共振者", "相似脑洞的星际邻居"],
  coreCreator: ["核心引力伙伴", "项目共同点火者", "共创引擎双核心"],
  recommended: ["值得靠近的新恒星", "可能同频的未来队友", "即将并轨的陌生星星"]
};

function getRandomTitle(type: keyof typeof relationTitleMap) {
  const titles = relationTitleMap[type];
  return titles[Math.floor(Math.random() * titles.length)];
}

// 动态生成额外的背景恒星以丰富宇宙深度
const teamNames = ["原点星研究所", "星图小队", "视觉探索者", "AIGC 前沿", "黑客松突击队", "代码诗人", "宇宙拓荒者", "极客联盟"];
const projectNames = ["原点日报机", "原点宇宙星图", "未来头版模板", "Hackaverse Agent", "社交共创图谱"];

const extraUsers = Array.from({ length: 60 }).map((_, i) => {
  const tName = Math.random() > 0.4 ? teamNames[i % teamNames.length] : "";
  const pName = Math.random() > 0.5 ? projectNames[i % projectNames.length] : "";
  
  return {
    user_id: `u-extra-${i}`,
    name: `Star ${i}`,
    avatar: "",
    role: ["前端", "后端", "产品", "设计", "算法", "运营"][i % 6],
    skills: ["React", "AI", "Figma", "Python", "Prompt", "Three.js"],
    bio: "A wandering star in the Hackaverse.",
    contact: "",
    projectIds: pName ? [pName] : [],
    teamIds: tName ? [tName] : [],
    starBrightness: 30 + Math.random() * 40,
    position: {
      x: (Math.random() - 0.5) * 4000,
      y: (Math.random() - 0.5) * 3000,
      z: (Math.random() - 0.5) * 3000 - 500
    }
  };
});
initialData.users.push(...extraUsers);

// 自动生成额外的星链关系（队友关系）
const autoRelations = [];
let relId = 0;
for (let i = 0; i < initialData.users.length; i++) {
  for (let j = i + 1; j < initialData.users.length; j++) {
    const uA = initialData.users[i];
    const uB = initialData.users[j];

    const sharedTeam = uA.teamIds.find(t => uB.teamIds.includes(t));
    const sharedProj = uA.projectIds.find(p => uB.projectIds.includes(p));

    if (sharedTeam || sharedProj) {
      // Limit total connections to avoid too much visual clutter
      if (Math.random() > 0.85) {
        
        let type: keyof typeof relationTitleMap = "teammate";
        if (sharedTeam && sharedProj) type = "repeated";
        else if (uA.role !== uB.role && Math.random() > 0.5) type = "complementary";
        
        autoRelations.push({
          relation_id: `r-auto-${relId++}`,
          userA: uA.user_id,
          userB: uB.user_id,
          relationType: type,
          relationTitle: getRandomTitle(type),
          relationColor: relationColorMap[type],
          projectId: sharedProj || sharedTeam || "黑客松组队",
          cooperationRoles: [uA.role, uB.role],
          commonTags: [uA.skills[0] || "", uB.skills[0] || ""].filter(Boolean),
          cooperationCount: type === "repeated" ? 2 : 1,
          weight: type === "repeated" ? 80 : 50,
        });
      }
    }
  }
}
initialData.relations.push(...autoRelations);
