import { useState, useRef, useEffect } from "react";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
}

/**
 * 图片懒加载组件
 * 使用 IntersectionObserver 实现视口内加载
 */
export function LazyImage({
  src,
  alt,
  placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23333' width='100' height='100'/%3E%3Ctext fill='%23666' x='50' y='50' text-anchor='middle' dy='.3em'%3E加载中...%3C/text%3E%3C/svg%3E",
  fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23333' width='100' height='100'/%3E%3Ctext fill='%23666' x='50' y='50' text-anchor='middle' dy='.3em'%3E加载失败%3C/text%3E%3C/svg%3E",
  className = "",
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const imgElement = imgRef.current;
    if (!imgElement) return;

    // 创建 IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 进入视口，开始加载图片
            const img = new Image();
            img.src = src;

            img.onload = () => {
              setImageSrc(src);
              setIsLoaded(true);
            };

            img.onerror = () => {
              setImageSrc(fallback);
              setIsError(true);
            };

            // 停止观察
            observer.unobserve(imgElement);
          }
        });
      },
      {
        rootMargin: "50px", // 提前 50px 开始加载
        threshold: 0.1,
      }
    );

    observer.observe(imgElement);

    return () => {
      observer.disconnect();
    };
  }, [src, fallback]);

  return (
    <div className={`lazy-image-container ${className}`}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`lazy-image ${isLoaded ? "loaded" : ""} ${isError ? "error" : ""}`}
        {...props}
      />

      <style>{`
        .lazy-image-container {
          position: relative;
          overflow: hidden;
        }

        .lazy-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.3s ease, filter 0.3s ease;
          opacity: 0;
        }

        .lazy-image.loaded {
          opacity: 1;
        }

        .lazy-image.error {
          opacity: 1;
          filter: grayscale(100%);
        }
      `}</style>
    </div>
  );
}
