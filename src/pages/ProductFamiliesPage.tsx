import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Layers, Plus, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/PageHeader"
import { CreateFamilyDialog } from "@/components/product-families/CreateFamilyDialog"
import { useDebounce } from "@/hooks/useDebounce"
import { useProductFamiliesList } from "@/hooks/useProductFamiliesAdmin"

export default function ProductFamiliesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [openCreate, setOpenCreate] = useState(false)
  const debounced = useDebounce(search, 250)
  const { data, isLoading } = useProductFamiliesList({ search: debounced || undefined, limit: 50 })

  const items = data?.items ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/catalogue">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <PageHeader
            title="Product Families"
            subtitle="Group multiple pack sizes of the same product"
          />
        </div>
        <Button onClick={() => setOpenCreate(true)}>
          <Plus className="mr-1 h-4 w-4" /> New family
        </Button>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search families…"
            className="h-9"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
            <Layers className="h-8 w-8 opacity-50" />
            <p>
              No product families yet. Create one to group pack sizes like 500g and 1kg under a
              single product.
            </p>
            <Button size="sm" onClick={() => setOpenCreate(true)}>
              <Plus className="mr-1 h-4 w-4" /> Create first family
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((fam) => (
              <Link
                key={fam.id}
                to={`/products/families/${fam.id}`}
                className="flex items-center gap-3 py-3 hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{fam.name}</span>
                    {!fam.is_active && (
                      <Badge variant="outline" className="text-[10px]">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{fam.slug}</p>
                </div>
                <span className="text-xs text-muted-foreground">View →</span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <CreateFamilyDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreated={(fam) => navigate(`/products/families/${fam.id}`)}
      />
    </div>
  )
}
