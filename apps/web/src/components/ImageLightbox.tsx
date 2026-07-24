import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  urls: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
};

export function ImageLightbox({ urls, index, onClose, onIndexChange }: Props) {
  const startX = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);

  const go = useCallback(
    (delta: number) => {
      if (urls.length <= 1) return;
      const next = (index + delta + urls.length) % urls.length;
      onIndexChange(next);
    },
    [index, onIndexChange, urls.length]
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [go, onClose]);

  if (!urls.length || index < 0 || index >= urls.length) return null;

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    setDragX(0);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (startX.current == null) return;
    setDragX(e.clientX - startX.current);
  }

  function onPointerUp() {
    if (startX.current == null) return;
    const dx = dragX;
    startX.current = null;
    setDragX(0);
    if (dx > 60) go(-1);
    else if (dx < -60) go(1);
  }

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
      onClick={onClose}
    >
      <button
        type="button"
        className="lightbox-close"
        aria-label="关闭预览"
        onClick={onClose}
      >
        ×
      </button>

      {urls.length > 1 && (
        <>
          <button
            type="button"
            className="lightbox-nav lightbox-prev"
            aria-label="上一张"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
          >
            ‹
          </button>
          <button
            type="button"
            className="lightbox-nav lightbox-next"
            aria-label="下一张"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
          >
            ›
          </button>
          <div className="lightbox-counter" onClick={(e) => e.stopPropagation()}>
            {index + 1} / {urls.length}
          </div>
        </>
      )}

      <div
        className="lightbox-stage"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          transform: dragX ? `translateX(${dragX * 0.35}px)` : undefined,
        }}
      >
        <img src={urls[index]} alt={`预览 ${index + 1}`} draggable={false} />
      </div>
    </div>
  );
}
