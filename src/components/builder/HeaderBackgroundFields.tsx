import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, Copy } from "lucide-react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { ThemeImageUploader } from "@/components/themes/ThemeImageUploader"
import type { HeaderBackgroundTheme, ThemeSections } from "@/types/theme.types"
import {
  headerOnlyPrompt,
  headerPlusPromoPrompt,
  specFromMetrics,
  useHeaderLayoutMetrics,
  withHeaderBackgroundSpec,
  type HeaderBackgroundSpec,
} from "./headerBackgroundLayout"

interface HeaderBackgroundFieldsProps {
  sections: ThemeSections
  patchSections: (patch: Partial<ThemeSections>) => void
}

/** Natural pixel size of the uploaded image, so we can tell the user if it will crop. */
function useImageNaturalSize(url: string | null) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useEffect(() => {
    setSize(null)
    if (!url) return
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setSize({ w: img.naturalWidth, h: img.naturalHeight })
    }
    img.src = url
    return () => {
      cancelled = true
    }
  }, [url])
  return size
}

function PxRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className={strong ? "font-semibold text-slate-900" : "text-slate-600"}>{label}</span>
      <span className={strong ? "font-mono font-bold text-slate-900" : "font-mono font-semibold text-slate-700"}>
        {value}
      </span>
    </div>
  )
}

/** Proportional picture of the tall image: which rows belong to which region. */
function RegionDiagram({ spec }: { spec: HeaderBackgroundSpec }) {
  return (
    <div className="flex h-36 w-full overflow-hidden rounded-lg border border-slate-300 text-[10px] font-semibold text-white">
      <div className="flex w-full flex-col">
        <div
          className="flex flex-col items-center justify-center bg-slate-700 px-2 text-center"
          style={{ flex: spec.topRegionHeight }}
        >
          <span>Top shared region</span>
          <span className="font-mono font-normal opacity-80">
            Header + Search + Category tabs · {spec.topRegionHeight} px
          </span>
        </div>
        <div
          className="flex flex-col items-center justify-center border-t-2 border-dashed border-white/80 bg-rose-600 px-2 text-center"
          style={{ flex: spec.promoRegionHeight }}
        >
          <span>Mini promo bar region</span>
          <span className="font-mono font-normal opacity-90">{spec.promoRegionHeight} px</span>
        </div>
      </div>
    </div>
  )
}

