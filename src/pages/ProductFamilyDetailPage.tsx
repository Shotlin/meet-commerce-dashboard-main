import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, CheckCircle2, Loader2, Pencil, Plus, Power } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/PageHeader"
import { AddOptionDialog } from "@/components/product-families/AddOptionDialog"
import { EditFamilyDialog } from "@/components/product-families/EditFamilyDialog"
import { FamilyOptionsTable } from "@/components/product-families/FamilyOptionsTable"
import { ProductFormDialog } from "@/components/products/ProductFormDialog"
import {
  useDeactivateProductFamily,
  useProductFamily,
  useUpdateProductFamily,
} from "@/hooks/useProductFamiliesAdmin"

export default function ProductFamilyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [openEdit, setOpenEdit] = useState(false)
  const [openAddOption, setOpenAddOption] = useState(false)
  const [createOptionLabel, setCreateOptionLabel] = useState<string | undefined>(undefined)
  const [openCreateProduct, setOpenCreateProduct] = useState(false)

  const { data: family, isLoading, refetch } = useProductFamily(id)
  const update = useUpdateProductFamily()
  const deactivate = useDeactivateProductFamily()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!family) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Product family not found.</p>
        <Link to="/products/families" className="mt-2 inline-block">
          <Button variant="ghost" size="sm">
            ← Back to families
          </Button>
        </Link>
      </Card>
    )
  }

  const handleToggleActive = () => {
    if (family.is_active) {
      deactivate.mutate(family.id)
    } else {
      update.mutate({ id: family.id, payload: { is_active: true } })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/products/families">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={family.name}
          subtitle={`Slug: ${family.slug}${
            family.product_count !== undefined ? ` · ${family.product_count} options` : ""
          }`}
        />
        <div className="ml-auto flex items-center gap-2">
          {family.is_active ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" /> Active
            </Badge>
          ) : (
            <Badge variant="outline">Inactive</Badge>
          )}
        </div>
      </div>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            {family.description ? (
              <p className="text-sm text-muted-foreground">{family.description}</p>
            ) : (
              <p className="text-sm italic text-muted-foreground">No description.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpenEdit(true)}>
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleActive}
              disabled={update.isPending || deactivate.isPending}
            >
              {(update.isPending || deactivate.isPending) && (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              )}
              <Power className="mr-1 h-3.5 w-3.5" />
              {family.is_active ? "Deactivate" : "Activate"}
            </Button>
            <Button size="sm" onClick={() => setOpenAddOption(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add Option
            </Button>
          </div>
        </div>
      </Card>

      <FamilyOptionsTable
        familyId={family.id}
        familyName={family.name}
        onProductRemoved={() => refetch()}
        onAddOptionClick={() => setOpenAddOption(true)}
      />

      <EditFamilyDialog family={family} open={openEdit} onOpenChange={setOpenEdit} />

      <AddOptionDialog
        open={openAddOption}
        onOpenChange={setOpenAddOption}
        familyId={family.id}
        familyName={family.name}
        onProductAttached={() => refetch()}
        onCreateNew={(optionLabel) => {
          setCreateOptionLabel(optionLabel)
          setOpenAddOption(false)
          setOpenCreateProduct(true)
        }}
      />

      {openCreateProduct && (
        <ProductFormDialog
          open={openCreateProduct}
          onClose={() => {
            setOpenCreateProduct(false)
            refetch()
          }}
          initialFamilyId={family.id}
          initialOptionLabel={createOptionLabel}
        />
      )}
    </div>
  )
}
