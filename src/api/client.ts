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

  console.log("[API] 开始调用后端生图...", { mode, style: toBackendStyle(input.templateStyle) });
  const startTime = Date.now();

  const resp = await fetch(`${API_BASE}/api/generate-poster`, {
    method: "POST",
    body: form,
    signal,
  });

  console.log(`[API] 后端响应: HTTP ${resp.status}, 耗时 ${(Date.now() - startTime) / 1000}s`);

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    console.error("[API] 请求失败:", resp.status, detail);
    throw new Error(`生成失败 HTTP ${resp.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await resp.json()) as GenerateResponse;
  console.log("[API] 返回数据:", { status: data.status, image_url: data.image_url?.slice(0, 80), error: data.error });

  if (data.status === "failed") {
    console.error("[API] 后端返回失败:", data.error, data.error_code);
    throw new Error(data.error || "后端生成失败");
  }
  return data;
}
