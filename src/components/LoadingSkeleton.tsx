import { useState, useEffect } from "react";

interface LoadingSkeletonProps {
  stage?: string;
  progress?: number;
}

/**
 * 加载骨架屏组件
 * 在生成过程中显示进度和动画
 */
export function LoadingSkeleton({ stage = "init", progress = 0 }: LoadingSkeletonProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const stageMessages: Record<string, string> = {
    init: "初始化",
    parsing: "解析项目描述",
    copywriting: "生成创意文案",
    copy_validation: "校验文案",
    prompt_build: "组装提示词",
    image_generating: "生成图片",
    image_validating: "校验图片",
    post_processing: "后处理",
    persisting: "保存数据",
    completed: "完成",
    failed: "失败",
  };

  const currentStage = stageMessages[stage] || stage;

  return (
    <div className="loading-skeleton">
      <div className="skeleton-content">
        {/* 动画圆环 */}
        <div className="skeleton-spinner">
          <div className="spinner-ring" />
          <div className="spinner-progress">{progress}%</div>
        </div>

        {/* 阶段信息 */}
        <div className="skeleton-stage">
          <h3>正在{currentStage}{dots}</h3>
          <p className="skeleton-hint">这可能需要 10-30 秒</p>
        </div>

        {/* 进度条 */}
        <div className="skeleton-progress-bar">
          <div
            className="skeleton-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 阶段列表 */}
        <div className="skeleton-stages">
          {Object.entries(stageMessages).slice(0, -2).map(([key, label], index) => (
            <div
              key={key}
              className={`skeleton-stage-item ${
                key === stage ? "active" : index < Object.keys(stageMessages).indexOf(stage) ? "done" : ""
              }`}
            >
              <span className="stage-dot" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .loading-skeleton {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          padding: 40px;
        }

        .skeleton-content {
          text-align: center;
          max-width: 400px;
        }

        .skeleton-spinner {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 24px;
        }

        .spinner-ring {
          position: absolute;
          inset: 0;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top-color: #4f46e5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner-progress {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          color: #fff;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .skeleton-stage h3 {
          margin: 0 0 8px;
          font-size: 18px;
          color: #fff;
        }

        .skeleton-hint {
          margin: 0 0 24px;
          font-size: 14px;
          color: #888;
        }

        .skeleton-progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 32px;
        }

        .skeleton-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4f46e5, #7c3aed);
          transition: width 0.3s ease;
        }

        .skeleton-stages {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
        }

        .skeleton-stage-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #666;
          transition: color 0.3s;
        }

        .skeleton-stage-item.active {
          color: #4f46e5;
          font-weight: 500;
        }

        .skeleton-stage-item.done {
          color: #22c55e;
        }

        .stage-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #333;
        }

        .skeleton-stage-item.active .stage-dot {
          background: #4f46e5;
          box-shadow: 0 0 8px #4f46e5;
        }

        .skeleton-stage-item.done .stage-dot {
          background: #22c55e;
        }
      `}</style>
    </div>
  );
}
