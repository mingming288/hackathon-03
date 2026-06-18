import type { TemplateStyle } from "../types";

// 前端中文风格名 ↔ 后端风格 key
// 后端 6 风格: daily / cyber / entertainment / character3d / comic / magic
export const STYLE_TO_BACKEND: Record<TemplateStyle, string> = {
  复古头版: "daily",
  未来发布会: "entertainment",
  "3D 小人风": "character3d",
  "JOJO 动漫中二风": "comic",
  科技星空风: "cyber",
  原点宇宙风: "magic",
};

export const BACKEND_TO_STYLE: Record<string, TemplateStyle> = Object.entries(
  STYLE_TO_BACKEND,
).reduce((acc, [zh, key]) => {
  acc[key] = zh as TemplateStyle;
  return acc;
}, {} as Record<string, TemplateStyle>);

export function toBackendStyle(style: TemplateStyle): string {
  return STYLE_TO_BACKEND[style] ?? "daily";
}

export function toFrontendStyle(key: string): TemplateStyle {
  return BACKEND_TO_STYLE[key] ?? "复古头版";
}
