import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { ProductImageGalleryUploader } from "@/components/products/ProductImageGalleryUploader"
import { ProductFamilySelector } from "@/components/products/ProductFamilySelector"
import { useAdminCategories } from "@/hooks/useCategoriesAdmin"
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProductsAdmin"
import type { AdminProduct, FoodType, OriginTag, ProductPayload, ReturnPolicy, SkinType } from "@/types/product.types"

interface ProductFormDialogProps {
  open: boolean
  onClose: () => void
  product?: AdminProduct | null
  /** Pre-seed a new product as an option of this family (from the family detail page's "Add Option" flow). */
  initialFamilyId?: string | null
  initialOptionLabel?: string
}

const CUT_TYPE_SUGGESTIONS = [
  "Curry Cut",
  "Boneless",
  "Whole",
  "Breast",
  "Wings",
  "Drumsticks",
  "Mince / Keema",
  "Chops",
  "Fillet",
  "Steaks",
]

const CERTIFICATION_OPTIONS = ["FSSAI", "Antibiotic-Free", "Hormone-Free", "Farm Fresh"]

type FormState = ProductPayload & { isActive: boolean }

function buildInitialForm(
  product?: AdminProduct | null,
  initialFamilyId?: string | null,
  initialOptionLabel?: string
): FormState {
  if (!product) {
    return {
      name: "",
      description: "",
      price: 0,
      salePrice: undefined,
      costPrice: undefined,
      wholesalePrice: undefined,
      categoryId: undefined,
      stock: 0,
      unit: "kg",
      netQuantity: "",
      images: [],
      sku: "",
      barcode: "",
      lowStockThreshold: 10,
      maxOrderQty: undefined,
      isActive: true,
      isFeatured: false,
      cutType: "",
      pieceCount: "",
      skinType: "NONE",
      foodType: "NON_VEG",
      originTag: "NONE",
      customBadges: [],
      displayDeliveryMinutes: undefined,
      ingredients: "",
      allergenInfo: "",
      shelfLife: "",
      storageInstructions: "",
      certifications: [],
      vendorName: "",
      vendorAddress: "",
      vendorFssai: "",
      returnPolicy: "no_return",
      metaTitle: "",
      metaDescription: "",
      productFamilyId: initialFamilyId ?? null,
      optionLabel: initialOptionLabel ?? "",
      optionSortOrder: 0,
      isDefaultOption: false,
    }
  }
  return {
    name: product.name,
    description: product.description ?? "",
    price: product.price,
    salePrice: product.sale_price ?? undefined,
    costPrice: product.cost_price ?? undefined,
    wholesalePrice: product.wholesale_price ?? undefined,
    categoryId: product.category_id ?? undefined,
    stock: product.stock_quantity,
    unit: product.unit,
    netQuantity: product.net_quantity ?? "",
    images: product.images ?? [],
    sku: product.sku ?? "",
    barcode: product.barcode ?? "",
    lowStockThreshold: product.low_stock_threshold,
    maxOrderQty: product.max_order_qty ?? undefined,
    isActive: product.is_active,
    isFeatured: product.is_featured,
    cutType: product.cut_type ?? "",
    pieceCount: product.piece_count ?? "",
    skinType: (product.skin_type as SkinType) ?? "NONE",
    foodType: (product.food_type as FoodType) ?? "NON_VEG",
    originTag: (product.origin_tag as OriginTag) ?? "NONE",
    customBadges: product.custom_badges ?? [],
    displayDeliveryMinutes: product.display_delivery_minutes ?? undefined,
    ingredients: product.ingredients ?? "",
    allergenInfo: product.allergen_info ?? "",
    shelfLife: product.shelf_life ?? "",
    storageInstructions: product.storage_instructions ?? "",
    certifications: product.certifications ?? [],
    vendorName: product.vendor_name ?? "",
    vendorAddress: product.vendor_address ?? "",
    vendorFssai: product.vendor_fssai ?? "",
    returnPolicy: product.return_policy ?? "no_return",
    metaTitle: product.meta_title ?? "",
    metaDescription: product.meta_description ?? "",
    productFamilyId: product.product_family_id ?? null,
    optionLabel: product.option_label ?? "",
    optionSortOrder: product.option_sort_order ?? 0,
    isDefaultOption: product.is_default_option ?? false,
  }
}

