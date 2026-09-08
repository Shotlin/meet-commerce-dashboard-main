import "./PremiumProductPreview.css"
import { memo, useState } from "react"
import { cn } from "../../../lib/utils"
import type { Product, PreviewProps } from "./index"
import styles from "../MobilePreviewFrame.module.css"

function PhotoCard({ product, rail }: { product: Product; rail: boolean }) {
  const [slide, setSlide] = useState(0)
  const images = [...new Set([...(product.images?.length ? product.images : [product.thumbnail_url])].filter((url): url is string => Boolean(url)))]
  const price = Number(product.sale_price ?? product.price)
  const original = Number(product.price)
  const discounted = price > 0 && price < original
  const details = [product.net_weight ?? product.net_quantity, product.highlights?.pieces ? `${product.highlights.pieces} pieces` : null, product.highlights?.serves ? `Serves ${product.highlights.serves}` : null].filter(Boolean).join(" | ")
  return <article style={{ minWidth: 0, background: "white", borderRadius: 14, boxShadow: rail ? "none" : "0 3px 7px #00000020", paddingBottom: rail ? 0 : 16 }}>
    <div style={{ position: "relative", marginBottom: rail ? 20 : 14 }}>
      <div style={{ aspectRatio: "1.46", background: "#F8F5F1", borderRadius: rail ? 13 : "14px 14px 0 0", overflow: "hidden" }}>
        {images.length ? <img src={images[Math.min(slide, images.length - 1)]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#888", fontSize: 13 }}>Add product photography</div>}
      </div>
      {!rail && images.length > 1 ? <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        {images.map((_, i) => <button key={i} type="button" aria-label={`Show photo ${i + 1} of ${product.name}`} aria-pressed={slide === i} onClick={(e) => { e.stopPropagation(); setSlide(i) }} style={{ padding: 8, background: "transparent", border: 0, cursor: "pointer" }}><span style={{ display: "block", width: 6, height: 6, borderRadius: "50%", background: slide === i ? "white" : "#ffffff80" }} /></button>)}
      </div> : null}
      {rail ? <span aria-hidden style={{ position: "absolute", right: -7, bottom: -9, width: 36, height: 32, display: "grid", placeItems: "center", borderRadius: 8, background: "white", color: "#D51043", boxShadow: "0 3px 6px #00000025", fontSize: 27 }}>+</span> : null}
    </div>
    <div style={{ padding: rail ? 0 : "0 13px", textAlign: "left" }}>
      <div style={{ color: "#141414", fontSize: rail ? 16 : 17, lineHeight: 1.3, fontWeight: 700 }}>{product.name}</div>
      {!rail && product.description ? <div style={{ color: "#888", fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{product.description}</div> : null}
      {details ? <div style={{ color: "#888", fontSize: 12, marginTop: 9 }}>{details}</div> : null}
      {!rail && product.display_delivery_minutes ? <div style={{ color: "#555", fontSize: 12, marginTop: 10 }}>{product.display_delivery_minutes} mins</div> : null}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginTop: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 5, alignItems: "baseline", flexWrap: "wrap", fontSize: 13 }}>
          <strong style={{ color: "#151515", fontSize: rail ? 14 : 17 }}>₹{price}</strong>
          {discounted ? <><s style={{ color: "#888" }}>₹{original}</s><span style={{ color: "#299367" }}>{Math.round((original - price) / original * 100)}% off</span></> : null}
        </div>
        {!rail ? <span aria-hidden style={{ padding: "8px 16px", borderRadius: 7, background: "#D51043", color: "white", fontSize: 16, boxShadow: "0 2px 4px #00000020" }}>Add ＋</span> : null}
      </div>
      {rail && product.display_delivery_minutes ? <div style={{ color: "#555", fontSize: 12, marginTop: 12 }}>{product.display_delivery_minutes} mins</div> : null}
    </div>
  </article>
}

function PremiumProductPreview({ section, isSelected, onClick, products = [] }: PreviewProps) {
  const config = section.config as Record<string, unknown>
  const rail = section.section_type === "product_carousel"
  const columns = Math.min(2, Math.max(1, Number(config.columns) || 1))
  return <div role="button" tabIndex={0} aria-label="Select product section" aria-pressed={isSelected}
    onClick={onClick} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onClick() } }}
    className={cn("premium-product-section", styles.sectionSlot, styles.sectionSlotHover, isSelected && styles.sectionSlotSelected)}
    style={{ background: "white", padding: "24px 18px", fontFamily: "'Premium DM Sans', Arial, sans-serif", textAlign: "left" }}>
    <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: -0.35, color: "#141414" }}>{String(config.title || "Our current hits")}</div>
    {config.subtitle ? <div style={{ color: "#626262", fontSize: 14, marginTop: 5, marginBottom: 14 }}>{String(config.subtitle)}</div> : null}
    {products.length ? <div style={{ display: rail ? "flex" : "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: rail ? 24 : 22, overflowX: rail ? "auto" : undefined, padding: "12px 7px 10px 0", scrollSnapType: "x mandatory" }}>
      {products.map((product) => <div key={product.id} style={{ flex: rail ? "0 0 66%" : undefined, minWidth: 0, scrollSnapAlign: "start" }}><PhotoCard product={product} rail={rail} /></div>)}
    </div> : <div style={{ marginTop: 16, padding: "44px 20px", borderRadius: 14, background: "#F8F5F1", color: "#777", textAlign: "center", fontSize: 13 }}>Choose products to preview their photos and pricing.</div>}
  </div>
}
export default memo(PremiumProductPreview)
