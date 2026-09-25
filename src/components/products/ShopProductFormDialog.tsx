import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Loader2, PackageSearch, Search } from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"
import { useAdminProducts } from "@/hooks/useProductsAdmin"
import {
  useAdjustShopProductStock,
  useCreateShopProduct,
  useShopProductInventoryLots,
  useUpdateShopProduct,
} from "@/hooks/useShopProductsAdmin"
import { AdjustStockModal } from "@/components/products/AdjustStockModal"
import type { AdminProduct } from "@/types/product.types"
import type { AdjustShopProductStockPayload, ShopProduct } from "@/types/shopProduct.types"

interface ShopProductFormDialogProps {
  open: boolean
  onClose: () => void
  shopId: string
  /** Present for edit mode; absent (create/attach mode) otherwise. */
  shopProduct?: ShopProduct | null
  /** Product ids already attached to this shop — hidden from the attach search. */
  excludeProductIds?: Set<string>
}

interface OverrideFormState {
  price: string
  salePrice: string
  costPrice: string
  wholesalePrice: string
  stockQuantity: number
  lowStockThreshold: number
  maxOrderQty: number
  isAvailable: boolean
  isFeatured: boolean
}

function buildInitialOverrides(shopProduct?: ShopProduct | null): OverrideFormState {
  if (!shopProduct) {
    return {
      price: "",
      salePrice: "",
      costPrice: "",
      wholesalePrice: "",
      stockQuantity: 0,
      lowStockThreshold: 5,
      maxOrderQty: 50,
      isAvailable: true,
      isFeatured: false,
    }
  }
  return {
    price: shopProduct.price != null ? String(shopProduct.price) : "",
    salePrice: shopProduct.sale_price != null ? String(shopProduct.sale_price) : "",
    costPrice: shopProduct.cost_price != null ? String(shopProduct.cost_price) : "",
    wholesalePrice: shopProduct.wholesale_price != null ? String(shopProduct.wholesale_price) : "",
    stockQuantity: shopProduct.stock_quantity,
    lowStockThreshold: shopProduct.low_stock_threshold,
    maxOrderQty: shopProduct.max_order_qty,
    isAvailable: shopProduct.is_available,
    isFeatured: shopProduct.is_featured,
  }
}