function PromptCard({
  title,
  active,
  prompt,
}: {
  title: string
  active: boolean
  prompt: string
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      toast.success("Prompt copied")
    } catch {
      toast.error("Couldn't copy — select the text and copy it manually")
    }
  }
  return (
    <div
      className={
        "rounded-xl border p-3 " +
        (active ? "border-blue-300 bg-blue-50/60" : "border-slate-200 bg-slate-50")
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-slate-900">
          {title}
          {active && (
            <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
              matches your current setting
            </span>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={copy}>
          <Copy className="h-3.5 w-3.5" />
          Copy prompt
        </Button>
      </div>
      <p className="select-all whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{prompt}</p>
    </div>
  )
}

export function HeaderBackgroundFields({ sections, patchSections }: HeaderBackgroundFieldsProps) {
  const hb: HeaderBackgroundTheme = sections.headerBackground ?? { imageUrl: null }
  const extend = hb.extendToPromoBar === true
  const liveSpec = specFromMetrics(useHeaderLayoutMetrics())
  const imageSize = useImageNaturalSize(hb.imageUrl)

  const patchHeader = (patch: Partial<HeaderBackgroundTheme>) =>
    patchSections({ headerBackground: { ...hb, ...patch } })

  const onToggle = (next: boolean) => {
    // Persist the exact numbers together with the flag so the mobile app
    // never has to guess how the image is split.
    patchSections({
      headerBackground: liveSpec
        ? withHeaderBackgroundSpec(hb, liveSpec, next)
        : { ...hb, extendToPromoBar: next },
    })
  }

  const recommendedHeight = liveSpec ? (extend ? liveSpec.totalHeight : liveSpec.topRegionHeight) : null
  const sizeCheck =
    imageSize && recommendedHeight
      ? (() => {
          const want = 1080 / recommendedHeight
          const have = imageSize.w / imageSize.h
          return {
            matches: Math.abs(have - want) / want <= 0.01,
            w: imageSize.w,
            h: imageSize.h,
            lowRes: imageSize.w < 1080,
          }
        })()
      : null

  const uploadHint = liveSpec
    ? extend
      ? `Recommended: 1080 × ${liveSpec.totalHeight} px — one tall image. Top ${liveSpec.topRegionHeight} px = header, search & category tabs; bottom ${liveSpec.promoRegionHeight} px = mini promo bar.`
      : `Recommended: 1080 × ${liveSpec.topRegionHeight} px. The image fills the header block edge-to-edge and crops to fit — never stretches — so keep the logo and text away from the bottom edge.`
    : "Measuring the preview…"

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-700">
        {liveSpec
          ? extend
            ? `One image painted behind the Top Bar, Search Bar, Category Tabs and Mini Promotional Bar combined. Recommended upload size: 1080 × ${liveSpec.totalHeight} px. The upper ${liveSpec.topRegionHeight} px of the image maps to the top header area, and the lower ${liveSpec.promoRegionHeight} px maps to the mini promotional bar.`
            : `One image painted behind the Top Bar, Search Bar and Category Tabs combined. Recommended upload size: 1080 × ${liveSpec.topRegionHeight} px.`
          : "One image painted behind the Top Bar, Search Bar and Category Tabs combined."}{" "}
        To actually see it (instead of it being hidden behind the solid colors), turn off "Show background color" in
        each of those three regions.
      </p>

      <ThemeImageUploader
        label="Header background image"
        value={hb.imageUrl}
        onChange={(url) => patchHeader({ imageUrl: url })}
        hint={uploadHint}
        previewFit="contain"
      />

      {sizeCheck && liveSpec && (
        <div
          className={
            "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs " +
            (sizeCheck.matches
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-900")
          }
        >
          {sizeCheck.matches ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>
            Your image is <b className="font-mono">{sizeCheck.w} × {sizeCheck.h} px</b>.{" "}
            {sizeCheck.matches
              ? `Proportions match the recommended 1080 × ${recommendedHeight} px.`
              : `Recommended is 1080 × ${recommendedHeight} px. Other proportions are cropped to fit (never stretched), so the top/promo split may not land where you designed it.`}
            {sizeCheck.lowRes && " Narrower than 1080 px — it may look slightly soft on large phones."}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <Label className="text-sm font-medium text-slate-900">Extend into mini promotional bar</Label>
        <Switch checked={extend} onCheckedChange={onToggle} />
      </div>

      {liveSpec ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Exact size for your artwork
          </div>

          <PxRow
            label="Recommended image size"
            value={`1080 × ${extend ? liveSpec.totalHeight : liveSpec.topRegionHeight} px`}
            strong
          />

          {extend ? (
            <>
              <div className="space-y-1.5 border-t border-slate-100 pt-2">
                <PxRow label="Top header + search + category region" value={`${liveSpec.topRegionHeight} px`} />
                <PxRow label="Mini promotional banner region" value={`${liveSpec.promoRegionHeight} px`} />
                <PxRow label="Total combined height" value={`${liveSpec.totalHeight} px`} strong />
              </div>
              <RegionDiagram spec={liveSpec} />
              <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
                <li>Top region height = {liveSpec.topRegionHeight} px</li>
                <li>Promo strip height = {liveSpec.promoRegionHeight} px</li>
                <li>
                  Total upload size = 1080 × {liveSpec.totalHeight} px ({liveSpec.topRegionHeight} +{" "}
                  {liveSpec.promoRegionHeight})
                </li>
              </ul>
              <p className="text-xs leading-relaxed text-slate-500">
                The upper area covers the header, search bar and category tabs. The lower area covers the mini
                promotional bar. Design it as <b>one vertically continuous visual</b> — the two parts are cut from
                the same picture, so anything crossing the dividing line stays connected.
              </p>
            </>
          ) : (
            <div className="border-t border-slate-100 pt-2">
              <PxRow
                label="Header + search + category region"
                value={`${liveSpec.topRegionHeight} px`}
              />
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            Measured from the live preview and converted to a 1080 px-wide export. If you change the layout (for
            example hide the category tabs) these numbers update automatically — re-upload artwork to the new size.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
          Measuring the preview to calculate exact sizes…
        </div>
      )}

      {liveSpec && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Ready-to-copy prompts for generating the artwork
          </div>
          <PromptCard
            title="Prompt A — header only (toggle OFF)"
            active={!extend}
            prompt={headerOnlyPrompt(liveSpec)}
          />
          <PromptCard
            title="Prompt B — header + mini promo bar (toggle ON)"
            active={extend}
            prompt={headerPlusPromoPrompt(liveSpec)}
          />
        </div>
      )}
    </div>
  )
}
