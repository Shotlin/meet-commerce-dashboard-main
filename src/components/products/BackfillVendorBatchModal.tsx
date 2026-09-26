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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import type { CreateManualInventoryLotPayload } from "@/types/shopProduct.types"

interface BackfillVendorBatchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productLabel: string
  currentStock: number
  onConfirm: (payload: CreateManualInventoryLotPayload) => void
  isSubmitting: boolean
}

/**
 * Manually records a vendor batch (name, quantity, expiry, optional
 * quality video) for stock that never came through the real Vendor
 * Procurement receiving pipeline — e.g. stock typed in by hand before a
 * vendor relationship was formalized, or predating the procurement system
 * entirely. This is deliberately NOT the same thing as receiving a real
 * supply order: it creates a real `inventory_lots` row (so it shows up in
 * the read-only "Vendor Batches" panel above this button, and its optional
 * video becomes resolvable from a customer's invoice QR the same way a
 * real receipt's video is), but there is no vendor account, quote, or
 * fulfilment workflow behind it — just a record an admin is vouching for.
 *
 * "Also add to shop stock" is off by default: if the stock number is
 * already correct (e.g. you set it manually when adding the product), you
 * only want the batch/vendor/video attached, not the quantity added again.
 */
export function BackfillVendorBatchModal({
  open,
  onOpenChange,
  productLabel,
  currentStock,
  onConfirm,
  isSubmitting,
}: BackfillVendorBatchModalProps) {
  const [vendorName, setVendorName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [batchReference, setBatchReference] = useState("")
  const [notes, setNotes] = useState("")
  const [alsoAddToStock, setAlsoAddToStock] = useState(false)

  useEffect(() => {
    if (!open) return
    setVendorName("")
    setQuantity("")
    setExpiryDate("")
    setVideoUrl("")
    setBatchReference("")
    setNotes("")
    setAlsoAddToStock(false)
  }, [open])

  const quantityNum = Number(quantity) || 0
  const resultingStock = currentStock + quantityNum
  const invalid =
    vendorName.trim().length < 2 ||
    quantityNum <= 0 ||
    !expiryDate ||
    (videoUrl.trim().length > 0 && !/^https?:\/\//i.test(videoUrl.trim()))

  const handleConfirm = () => {
    if (invalid) return
    onConfirm({
      vendor_name: vendorName.trim(),
      quantity: quantityNum,
      expiry_date: expiryDate,
      video_url: videoUrl.trim() || undefined,
      batch_reference: batchReference.trim() || undefined,
      notes: notes.trim() || undefined,
      also_add_to_stock: alsoAddToStock,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Backfill Vendor Batch</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-sm font-medium">{productLabel}</p>
            <p className="text-xs text-muted-foreground">
              Records a vendor batch that never went through Procurement Requests — for stock that already
              existed before a vendor relationship was set up. It won't create a vendor account or an
              order; it just attaches provenance (and, if you want, a quality video) to this stock.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Vendor name *</Label>
            <Input
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g. Ramesh Poultry Farm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Quantity *</Label>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expiry date *</Label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Batch / reference number (optional)</Label>
            <Input
              value={batchReference}
              onChange={(e) => setBatchReference(e.target.value)}
              placeholder="e.g. invoice or delivery-note number"
              maxLength={50}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Quality video URL (optional)</Label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://…"
            />
            <p className="text-[11px] text-muted-foreground">
              If you have a cleaning/packing video for this batch, paste its URL — it'll be resolvable from
              the customer's invoice QR the same way a real vendor receipt's video is.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context for this backfill"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm">Also add this quantity to shop stock</Label>
              <p className="text-[11px] text-muted-foreground">
                Leave off if the stock number is already correct — this only attaches vendor/video
                provenance without changing it.
              </p>
            </div>
            <Switch checked={alsoAddToStock} onCheckedChange={setAlsoAddToStock} />
          </div>

          {alsoAddToStock && quantityNum > 0 && (
            <p className="text-xs text-muted-foreground">
              New stock will be <span className="font-semibold text-ink">{resultingStock}</span>
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={invalid || isSubmitting} onClick={handleConfirm}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Backfill Batch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
