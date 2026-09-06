import { useState } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUpdateProduct } from "@/hooks/useProductsAdmin"
import type { AdminProduct, FoodType, OriginTag } from "@/types/product.types"

const FOOD_TYPES: FoodType[] = ["NON_VEG", "EGG", "VEG", "NONE"]
const ORIGIN_TAGS: OriginTag[] = ["LOCAL", "IMPORTED", "NONE"]

interface Props {
  product: AdminProduct
  familyId: string
  familyName: string
  onSuccess: () => void
  onCancel: () => void
}

export function OptionEditorForm({ product, familyId, familyName, onSuccess, onCancel }: Props) {
  const initialOptionLabel = product.option_label || product.net_quantity || product.unit || ""

  const [optionLabel, setOptionLabel] = useState(initialOptionLabel)
  const [sortOrder, setSortOrder] = useState(product.option_sort_order ?? 0)
  const [isDefault, setIsDefault] = useState(product.is_default_option ?? false)
  const [foodType, setFoodType] = useState<FoodType>(product.food_type ?? "NONE")
  const [originTag, setOriginTag] = useState<OriginTag>(product.origin_tag ?? "NONE")

  const updateProduct = useUpdateProduct()

  const handleAttach = async () => {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        payload: {
          productFamilyId: familyId,
          optionLabel: optionLabel.trim() || undefined,
          optionSortOrder: sortOrder,
          isDefaultOption: isDefault,
          foodType,
          originTag,
        },
      })
      toast.success(`${product.name} added to ${familyName}`)
      onSuccess()
    } catch {
      toast.error("Failed to attach product")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={onCancel} className="w-fit -ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to search
      </Button>

      <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
          {product.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.thumbnail_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No img
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium">{product.name}</p>
          <p className="text-sm text-muted-foreground">
            ₹{product.sale_price ?? product.price} · {product.unit}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="optionLabel">
            Option label{" "}
            <span className="text-muted-foreground text-xs">(e.g., 500g, 1kg, Pack of 2)</span>
          </Label>
          <Input
            id="optionLabel"
            value={optionLabel}
            onChange={(e) => setOptionLabel(e.target.value)}
            placeholder="e.g., 500g"
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort order</Label>
          <Input
            id="sortOrder"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
            min={0}
          />
          <p className="text-xs text-muted-foreground">Lower numbers appear first. Default is 0.</p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isDefault"
            checked={isDefault}
            onCheckedChange={(checked) => setIsDefault(checked === true)}
          />
          <Label htmlFor="isDefault" className="cursor-pointer">
            Set as default option
          </Label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="foodType">Food type</Label>
            <Select value={foodType} onValueChange={(v) => setFoodType(v as FoodType)}>
              <SelectTrigger id="foodType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FOOD_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "NONE" ? "Not specified" : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="originTag">Origin tag</Label>
            <Select value={originTag} onValueChange={(v) => setOriginTag(v as OriginTag)}>
              <SelectTrigger id="originTag">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORIGIN_TAGS.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag === "NONE" ? "Not specified" : tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={updateProduct.isPending}>
          Cancel
        </Button>
        <Button onClick={handleAttach} disabled={updateProduct.isPending} className="flex-1">
          {updateProduct.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Attaching...
            </>
          ) : (
            `Attach to ${familyName}`
          )}
        </Button>
      </div>
    </div>
  )
}
