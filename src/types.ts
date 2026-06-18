export type TemplateStyle =
  | "复古头版"
  | "未来发布会"
  | "3D 小人风"
  | "JOJO 动漫中二风"
  | "科技星空风"
  | "原点宇宙风";

export type Vec3 = { x: number; y: number; z: number };

export type User = {
  user_id: string;
  name: string;
  avatar: string;
  role: string;
  skills: string[];
  bio: string;
  contact: string;
  projectIds: string[];
  teamIds: string[];
  starBrightness: number;
  position: Vec3;
};

export type Project = {
  project_id: string;
  name: string;
  oneSentence: string;
  description: string;
  documentText: string;
  tags: string[];
  techStack: string[];
  track: string;
  memberIds: string[];
  demoLink: string;
  githubLink: string;
  newspaperId: string;
  planetOrbitUserId: string;
};

export type Newspaper = {
  newspaper_id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  projectSummary: string;
  editorComment: string;
  tags: string[];
  shareQuote: string;
  futureHeadline: string;
  templateStyle: TemplateStyle;
  createdAt: string;
  userId: string;
  projectId: string;
  teamName: string;
  highlights: string[];
  published: boolean;
  heat: number;
  aiRecommended: boolean;
  futureScore: number;
};

export type RelationType = 
  | "teammate" 
  | "trio" 
  | "repeated" 
  | "complementary" 
  | "sameTrack" 
  | "coreCreator" 
  | "recommended";

export type Relation = {
  relation_id: string;
  userA: string;
  userB: string;
  relationType: RelationType;
  relationTitle: string;
  relationColor: string;
  projectId: string;
  cooperationRoles: string[];
  commonTags: string[];
  cooperationCount: number;
  weight: number;
};

export type Tag = {
  tag_id: string;
  name: string;
  type: "track" | "tech" | "role" | "project" | "keyword";
};

export type AppData = {
  users: User[];
  projects: Project[];
  newspapers: Newspaper[];
  relations: Relation[];
  tags: Tag[];
  settings: AppSettings;
};

export type AppSettings = {
  soundEnabled: boolean;
  volume: number;
  motion: number;
};

export type GenerateInput = {
  name: string;
  teamName: string;
  projectName: string;
  role: string;
  projectIntro: string;
  uploadedImage: string;
  templateStyle: TemplateStyle;
  materialName: string;
  eventTime: string;
  eventLocation: string;
  mode?: "participant" | "audience";
  impression?: string;
};
