import { useState } from "react"
import { Link } from "react-router-dom"
import { Layers, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductFormDialog } from "@/components/products/ProductFormDialog"
import { ShopProductsTab } from "@/components/products/ShopProductsTab"
import { useAdminProducts, useDeleteProduct } from "@/hooks/useProductsAdmin"
import { useAdminCategories } from "@/hooks/useCategoriesAdmin"
import { useDebounce } from "@/hooks/useDebounce"
import { formatINR } from "@/lib/utils"
import type { AdminProduct } from "@/types/product.types"
import { Package } from "lucide-react"

export default function ProductsPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)

  const { data: categories } = useAdminCategories()
  const { data, isLoading } = useAdminProducts({
    search: debouncedSearch || undefined,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    status: statusFilter === "all" ? undefined : (statusFilter as any),
    limit: 50,
  })
  const deleteProduct = useDeleteProduct()

  const products = data?.products ?? []

  const openCreate = () => {
    setEditingProduct(null)
    setDialogOpen(true)
  }

  const openEdit = (product: AdminProduct) => {
    setEditingProduct(product)
    setDialogOpen(true)
  }

  const handleDelete = (product: AdminProduct) => {
    if (confirm(`Delete "${product.name}"?`)) deleteProduct.mutate(product.id)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Products" subtitle="Manage your meat catalog">
        <div className="flex items-center gap-2">
          <Link to="/products/families">
            <Button variant="outline" size="sm">
              <Layers className="h-4 w-4 mr-1.5" /> Families
            </Button>
          </Link>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> Add Product
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="master">
        <TabsList>
          <TabsTrigger value="master">Master Catalog</TabsTrigger>
          <TabsTrigger value="shop">Shop Products</TabsTrigger>
        </TabsList>

        <TabsContent value="master" className="space-y-6 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className="pl-8"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(categories ?? [])
              .filter((c) => c.category_type !== "BUNDLE")
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="hidden md:table-cell">Cut / Pack</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    icon={<Package className="h-6 w-6 text-muted-foreground" />}
                    title="No products yet"
                    description="Add your first product to get started."
                  />
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {product.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.thumbnail_url}
                          alt=""
                          className="h-9 w-9 rounded-md object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-md bg-muted shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        {product.sku && (
                          <p className="text-xs text-muted-foreground truncate">SKU: {product.sku}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {product.category_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatINR(product.price)}
                    {product.sale_price != null && (
                      <span className="ml-1 text-xs text-muted-foreground line-through">
                        {formatINR(product.sale_price)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{product.stock_quantity}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {[product.cut_type, product.net_quantity].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "outline"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(product)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
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

      <ProductFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} product={editingProduct} />
        </TabsContent>

        <TabsContent value="shop" className="pt-4">
          <ShopProductsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
