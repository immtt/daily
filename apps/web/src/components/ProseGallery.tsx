import { useMemo, useRef, useState } from "react";
import { formatStockTag } from "../lib/format";
import { extractImageUrls } from "../lib/images";
import { ImageLightbox } from "./ImageLightbox";

type Stock = { code: string; name: string };

type Props = {
  html: string;
  content: unknown;
  /** 详情页股票标签：完整展示；列表用 compact */
  stocks?: Stock[];
  compactStocks?: boolean;
};

export function ProseGallery({ html, content, stocks, compactStocks }: Props) {
  const urls = useMemo(() => extractImageUrls(content), [content]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const articleRef = useRef<HTMLElement>(null);

  function onArticleClick(e: React.MouseEvent) {
    const t = e.target as HTMLElement;
    if (t.tagName !== "IMG") return;
    const src = (t as HTMLImageElement).currentSrc || (t as HTMLImageElement).src;
    if (!src || !urls.length) return;
    e.preventDefault();
    let idx = urls.findIndex(
      (u) => u === src || src.endsWith(u) || u.endsWith(src.split("/").pop() || "")
    );
    if (idx < 0) {
      idx = urls.findIndex((u) => src.includes(u) || u.includes(src));
    }
    if (idx < 0) idx = 0;
    setOpenIndex(idx);
  }

  const stockBlock = stocks && stocks.length > 0 && (
    <StockTagRow stocks={stocks} compact={compactStocks} />
  );

  return (
    <>
      {stockBlock}
      <article
        ref={articleRef}
        className="prose prose--gallery"
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={onArticleClick}
      />
      {openIndex != null && urls.length > 0 && (
        <ImageLightbox
          urls={urls}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndexChange={setOpenIndex}
        />
      )}
    </>
  );
}

/** 列表/详情共用的股票标签行 */
export function StockTagRow({
  stocks,
  compact = true,
  max = 3,
}: {
  stocks: Stock[];
  compact?: boolean;
  max?: number;
}) {
  if (!stocks.length) {
    return compact ? <div className="stock-tags stock-tags--slot" /> : null;
  }
  const shown = compact ? stocks.slice(0, max) : stocks;
  const more = compact ? Math.max(0, stocks.length - max) : 0;
  return (
    <div className={`stock-tags ${compact ? "stock-tags--slot" : ""}`}>
      {shown.map((s) => (
        <span key={s.code} className="stock-tag" title={formatStockTag(s)}>
          {compact ? s.code : formatStockTag(s)}
        </span>
      ))}
      {more > 0 && <span className="stock-tag stock-tag--more">+{more}</span>}
    </div>
  );
}
