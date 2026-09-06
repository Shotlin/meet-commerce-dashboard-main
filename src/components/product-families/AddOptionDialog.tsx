import { useState } from "react"
import { Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { AttachExistingProductForm } from "./AttachExistingProductForm"

const OPTION_PRESETS = ["250g", "500g", "1kg", "2kg", "Pack of 2"] as const

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  familyId: string
  familyName: string
  onProductAttached?: () => void
  /** Close this dialog and open the product form pre-seeded with this family + option label. */
  onCreateNew: (optionLabel?: string) => void
}

export function AddOptionDialog({
  open,
  onOpenChange,
  familyId,
  familyName,
  onProductAttached,
  onCreateNew,
}: Props) {
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add option to {familyName}</DialogTitle>
          <DialogDescription>Choose an existing product or create a new one</DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "existing" | "new")}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing" className="gap-2">
              <Search className="h-4 w-4" />
              Add existing product
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-2">
              <Plus className="h-4 w-4" />
              Create new option
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="flex-1 overflow-hidden mt-4">
            <AttachExistingProductForm
              familyId={familyId}
              familyName={familyName}
              onAttached={() => {
                onProductAttached?.()
                onOpenChange(false)
              }}
            />
          </TabsContent>

          <TabsContent value="new" className="flex-1 overflow-auto mt-4">
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Pick a pack size to pre-fill, or start blank — you&apos;ll fill in the rest in the
                product form.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {OPTION_PRESETS.map((label) => (
                  <Button key={label} type="button" variant="outline" size="sm" onClick={() => onCreateNew(label)}>
                    <Plus className="mr-1 h-3 w-3" />
                    {label}
                  </Button>
                ))}
                <Button type="button" size="sm" onClick={() => onCreateNew()}>
                  <Plus className="mr-1 h-3 w-3" />
                  Custom
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
