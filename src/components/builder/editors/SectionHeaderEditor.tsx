import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ThemeImageUploader } from "@/components/themes/ThemeImageUploader"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { LinkPicker } from "../LinkPicker"
import {
  buildSectionHeaderPrompt,
  getSectionHeaderConfig,
  patchSectionHeader,
  type SectionHeaderStyle,
} from "../sectionHeader"

const HEADER_STYLE_OPTIONS: Array<{ value: SectionHeaderStyle; label: string; description: string }> = [
  { value: "text", label: "Text", description: "Show the current title and subtitle." },
  { value: "graphic", label: "Graphic Banner", description: "Show only the uploaded banner." },
  { value: "text_graphic", label: "Text + Graphic Banner", description: "Show text, then the banner." },
]

export default function SectionHeaderEditor({
  config,
  onChange,
  sectionName,
}: {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
  sectionName: string
}) {
  const header = getSectionHeaderConfig(config)
  const title = typeof config.title === "string" ? config.title : ""
  const subtitle = typeof config.subtitle === "string" ? config.subtitle : ""
  const patch = (next: Partial<Record<string, unknown>>) =>
    onChange(patchSectionHeader(config, next))
  const copyPrompt = async () => {
    const prompt = buildSectionHeaderPrompt({
      sectionName,
      storeName: header.storeName,
      heading: title,
      subheading: subtitle,
      graphicDescription: header.graphicDescription,
    })
    try {
      await navigator.clipboard.writeText(prompt)
      toast.success("Image prompt copied")
    } catch {
      toast.error("Could not copy the image prompt")
    }
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">Section Header</div>
        <p className="mt-1 text-xs text-slate-500">
          Configure text and a stationary graphic above this section’s content.
        </p>
      </div>

      <div className="space-y-3">
        <Label>Header Style</Label>
        <div className="grid grid-cols-1 gap-2">
          {HEADER_STYLE_OPTIONS.map((option) => {
            const selected = header.style === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => patch({ style: option.value })}
                aria-pressed={selected}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left transition-colors",
                  selected
                    ? "border-brand-500 bg-brand-50 text-brand-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                )}
              >
                <div className="text-sm font-semibold">{option.label}</div>
                <div className="mt-0.5 text-xs text-slate-500">{option.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      {header.style !== "text" ? (
        <>
          <ThemeImageUploader
            label="Graphic Section Banner"
            value={header.imageUrl}
            onChange={(value) => patch({ image_url: value })}
            accept="image/png,image/jpeg,image/webp"
            previewFit="contain"
            maxFileSizeBytes={2 * 1024 * 1024}
          />
          <div className="-mt-3 space-y-0.5 text-xs text-slate-500">
            <div>Recommended size: 1080 × 300 px</div>
            <div>Aspect ratio: 3.6:1</div>
            <div>PNG, JPG, WebP · Recommended maximum file size: 2 MB</div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3">
            <div>
              <div className="text-sm font-medium text-slate-900">Banner Visibility</div>
              <div className="text-xs text-slate-500">Show this uploaded banner in the section.</div>
            </div>
            <Switch checked={header.visible} onCheckedChange={(visible) => patch({ visible })} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <NumberField label="Border Radius" value={header.borderRadius} min={0} max={32} onChange={(border_radius) => patch({ border_radius })} />
            <NumberField label="Horizontal Margin" value={header.horizontalMargin} min={0} max={32} onChange={(horizontal_margin) => patch({ horizontal_margin })} />
            <NumberField label="Bottom Spacing" value={header.bottomSpacing} min={0} max={48} onChange={(bottom_spacing) => patch({ bottom_spacing })} />
          </div>

          <div className="space-y-2">
            <Label>On tap</Label>
            <LinkPicker value={header.linkUrl ?? ""} onChange={(link_url) => patch({ link_url: link_url || null })} />
          </div>
        </>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="section-header-prompt-title">Heading</Label>
        <Input id="section-header-prompt-title" value={title} onChange={(event) => onChange({ ...config, title: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="section-header-prompt-subtitle">Supporting text</Label>
        <Input id="section-header-prompt-subtitle" value={subtitle} onChange={(event) => onChange({ ...config, subtitle: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="section-header-description">Graphic description / campaign requirement</Label>
        <Input id="section-header-description" value={header.graphicDescription} onChange={(event) => patch({ graphic_description: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="section-header-store">Store/brand name</Label>
        <Input id="section-header-store" value={header.storeName} onChange={(event) => patch({ store_name: event.target.value })} />
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={() => void copyPrompt()}>
        Copy Image Prompt
      </Button>
    </div>
  )
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)))
        }}
      />
    </div>
  )
}
