/**
 * 星链关系工具模块
 *
 * 包含：
 * 1. 智能关系类型判定算法
 * 2. 海报生成时自动创建星链
 * 3. "推荐认识"功能真正创建关系
 * 4. 关系权重计算
 */
import type { Relation, RelationType, User, Project } from "./types";

// ── 关系类型标题池 ──
const RELATION_TITLES: Record<RelationType, string[]> = {
  teammate: ["并肩作战的队友", "同频闪耀的搭子", "一起熬夜的战友", "临时结盟的星旅人"],
  trio: ["携手并进的铁三角", "三星共振小队", "稳定发光的三角阵"],
  repeated: ["雷打不动的 Partner", "多次并轨的老队友", "反复同频的宇宙搭档"],
  complementary: ["天生互补的双星系统", "想法与代码的共振", "灵感与执行的双轨道"],
  sameTrack: ["同一片星云里的创造者", "同赛道共振者", "相似脑洞的星际邻居"],
  coreCreator: ["核心引力伙伴", "项目共同点火者", "共创引擎双核心"],
  recommended: ["值得靠近的新恒星", "可能同频的未来队友", "即将并轨的陌生星星"],
};

// ── 关系类型颜色 ──
const RELATION_COLORS: Record<RelationType, string> = {
  teammate: "#F4D593",
  trio: "#C9A7FF",
  repeated: "#FFD36A",
  complementary: "#86FFF0",
  sameTrack: "#8FA8FF",
  coreCreator: "#FFB36A",
  recommended: "#9FE7FF",
};

/**
 * 智能判定关系类型
 *
 * 判定逻辑（优先级从高到低）：
 * 1. 共享团队 + 共享项目 → repeated（多次合作）
 * 2. 角色完全相同 + 共享项目 → coreCreator（核心共创）
 * 3. 角色不同 + 共享项目 → complementary（技能互补）
 * 4. 仅共享团队 → teammate（队友）
 * 5. 仅共享项目（不同团队）→ sameTrack（同赛道）
 * 6. 无共享但技能重叠 → recommended（推荐认识）
 */
export function determineRelationType(
  userA: User,
  userB: User,
  projects: Project[],
): RelationType {
  const sharedTeam = userA.teamIds.find((t) => userB.teamIds.includes(t));
  const sharedProject = userA.projectIds.find((p) => userB.projectIds.includes(p));

  const sameRole = userA.role === userB.role;
  const skillOverlap = userA.skills.filter((s) => userB.skills.includes(s));

  // 1. 共享团队 + 共享项目 → repeated
  if (sharedTeam && sharedProject) {
    return "repeated";
  }

  // 2. 角色相同 + 共享项目 → coreCreator
  if (sameRole && sharedProject) {
    return "coreCreator";
  }

  // 3. 角色不同 + 共享项目 → complementary
  if (!sameRole && sharedProject) {
    return "complementary";
  }

  // 4. 仅共享团队 → teammate
  if (sharedTeam) {
    return "teammate";
  }

  // 5. 仅共享项目 → sameTrack
  if (sharedProject) {
    return "sameTrack";
  }

  // 6. 技能重叠 → recommended
  if (skillOverlap.length >= 2) {
    return "recommended";
  }

  // 默认 teammate
  return "teammate";
}

/**
 * 计算关系权重
 *
 * 权重公式（0-100）：
 * - 共享团队: +30
 * - 共享项目: +40
 * - 技能重叠: +10 * 重叠数
 * - 角色互补: +20（不同角色）
 * - 合作次数: +5 * 次数
 */
export function calculateRelationWeight(
  userA: User,
  userB: User,
  existingRelation?: Relation,
): number {
  let weight = 0;

  const sharedTeam = userA.teamIds.find((t) => userB.teamIds.includes(t));
  const sharedProject = userA.projectIds.find((p) => userB.projectIds.includes(p));
  const skillOverlap = userA.skills.filter((s) => userB.skills.includes(s));

  if (sharedTeam) weight += 30;
  if (sharedProject) weight += 40;
  if (skillOverlap.length > 0) weight += skillOverlap.length * 10;
  if (userA.role !== userB.role) weight += 20;

  // 如果已有关系，加上合作次数
  if (existingRelation) {
    weight += existingRelation.cooperationCount * 5;
  }

  return Math.min(100, weight);
}

/**
 * 随机获取关系标题
 */
export function getRandomRelationTitle(type: RelationType): string {
  const titles = RELATION_TITLES[type];
  return titles[Math.floor(Math.random() * titles.length)];
}

