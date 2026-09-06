import { useState } from "react"
import { MoreHorizontal, Pencil, Plus, Search, Store, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EmptyState } from "@/components/shared/EmptyState"
import { ShopProductFormDialog } from "./ShopProductFormDialog"
import { useShopScope } from "@/context/ShopScopeContext"
import { useShopProducts, useDeleteShopProduct } from "@/hooks/useShopProductsAdmin"
import { useDebounce } from "@/hooks/useDebounce"
import { formatINR } from "@/lib/utils"
import type { ShopProduct } from "@/types/shopProduct.types"

export function ShopProductsTab() {
  const { activeShopId, activeShop } = useShopScope()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingShopProduct, setEditingShopProduct] = useState<ShopProduct | null>(null)

  const { data, isLoading } = useShopProducts(activeShopId, { search: debouncedSearch || undefined, limit: 50 })
  const deleteShopProduct = useDeleteShopProduct(activeShopId)

  if (!activeShopId) {
    return (
      <div className="rounded-lg border border-dashed py-16">
        <EmptyState
          icon={<Store className="h-6 w-6 text-muted-foreground" />}
          title="No shop selected"
          description="Pick a shop from the Shop Switcher in the top bar to manage its price, stock, and availability overrides."
        />
      </div>
    )
  }

  const items = data?.items ?? []
  const excludeProductIds = new Set(items.map((sp) => sp.product_id))

  const openCreate = () => {
    setEditingShopProduct(null)
    setDialogOpen(true)
  }

  const openEdit = (sp: ShopProduct) => {
    setEditingShopProduct(sp)
    setDialogOpen(true)
  }

  const handleDelete = (sp: ShopProduct) => {
    if (confirm(`Remove "${sp.product.name}" from ${activeShop?.name ?? "this shop"}?`)) {
      deleteShopProduct.mutate(sp.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search this shop's products…"
            className="pl-8"
          />
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> Add Product to Shop
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price Override</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    icon={<Store className="h-6 w-6 text-muted-foreground" />}
                    title="No products in this shop yet"
                    description="Add a product from the master catalog to give it shop-specific pricing and stock."
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((sp) => (
                <TableRow key={sp.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {sp.product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={sp.product.image_url}
                          alt=""
                          className="h-9 w-9 rounded-md object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-md bg-muted shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{sp.product.name ?? "Unknown"}</p>
                        {sp.product.sku && (
                          <p className="text-xs text-muted-foreground truncate">SKU: {sp.product.sku}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sp.product.category_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {sp.price != null ? (
                      <>
                        {formatINR(Number(sp.price))}
                        {sp.sale_price != null && (
                          <span className="ml-1 text-xs text-muted-foreground line-through">
                            {formatINR(Number(sp.sale_price))}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Inherited</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {sp.stock_quantity}
                    {sp.stock_quantity <= sp.low_stock_threshold && (
                      <Badge variant="outline" className="ml-1.5 text-[10px]">
                        Low
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sp.is_available ? "default" : "outline"}>
                      {sp.is_available ? "Available" : "Unavailable"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sp.is_featured ? <Badge variant="secondary">Featured</Badge> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(sp)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(sp)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove from Shop
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {activeShopId && (
        <ShopProductFormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          shopId={activeShopId}
          shopProduct={editingShopProduct}
          excludeProductIds={excludeProductIds}
        />
      )}
    </div>
  )
}
