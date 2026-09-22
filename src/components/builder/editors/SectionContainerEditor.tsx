import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeColorPicker } from "@/components/themes/ThemeColorPicker"
import {
  getSectionContainerConfig,
  patchSectionContainer,
} from "../sectionHeader"

/**
 * The premium box a section's graphic banner and product body sit inside —
 * "Premium Fresh — Product Slider" (`product_carousel`) and "Premium Fresh —
 * Product Grid" (`category_product_grid`) only. Controls the SAME container
 * the banner is now flush against (see `PremiumProductPreview.tsx`), so
 * picking a background here is how an admin matches the container to the
 * uploaded artwork instead of leaving a mismatched white gap around it.
 */
export default function SectionContainerEditor({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}) {
  const container = getSectionContainerConfig(config)
  const patch = (next: Partial<Record<string, unknown>>) =>
    onChange(patchSectionContainer(config, next))

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">Section Container</div>
        <p className="mt-1 text-xs text-slate-500">
          The banner sits flush against this box's top edge — the background fills the whole
          section body below it, so pick a color that matches your uploaded artwork.
        </p>
      </div>

      <ThemeColorPicker
        label="Container Background Color"
        value={container.backgroundColor}
        onChange={(background) => patch({ container_background_color: background })}
      />

      <ThemeColorPicker
        label="Container Border Color"
        value={container.borderColor}
        onChange={(border) => patch({ container_border_color: border })}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NumberField
          label="Container Border Width"
          value={container.borderWidth}
          min={0}
          max={8}
          onChange={(border_width) => patch({ container_border_width: border_width })}
        />
        <NumberField
          label="Top Corner Radius"
          value={container.topRadius}
          min={0}
          max={32}
          onChange={(top_radius) => patch({ container_top_radius: top_radius })}
        />
      </div>
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
