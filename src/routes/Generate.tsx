import { useState, useEffect } from "react";
import type { AppContextValue } from "../App";
import { mockAIGenerateNewspaper } from "../mockAI";
import { upsertGenerated, saveAudiencePaper } from "../storage";
import { generatePoster } from "../api/client";
import type { GenerateResponse } from "../api/client";
import { adaptToEntities } from "../api/adapter";
import { toBackendStyle } from "../api/styleMap";
import { playChime } from "../audio";
import type { GenerateInput, TemplateStyle } from "../types";

const templates: TemplateStyle[] = ["复古头版", "未来发布会", "3D 小人风", "JOJO 动漫中二风", "科技星空风", "原点宇宙风"];

const questions = [
  "可以让我看看你或者你们团队的样子吗？",
  "你的名字是？",
  "你们的团队，叫什么名字？",
  "这次你们想把哪一个作品写进头版？",
  "在这次黑客松里，你扮演什么角色？",
  "把你的项目材料交给我，我来替你写成头版。",
  "挑一种你喜欢的方式，让我把你写进头版吧。",
  "如果你准备好了，我就替你写一份头版。"
];

export function Generate({ app }: { app: AppContextValue }) {
  const [step, setStep] = useState(0);
  const [appStage, setAppStage] = useState<"landing" | "zooming" | "choose" | "chat" | "audience" | "generating" | "result">("landing");
  const [flashing, setFlashing] = useState(false);
  const [audienceStep, setAudienceStep] = useState(0);
  
  const [input, setInput] = useState<GenerateInput>({
    name: "",
    teamName: "",
    projectName: "",
    role: "AI 产品经理",
    projectIntro: "",
    uploadedImage: "",
    materialName: "",
    templateStyle: "复古头版",
    eventTime: new Date().toLocaleString("zh-CN"),
    eventLocation: "抖音原点社区黑客松现场",
  });

  const progress = Math.round(((step + 1) / questions.length) * 100);
  const canGenerate = true; // 放开限制，方便演示
  const canContinue = true; // 放开所有必填校验，允许直接点击下一句体验完整流程

  const [generatingTextIndex, setGeneratingTextIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const generatingTexts = [
    "生成中"
  ];

  function patch(value: Partial<GenerateInput>) {
    setInput((prev) => ({ ...prev, ...value }));
  }

  function handleEnterUniverse() {
    setAppStage("zooming");
    playChime(659.25, app.data.settings.volume, app.data.settings.soundEnabled);
    setTimeout(() => {
      setFlashing(true);
      setTimeout(() => {
        setAppStage("choose");
        setFlashing(false);
      }, 800);
    }, 1500);
  }

  // 观众模式:两步问答(姓名 → 上传图片)后,走观众模板生图。
  const audienceQuestions = ["你的姓名是什么?", "请上传一张你的现场照片。"];

  function startAudience() {
    setAudienceStep(0);
    patch({ mode: "audience" });
    setAppStage("audience");
  }

  function audienceNext() {
    if (audienceStep < audienceQuestions.length - 1) {
      setAudienceStep((s) => s + 1);
      return;
    }
    createNewspaper();
  }

  async function createNewspaper() {
    setAppStage("generating");
    setErrorMsg("");

    // 生成中文字循环动画
    const interval = setInterval(() => {
      setGeneratingTextIndex(i => (i + 1) % generatingTexts.length);
    }, 600);

    try {
      // 真实调用后端 AI 生图 + 文案
      const resp = await generatePoster(input);
      const { user, project, newspaper } = adaptToEntities(resp, input);
      if (input.mode === "audience") {
        // 观众:不进共享图谱(星图/作品集),单独存放
        saveAudiencePaper(newspaper);
      } else {
        // 落库到原点宇宙(localStorage)
        upsertGenerated({ user, project, newspaper });
      }
      clearInterval(interval);
      // 跳转结果页
      app.navigate(`/result/${newspaper.newspaper_id}`);
    } catch (err) {
      clearInterval(interval);
      console.error("后端生成失败，降级 mockAI 兜底:", err);
      // 降级：用 mockAI 生成文案，无真实图片，仍闭环落库以保证演示不中断
      try {
        const mock = mockAIGenerateNewspaper(input);
        const fallbackResp: GenerateResponse = {
          status: "success",
          poster_id: null,
          image_url: "",
          poster_copy: {
            poster_name: "",
            issue_label: "",
            date: new Date().toLocaleDateString("zh-CN"),
            headline: mock.title,
            subheadline: mock.subtitle,
            tags: mock.tags,
            columns: [
              { title: "项目摘要", body: mock.projectSummary },
              { title: "主编锐评", body: mock.editorComment },
              { title: "一年后", body: mock.futureHeadline },
            ],
            easter_egg: mock.futureHeadline,
            editor_comment: mock.editorComment,
            share_line: mock.shareQuote,
          },
          style: toBackendStyle(input.templateStyle),
          layout_used: "A",
          generation_meta: {},
          error: null,
          error_code: null,
          request_id: "fallback",
        };
        const { user, project, newspaper } = adaptToEntities(fallbackResp, input);
        if (input.mode === "audience") {
          saveAudiencePaper(newspaper);
        } else {
          upsertGenerated({ user, project, newspaper });
        }
        app.navigate(`/result/${newspaper.newspaper_id}`);
      } catch (fallbackErr) {
        console.error("兜底也失败:", fallbackErr);
        setErrorMsg("生成失败，请检查后端服务后重试。");
        setAppStage(input.mode === "audience" ? "audience" : "chat");
      }
    }
  }

  function goNext() {
    if (step < questions.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    createNewspaper();
  }

  return (
    <>
      <div className={`white-flash-overlay ${flashing ? "flashing" : ""}`} />
      
      {/* 沉浸式变暗遮罩层 */}
      <div className={`dark-overlay ${appStage === "generating" ? "generating" : ""}`} />

      {(appStage === "landing" || appStage === "zooming") && (
        <section className={`entry-page ${appStage === "zooming" ? "zooming" : ""}`}>
          <div className="entry-viewport">
            <div className="entry-art" aria-label="进入方式页">
              <img className="entry-bg" src="/entry-background.png" alt="" />
              
              <div className="landing-titles">
                <h1>原点日报机 × 原点宇宙</h1>
                <p>生成一份头版，进入一座宇宙</p>
              </div>

              <button className="entry-star-layer" type="button">
                <img src="/origin-star-cut.png" alt="原点星" />
              </button>
            </div>
          </div>

          <div className="entry-control">
            <button className="entry-primary-card" type="button" onClick={handleEnterUniverse}>
              <span className="chapter-orbit" aria-hidden="true">
                <i />
                <em />
              </span>
              <span className="chapter-copy">
                <b>进入原点宇宙</b>
                <small>ENTER HACKAVERSE</small>
              </span>
            </button>
          </div>
        </section>
      )}

      {appStage !== "landing" && appStage !== "zooming" && (
        <section className={`page generate-page origin-qa-page ${appStage}`}>
          <div className="qa-sky">
        {appStage !== "generating" && <div className="qa-particles" />}
        {appStage !== "generating" && <div className={`qa-star`} />}
            
            {appStage === "choose" && (
          <div className="qa-dialog qa-choose">
            <h1 className="typewriter-text">你想以什么身份进入原点宇宙?</h1>
            <div className="choose-cards">
              <button className="choose-card" onClick={startAudience}>
                <b>观众</b>
                <p>留下你的姓名和现场照片,生成一份【我在现场】的纪念头版。</p>
              </button>
              <button className="choose-card primary" onClick={() => setAppStage("chat")}>
                <b>参赛者</b>
                <p>把你的项目写进头版,点亮属于你的那颗恒星。</p>
              </button>
            </div>
          </div>
        )}

            {appStage === "chat" && (
          <div className="qa-dialog">
            <span className="qa-step-label">{step + 1}/{questions.length}</span>
            <h1 key={step} className="typewriter-text">{questions[step]}</h1>
            <div className="qa-actions">
              {step > 0 && <button onClick={() => setStep((s) => Math.max(0, s - 1))}>上一句</button>}
              <button className="primary" disabled={!canContinue} onClick={goNext}>
                {step === questions.length - 1 ? "确定生成" : "下一句"}
              </button>
            </div>
            {errorMsg && <p className="qa-error" style={{ color: "#ff9b9b", marginTop: 12 }}>{errorMsg}</p>}
          </div>
        )}

            {appStage === "audience" && (
          <div className="qa-dialog">
            <span className="qa-step-label">{audienceStep + 1}/{audienceQuestions.length}</span>
            <h1 key={audienceStep} className="typewriter-text">{audienceQuestions[audienceStep]}</h1>
            <div className="qa-actions">
              {audienceStep > 0 && <button onClick={() => setAudienceStep((s) => Math.max(0, s - 1))}>上一句</button>}
              <button className="primary" onClick={audienceNext}>
                {audienceStep === audienceQuestions.length - 1 ? "确定生成" : "下一句"}
              </button>
            </div>
            {errorMsg && <p className="qa-error" style={{ color: "#ff9b9b", marginTop: 12 }}>{errorMsg}</p>}
          </div>
        )}

            {appStage === "generating" && (
          <div className="generating-dialog">
            <p className="generating-status">生成中</p>
            
            <div className="generating-progress-container">
              <div className="generating-progress-bar">
                <div className="generating-progress-particles" />
              </div>
            </div>
          </div>
        )}
          </div>

          {appStage === "chat" && step < 6 && (
            <div className="answer-panel qa-answer">
              {step === 0 && (
                <label className="upload-box">
                  {input.uploadedImage ? <img src={input.uploadedImage} alt="" /> : <span>点击上传照片 (支持跳过)</span>}
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => patch({ uploadedImage: String(reader.result) });
                    reader.readAsDataURL(file);
                  }} />
                </label>
              )}
              {step === 1 && <input className="big-input" value={input.name} placeholder="请输入你的名字" onChange={(e) => patch({ name: e.target.value })} />}
              {step === 2 && <input className="big-input" value={input.teamName} placeholder="请输入团队名称" onChange={(e) => patch({ teamName: e.target.value })} />}
              {step === 3 && <input className="big-input" value={input.projectName} placeholder="请输入作品名称" onChange={(e) => patch({ projectName: e.target.value })} />}
              {step === 4 && (
                <div className="role-grid">
                  {["产品", "设计", "前端", "后端", "算法", "运营", "其他"].map((role) => (
                    <button 
                      key={role} 
                      className={input.role === role ? "active" : ""} 
                      onClick={() => patch({ role })}
                    >
                      {role}
                    </button>
                  ))}
                  {input.role === "其他" && (
                    <input className="big-input mt-2" placeholder="请输入你的角色" onChange={(e) => patch({ role: e.target.value })} />
                  )}
                </div>
              )}
              {step === 5 && (
                <label className="file-pill">
                  {input.materialName || "上传产品文档 / PPT / 语音 / 文字"}
                  <input type="file" onChange={(e) => patch({ materialName: e.target.files?.[0]?.name ?? "" })} />
                </label>
              )}
            </div>
          )}

          {appStage === "audience" && (
            <div className="answer-panel qa-answer">
              {audienceStep === 0 && (
                <input className="big-input" value={input.name} placeholder="请输入你的姓名 / 昵称" onChange={(e) => patch({ name: e.target.value })} />
              )}
              {audienceStep === 1 && (
                <label className="upload-box">
                  {input.uploadedImage ? <img src={input.uploadedImage} alt="" /> : <span>点击上传现场照片</span>}
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => patch({ uploadedImage: String(reader.result) });
                    reader.readAsDataURL(file);
                  }} />
                </label>
              )}
            </div>
          )}

          {appStage === "chat" && step === 6 && (
            <div className="answer-panel qa-answer">
              <div className="style-cards-grid">
                {[
                  { name: "复古头版", desc: "像一份来自宇宙旧报社的神秘头版。" },
                  { name: "未来发布会", desc: "像项目刚刚震撼发布，全场灯光亮起。" },
                  { name: "3D 小人风", desc: "让你和团队变成可爱的 3D 宇宙居民。" },
                  { name: "JOJO 动漫中二风", desc: "用夸张姿态和燃系台词宣布项目诞生。" },
                  { name: "科技星空风", desc: "像一份漂浮在星云里的未来产品档案。" },
                  { name: "原点宇宙风", desc: "更正式、更高级，适合黑客松成果展示。" }
                ].map((style) => (
                  <button 
                    className={`style-card ${input.templateStyle === style.name ? "active" : ""}`} 
                    key={style.name} 
                    onClick={() => patch({ templateStyle: style.name as TemplateStyle })}
                  >
                    <b>{style.name}</b>
                    <p>{style.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {appStage === "result" && (
            <div className="result-placeholder">
              <div className="placeholder-card">
                <header>
                  <b>《原点日报》</b>
                  <span>一颗新项目在原点宇宙被点亮</span>
                </header>
                <p>
                  今天，来自<strong>【{input.teamName || "未命名团队"}】</strong>的<strong>【{input.name || "匿名参赛者"}】</strong>带着作品<strong>【{input.projectName || "未命名作品"}】</strong>抵达原点宇宙。
                </p>
                <p>
                  在这场黑客松旅程中，TA 以<strong>【{input.role || "未选择角色"}】</strong>的身份，为这个项目注入了新的能量。
                </p>
                <p>原点星记录下这一刻，并为它生成了一份专属头版。</p>
                <div className="style-tag">当前选择风格：{input.templateStyle}</div>
              </div>
              <div className="result-actions">
            <button className="primary" onClick={() => createNewspaper()}>重新生成</button>
            <button onClick={() => app.navigate("/")}>返回入口</button>
            <button onClick={() => app.navigate("/universe")}>进入原点宇宙</button>
          </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}