/**
 * 获取关系颜色
 */
export function getRelationColor(type: RelationType): string {
  return RELATION_COLORS[type];
}

/**
 * 生成唯一关系 ID
 */
function generateRelationId(): string {
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * 查找两个用户之间是否已存在关系
 */
export function findExistingRelation(
  relations: Relation[],
  userIdA: string,
  userIdB: string,
): Relation | undefined {
  return relations.find(
    (r) =>
      (r.userA === userIdA && r.userB === userIdB) ||
      (r.userA === userIdB && r.userB === userIdA),
  );
}

/**
 * 海报生成时自动创建星链关系
 *
 * 规则：
 * - 如果已有关系 → 增加 cooperationCount 和 weight
 * - 如果没有关系 → 创建新关系
 * - 返回创建/更新的关系（可选）
 */
export function createRelationOnGenerate(
  currentUser: User,
  teamMembers: User[],
  project: Project,
  relations: Relation[],
): Relation | null {
  // 如果没有团队成员，不创建关系
  if (teamMembers.length === 0) return null;

  // 为当前用户和每个团队成员创建/更新关系
  let createdRelation: Relation | null = null;

  for (const member of teamMembers) {
    if (member.user_id === currentUser.user_id) continue;

    const existing = findExistingRelation(relations, currentUser.user_id, member.user_id);

    if (existing) {
      // 更新已有关系
      existing.cooperationCount += 1;
      existing.weight = calculateRelationWeight(currentUser, member, existing);
      createdRelation = existing;
    } else {
      // 创建新关系
      const type = determineRelationType(currentUser, member, [project]);
      const newRelation: Relation = {
        relation_id: generateRelationId(),
        userA: currentUser.user_id,
        userB: member.user_id,
        relationType: type,
        relationTitle: getRandomRelationTitle(type),
        relationColor: getRelationColor(type),
        projectId: project.project_id,
        cooperationRoles: [currentUser.role, member.role],
        commonTags: currentUser.skills.filter((s) => member.skills.includes(s)),
        cooperationCount: 1,
        weight: calculateRelationWeight(currentUser, member),
      };
      relations.push(newRelation);
      createdRelation = newRelation;
    }
  }

  return createdRelation;
}

/**
 * "推荐认识"功能：真正创建关系
 *
 * 当用户点击"推荐认识"时调用
 */
export function createRecommendedRelation(
  currentUser: User,
  targetUser: User,
  relations: Relation[],
): Relation | null {
  // 检查是否已存在关系
  const existing = findExistingRelation(relations, currentUser.user_id, targetUser.user_id);
  if (existing) return existing;

  // 创建 recommended 类型关系
  const newRelation: Relation = {
    relation_id: generateRelationId(),
    userA: currentUser.user_id,
    userB: targetUser.user_id,
    relationType: "recommended",
    relationTitle: getRandomRelationTitle("recommended"),
    relationColor: getRelationColor("recommended"),
    projectId: "",
    cooperationRoles: [currentUser.role, targetUser.role],
    commonTags: currentUser.skills.filter((s) => targetUser.skills.includes(s)),
    cooperationCount: 0,
    weight: calculateRelationWeight(currentUser, targetUser),
  };

  relations.push(newRelation);
  return newRelation;
}

/**
 * 获取用户的所有关系（按权重排序）
 */
export function getUserRelations(
  relations: Relation[],
  userId: string,
): Relation[] {
  return relations
    .filter((r) => r.userA === userId || r.userB === userId)
    .sort((a, b) => b.weight - a.weight);
}

/**
 * 获取关系中的另一个用户 ID
 */
export function getOtherUserId(relation: Relation, userId: string): string {
  return relation.userA === userId ? relation.userB : relation.userA;
}

/**
 * 获取推荐认识的用户（技能重叠但无关系）
 */
export function getRecommendedUsers(
  currentUser: User,
  allUsers: User[],
  relations: Relation[],
  limit: number = 5,
): User[] {
  const connectedIds = new Set<string>();
  connectedIds.add(currentUser.user_id);

  // 收集已有关系的用户
  relations.forEach((r) => {
    if (r.userA === currentUser.user_id) connectedIds.add(r.userB);
    if (r.userB === currentUser.user_id) connectedIds.add(r.userA);
  });

  // 计算技能重叠度并排序
  return allUsers
    .filter((u) => !connectedIds.has(u.user_id))
    .map((u) => ({
      user: u,
      overlap: u.skills.filter((s) => currentUser.skills.includes(s)).length,
    }))
    .filter((item) => item.overlap >= 1)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((item) => item.user);
}

// ── 图谱分析功能 ──

export type GraphStats = {
  totalUsers: number;
  totalRelations: number;
  avgConnections: number;
  maxConnections: number;
  isolatedUsers: number;
  topConnectors: { user: User; connectionCount: number }[];
  relationTypeDistribution: Record<RelationType, number>;
};

/**
 * 分析关系图谱
 *
 * 返回：
 * - 总用户数、总关系数
 * - 平均连接数、最大连接数
 * - 孤立用户数（无关系的用户）
 * - 关键连接者（度数最高的用户）
 * - 关系类型分布
 */
export function analyzeGraph(
  users: User[],
  relations: Relation[],
): GraphStats {
  // 统计每个用户的连接数
  const connectionCounts = new Map<string, number>();
  users.forEach((u) => connectionCounts.set(u.user_id, 0));

  relations.forEach((r) => {
    const countA = connectionCounts.get(r.userA) || 0;
    const countB = connectionCounts.get(r.userB) || 0;
    connectionCounts.set(r.userA, countA + 1);
    connectionCounts.set(r.userB, countB + 1);
  });

  // 计算统计数据
  const counts = Array.from(connectionCounts.values());
  const totalConnections = counts.reduce((a, b) => a + b, 0);
  const avgConnections = users.length > 0 ? totalConnections / users.length : 0;
  const maxConnections = Math.max(...counts, 0);
  const isolatedUsers = counts.filter((c) => c === 0).length;

  // 找出关键连接者（度数最高的前 5 名）
  const topConnectors = users
    .map((u) => ({
      user: u,
      connectionCount: connectionCounts.get(u.user_id) || 0,
    }))
    .sort((a, b) => b.connectionCount - a.connectionCount)
    .slice(0, 5);

  // 关系类型分布
  const relationTypeDistribution: Record<RelationType, number> = {
    teammate: 0,
    trio: 0,
    repeated: 0,
    complementary: 0,
    sameTrack: 0,
    coreCreator: 0,
    recommended: 0,
  };
  relations.forEach((r) => {
    relationTypeDistribution[r.relationType]++;
  });

  return {
    totalUsers: users.length,
    totalRelations: relations.length,
    avgConnections: Math.round(avgConnections * 10) / 10,
    maxConnections,
    isolatedUsers,
    topConnectors,
    relationTypeDistribution,
  };
}

/**
 * 获取两个用户之间的最短路径（BFS）
 *
 * 返回用户 ID 数组，如果不可达返回空数组
 */
export function findShortestPath(
  userIdA: string,
  userIdB: string,
  relations: Relation[],
): string[] {
  if (userIdA === userIdB) return [userIdA];

  // 构建邻接表
  const adj = new Map<string, Set<string>>();
  relations.forEach((r) => {
    if (!adj.has(r.userA)) adj.set(r.userA, new Set());
    if (!adj.has(r.userB)) adj.set(r.userB, new Set());
    adj.get(r.userA)!.add(r.userB);
    adj.get(r.userB)!.add(r.userA);
  });

  // BFS
  const visited = new Set<string>([userIdA]);
  const queue: { userId: string; path: string[] }[] = [{ userId: userIdA, path: [userIdA] }];

  while (queue.length > 0) {
    const { userId, path } = queue.shift()!;
    const neighbors = adj.get(userId) || new Set();

    for (const neighbor of neighbors) {
      if (neighbor === userIdB) {
        return [...path, neighbor];
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ userId: neighbor, path: [...path, neighbor] });
      }
    }
  }

  return []; // 不可达
}

/**
 * 获取用户社区（基于连通分量）
 *
 * 返回用户 ID 数组的数组，每个子数组是一个社区
 */
export function detectCommunities(
  users: User[],
  relations: Relation[],
): string[][] {
  const visited = new Set<string>();
  const communities: string[][] = [];

  // 构建邻接表
  const adj = new Map<string, Set<string>>();
  users.forEach((u) => adj.set(u.user_id, new Set()));
  relations.forEach((r) => {
    adj.get(r.userA)?.add(r.userB);
    adj.get(r.userB)?.add(r.userA);
  });

  // DFS 遍历找连通分量
  function dfs(userId: string, community: string[]) {
    visited.add(userId);
    community.push(userId);
    const neighbors = adj.get(userId) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, community);
      }
    }
  }

  users.forEach((u) => {
    if (!visited.has(u.user_id)) {
      const community: string[] = [];
      dfs(u.user_id, community);
      communities.push(community);
    }
  });

  return communities.sort((a, b) => b.length - a.length);
}