export function ShopProductFormDialog({
  open,
  onClose,
  shopId,
  shopProduct,
  excludeProductIds,
}: ShopProductFormDialogProps) {
  const isEdit = !!shopProduct
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null)
  const [form, setForm] = useState<OverrideFormState>(() => buildInitialOverrides(shopProduct))
  const [search, setSearch] = useState("")
  const [adjustStockOpen, setAdjustStockOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useAdminProducts({ search: debouncedSearch || undefined, limit: 50 })
  const createShopProduct = useCreateShopProduct(shopId)
  const updateShopProduct = useUpdateShopProduct(shopId)
  const { data: inventoryLots, isLoading: isLoadingLots } = useShopProductInventoryLots(
    shopId,
    shopProduct?.id ?? null
  )
  const adjustStock = useAdjustShopProductStock(shopId)

  useEffect(() => {
    if (open) {
      setForm(buildInitialOverrides(shopProduct))
      setSelectedProduct(null)
      setSearch("")
    }
  }, [open, shopProduct])

  const patch = (next: Partial<OverrideFormState>) => setForm((prev) => ({ ...prev, ...next }))

  const products = (data?.products ?? []).filter((p) => !excludeProductIds?.has(p.id))

  const isPending = createShopProduct.isPending || updateShopProduct.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const overrides = {
      price: form.price.trim() === "" ? null : parseFloat(form.price),
      sale_price: form.salePrice.trim() === "" ? null : parseFloat(form.salePrice),
      cost_price: form.costPrice.trim() === "" ? null : parseFloat(form.costPrice),
      wholesale_price: form.wholesalePrice.trim() === "" ? null : parseFloat(form.wholesalePrice),
      stock_quantity: form.stockQuantity,
      low_stock_threshold: form.lowStockThreshold,
      max_order_qty: form.maxOrderQty,
      is_available: form.isAvailable,
      is_featured: form.isFeatured,
    }

    if (isEdit && shopProduct) {
      const { stock_quantity, ...updatable } = overrides
      updateShopProduct.mutate({ id: shopProduct.id, payload: updatable }, { onSuccess: onClose })
    } else if (selectedProduct) {
      createShopProduct.mutate({ product_id: selectedProduct.id, ...overrides }, { onSuccess: onClose })
    }
  }

  const showOverrideForm = isEdit || !!selectedProduct
  const productLabel = isEdit ? shopProduct?.product.name : selectedProduct?.name

  const lots = inventoryLots?.lots ?? []
  const lotQuantityTotal = inventoryLots?.lotQuantityTotal ?? 0

  const handleAdjustStock = (payload: AdjustShopProductStockPayload) => {
    if (!shopProduct) return
    adjustStock.mutate(
      { shopProductId: shopProduct.id, payload },
      { onSuccess: () => setAdjustStockOpen(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Shop Pricing & Stock" : "Add Product to Shop"}</DialogTitle>
        </DialogHeader>

        {!showOverrideForm ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border rounded-md px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search master catalog…"
                className="border-0 px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <ScrollArea className="h-80">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {search ? "No products found" : "No products available to attach"}
                </p>
              ) : (
                <div className="space-y-2 pr-2">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProduct(p)}
                      className="flex w-full items-center gap-3 rounded-lg border p-2.5 text-left hover:bg-muted/50"
                    >
                      {p.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.thumbnail_url} alt="" className="h-10 w-10 rounded-md object-cover shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.category_name ?? "—"} · ₹{p.sale_price ?? p.price}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 w-fit"
                onClick={() => setSelectedProduct(null)}
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to search
              </Button>
            )}
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-sm font-medium">{productLabel}</p>
              <p className="text-xs text-muted-foreground">
                Leave price fields blank to inherit the master catalog price.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(e) => patch({ price: e.target.value })}
                  placeholder="Inherit"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sale Price (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.salePrice}
                  onChange={(e) => patch({ salePrice: e.target.value })}
                  placeholder="Inherit"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cost Price (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.costPrice}
                  onChange={(e) => patch({ costPrice: e.target.value })}
                  placeholder="Inherit"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Wholesale Price / B2B (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.wholesalePrice}
                  onChange={(e) => patch({ wholesalePrice: e.target.value })}
                  placeholder="Inherit"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Stock *</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.stockQuantity}
                  onChange={(e) => patch({ stockQuantity: parseInt(e.target.value, 10) || 0 })}
                  disabled={isEdit}
                  required
                />
                {isEdit && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-[11px]"
                    onClick={() => setAdjustStockOpen(true)}
                  >
                    Adjust stock…
                  </Button>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Low Stock At</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.lowStockThreshold}
                  onChange={(e) => patch({ lowStockThreshold: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Order Qty</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxOrderQty}
                  onChange={(e) => patch({ maxOrderQty: parseInt(e.target.value, 10) || 1 })}
                />
              </div>
            </div>

            {isEdit && (
              <div className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <PackageSearch className="h-3.5 w-3.5" />
                  Vendor Batches
                </div>
                {isLoadingLots ? (
                  <Skeleton className="h-10 w-full" />
                ) : lots.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No vendor-received stock is linked to this product yet — stock here is manually maintained.
                  </p>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      {lots.map((lot) => (
                        <div
                          key={lot.id}
                          className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{lot.vendor_name ?? "Unknown vendor"}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {lot.batch_number}
                              {lot.supply_number ? ` · ${lot.supply_number}` : ""}
                              {lot.expiry_date ? ` · exp ${lot.expiry_date.slice(0, 10)}` : ""}
                            </p>
                          </div>
                          <span className="ml-2 shrink-0 font-semibold">{lot.quantity_on_hand}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Total from vendor batches: <span className="font-semibold text-ink">{lotQuantityTotal}</span>
                      {" · "}Sellable stock: <span className="font-semibold text-ink">{shopProduct?.stock_quantity}</span>
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={form.isAvailable} onCheckedChange={(v) => patch({ isAvailable: v })} />
                <Label>Available</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isFeatured} onCheckedChange={(v) => patch({ isFeatured: v })} />
                <Label>Featured</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Add to Shop"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
      {shopProduct && (
        <AdjustStockModal
          open={adjustStockOpen}
          onOpenChange={setAdjustStockOpen}
          productLabel={shopProduct.product.name ?? "Shop product"}
          currentStock={shopProduct.stock_quantity}
          onConfirm={handleAdjustStock}
          isSubmitting={adjustStock.isPending}
        />
      )}
    </Dialog>
  )
}
