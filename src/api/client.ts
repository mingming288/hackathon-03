import type { GenerateInput } from "../types";
import { toBackendStyle } from "./styleMap";

// 后端 /api/generate-poster 的响应结构(对应 server/app/models.py)
export type BackendColumn = { title: string; body: string };

export type BackendPosterCopy = {
  poster_name: string;
  issue_label: string;
  date: string;
  headline: string;
  subheadline: string;
  tags: string[];
  columns: BackendColumn[];
  easter_egg: string;
  editor_comment: string;
  share_line: string;
};

export type GenerateResponse = {
  status: "success" | "failed";
  poster_id: string | null;
  image_url: string;
  poster_copy: BackendPosterCopy;
  style: string;
  layout_used: string;
  generation_meta: Record<string, unknown>;
  error: string | null;
  error_code: string | null;
  request_id: string;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

// base64 dataURL → Blob,供 multipart 上传
function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = /^data:(.+?);base64,(.*)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1];
  const bytes = atob(match[2]);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function generatePoster(
  input: GenerateInput,
  signal?: AbortSignal,
): Promise<GenerateResponse> {
  const form = new FormData();
  const mode = input.mode ?? "participant";
  form.append("style", toBackendStyle(input.templateStyle));
  form.append("mode", mode);
  form.append("user_ref", input.name || "origin_universe");

  if (mode === "audience") {
    // 观众模式:无需 PRD,只用姓名 + 现场感受 + 照片,随机版式。
    form.append("prd", "");
    form.append("user_name", input.name);
    form.append("event_name", input.eventLocation);
    form.append("impression", input.impression || "");
    form.append("project_name", "");
    form.append("team_name", "");
    form.append("layout_mode", "random");
  } else {
    form.append("prd", input.projectIntro || input.projectName || "黑客松现场作品");
    form.append("project_name", input.projectName);
    form.append("team_name", input.teamName);
    form.append("event_name", input.eventLocation);
  }

  if (input.uploadedImage) {
    const blob = dataUrlToBlob(input.uploadedImage);
    if (blob) {
      const ext = blob.type.includes("png") ? "png" : "jpg";
      form.append("images", blob, `upload.${ext}`);
    }
  }

  const resp = await fetch(`${API_BASE}/api/generate-poster`, {
    method: "POST",
    body: form,
    signal,
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(`生成失败 HTTP ${resp.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await resp.json()) as GenerateResponse;
  if (data.status === "failed") {
    throw new Error(data.error || "后端生成失败");
  }
  return data;
}