export function ProductFormDialog({
  open,
  onClose,
  product,
  initialFamilyId,
  initialOptionLabel,
}: ProductFormDialogProps) {
  const isEdit = !!product
  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(product, initialFamilyId, initialOptionLabel)
  )
  const [badgesInput, setBadgesInput] = useState("")
  const { data: categories } = useAdminCategories()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  useEffect(() => {
    if (open) {
      const initial = buildInitialForm(product, initialFamilyId, initialOptionLabel)
      setForm(initial)
      setBadgesInput((initial.customBadges ?? []).join(", "))
    }
  }, [open, product, initialFamilyId, initialOptionLabel])

  const patch = (next: Partial<FormState>) => setForm((prev) => ({ ...prev, ...next }))

  const standardCategories = (categories ?? []).filter((c) => c.category_type !== "BUNDLE")

  const isPending = createProduct.isPending || updateProduct.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const { isActive, ...rest } = form
    const payload: ProductPayload = {
      ...rest,
      customBadges: badgesInput
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
    }
    // The create endpoint's thumbnailUrl field isn't nullable (a brand-new
    // product with no images yet just omits it); only the update endpoint
    // accepts `null` to explicitly clear a previously-set thumbnail.
    if (!isEdit && payload.thumbnailUrl == null) {
      delete payload.thumbnailUrl
    }

    if (isEdit && product) {
      updateProduct.mutate(
        { id: product.id, payload: { ...payload, isActive } },
        { onSuccess: onClose }
      )
    } else {
      createProduct.mutate(payload, { onSuccess: onClose })
    }
  }

  const toggleCertification = (label: string, checked: boolean) => {
    const current = form.certifications ?? []
    patch({
      certifications: checked ? [...current, label] : current.filter((c) => c !== label),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue={initialFamilyId ? "family" : "general"}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="meat">Meat Details</TabsTrigger>
              <TabsTrigger value="family">Family</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="more">Details</TabsTrigger>
            </TabsList>

            {/* ── General ── */}
            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Name *</Label>
                <Input
                  id="p-name"
                  value={form.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="e.g. Chicken Curry Cut (Skinless)"
                  required
                  maxLength={255}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-desc">Description</Label>
                <Textarea
                  id="p-desc"
                  value={form.description ?? ""}
                  onChange={(e) => patch({ description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={form.categoryId ?? "none"}
                    onValueChange={(v) => patch({ categoryId: v === "none" ? undefined : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {standardCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-sku">SKU</Label>
                  <Input
                    id="p-sku"
                    value={form.sku ?? ""}
                    onChange={(e) => patch({ sku: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-barcode">Barcode</Label>
                  <Input
                    id="p-barcode"
                    value={form.barcode ?? ""}
                    onChange={(e) => patch({ barcode: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-price">Price (₹) *</Label>
                  <Input
                    id="p-price"
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => patch({ price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-sale-price">Sale Price (₹)</Label>
                  <Input
                    id="p-sale-price"
                    type="number"
                    min={0}
                    value={form.salePrice ?? ""}
                    onChange={(e) =>
                      patch({ salePrice: e.target.value ? parseFloat(e.target.value) : undefined })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-cost-price">Cost Price (₹)</Label>
                  <Input
                    id="p-cost-price"
                    type="number"
                    min={0}
                    value={form.costPrice ?? ""}
                    onChange={(e) =>
                      patch({ costPrice: e.target.value ? parseFloat(e.target.value) : undefined })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-stock">Stock *</Label>
                  <Input
                    id="p-stock"
                    type="number"
                    min={0}
                    value={form.stock ?? 0}
                    onChange={(e) => patch({ stock: parseInt(e.target.value, 10) || 0 })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-wholesale-price">Wholesale Price / B2B (₹)</Label>
                  <Input
                    id="p-wholesale-price"
                    type="number"
                    min={0}
                    value={form.wholesalePrice ?? ""}
                    onChange={(e) =>
                      patch({ wholesalePrice: e.target.value ? parseFloat(e.target.value) : null })
                    }
                    placeholder="Leave blank to use retail price"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={form.isActive} onCheckedChange={(v) => patch({ isActive: v })} />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.isFeatured} onCheckedChange={(v) => patch({ isFeatured: v })} />
                  <Label>Featured</Label>
                </div>
              </div>
            </TabsContent>

            {/* ── Meat Details ── */}
            <TabsContent value="meat" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Cut Type</Label>
                  <Input
                    list="cut-type-suggestions"
                    value={form.cutType ?? ""}
                    onChange={(e) => patch({ cutType: e.target.value })}
                    placeholder="e.g. Curry Cut, Boneless, Whole"
                  />
                  <datalist id="cut-type-suggestions">
                    {CUT_TYPE_SUGGESTIONS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <Label>Skin</Label>
                  <Select
                    value={form.skinType ?? "NONE"}
                    onValueChange={(v) => patch({ skinType: v as SkinType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Not applicable</SelectItem>
                      <SelectItem value="SKIN_ON">Skin-on</SelectItem>
                      <SelectItem value="SKINLESS">Skinless</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Piece Count</Label>
                  <Input
                    value={form.pieceCount ?? ""}
                    onChange={(e) => patch({ pieceCount: e.target.value })}
                    placeholder="e.g. 8-10 pieces"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Pack Size</Label>
                  <Input
                    value={form.netQuantity ?? ""}
                    onChange={(e) => patch({ netQuantity: e.target.value })}
                    placeholder="e.g. 500 g"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Unit</Label>
                  <Select value={form.unit ?? "kg"} onValueChange={(v) => patch({ unit: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="piece">piece</SelectItem>
                      <SelectItem value="pack">pack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Food Type</Label>
                  <Select
                    value={form.foodType ?? "NON_VEG"}
                    onValueChange={(v) => patch({ foodType: v as FoodType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NON_VEG">Non-Veg</SelectItem>
                      <SelectItem value="EGG">Egg</SelectItem>
                      <SelectItem value="VEG">Veg</SelectItem>
                      <SelectItem value="NONE">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Badges (comma-separated)</Label>
                <Input
                  value={badgesInput}
                  onChange={(e) => setBadgesInput(e.target.value)}
                  placeholder="Bestseller, Antibiotic-Free"
                />
              </div>
            </TabsContent>

            {/* ── Family ── */}
            <TabsContent value="family" className="space-y-4 pt-4">
              <ProductFamilySelector
                value={form.productFamilyId ?? null}
                onChange={(familyId) => patch({ productFamilyId: familyId })}
                categoryId={form.categoryId ?? null}
              />
              {form.productFamilyId && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Option Label</Label>
                      <Input
                        value={form.optionLabel ?? ""}
                        onChange={(e) => patch({ optionLabel: e.target.value })}
                        placeholder="e.g. 500g, 1kg, Pack of 2"
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Sort Order</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.optionSortOrder ?? 0}
                        onChange={(e) => patch({ optionSortOrder: parseInt(e.target.value, 10) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={form.isDefaultOption ?? false}
                      onCheckedChange={(v) => patch({ isDefaultOption: !!v })}
                    />
                    <Label className="font-normal">Set as default option</Label>
                  </div>
                </>
              )}
            </TabsContent>

            {/* ── Media ── */}
            <TabsContent value="media" className="space-y-4 pt-4">
              <ProductImageGalleryUploader
                images={form.images ?? []}
                onChange={(images) => patch({ images, thumbnailUrl: images[0] ?? null })}
              />
            </TabsContent>

            {/* ── Details ── */}
            <TabsContent value="more" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Shelf Life</Label>
                  <Input
                    value={form.shelfLife ?? ""}
                    onChange={(e) => patch({ shelfLife: e.target.value })}
                    placeholder="e.g. Consume within 24 hrs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Storage Instructions</Label>
                  <Input
                    value={form.storageInstructions ?? ""}
                    onChange={(e) => patch({ storageInstructions: e.target.value })}
                    placeholder="e.g. Keep frozen at -18°C"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Allergen Info</Label>
                <Textarea
                  value={form.allergenInfo ?? ""}
                  onChange={(e) => patch({ allergenInfo: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Certifications</Label>
                <div className="flex flex-wrap gap-4">
                  {CERTIFICATION_OPTIONS.map((cert) => (
                    <div key={cert} className="flex items-center gap-2">
                      <Checkbox
                        checked={(form.certifications ?? []).includes(cert)}
                        onCheckedChange={(v) => toggleCertification(cert, !!v)}
                      />
                      <Label className="font-normal">{cert}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Vendor Name</Label>
                  <Input
                    value={form.vendorName ?? ""}
                    onChange={(e) => patch({ vendorName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Vendor FSSAI No.</Label>
                  <Input
                    value={form.vendorFssai ?? ""}
                    onChange={(e) => patch({ vendorFssai: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Vendor Address</Label>
                <Input
                  value={form.vendorAddress ?? ""}
                  onChange={(e) => patch({ vendorAddress: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Return Policy</Label>
                <Select
                  value={form.returnPolicy ?? "no_return"}
                  onValueChange={(v) => patch({ returnPolicy: v as ReturnPolicy })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_return">No Return</SelectItem>
                    <SelectItem value="7_day">7 Day Return</SelectItem>
                    <SelectItem value="instant">Instant Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
