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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { AdjustShopProductStockPayload } from "@/types/shopProduct.types"

interface AdjustStockModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productLabel: string
  currentStock: number
  onConfirm: (payload: AdjustShopProductStockPayload) => void
  isSubmitting: boolean
}

const REASON_MIN_LENGTH = 5

/**
 * The real "stock adjustment flow" the Edit Shop Pricing & Stock modal's
 * Stock field has always referenced (that text used to point at nothing —
 * see the modal's own note). Every change here is a signed delta against
 * the backend's `applyStockChange`, which holds a row lock and writes an
 * auditable `stock_movements` ledger entry — never a silent overwrite.
 * This is deliberately for corrections (miscounts, damage, returns) rather
 * than restocking: a real vendor delivery flows in automatically through
 * Vendor Procurement receiving (see the read-only batch list above this
 * button in the parent dialog).
 */
export function AdjustStockModal({
  open,
  onOpenChange,
  productLabel,
  currentStock,
  onConfirm,
  isSubmitting,
}: AdjustStockModalProps) {
  const [direction, setDirection] = useState<"add" | "remove">("add")
  const [magnitude, setMagnitude] = useState("")
  const [type, setType] = useState<AdjustShopProductStockPayload["type"]>("MANUAL_ADJUSTMENT")
  const [reason, setReason] = useState("")

  useEffect(() => {
    if (!open) return
    setDirection("add")
    setMagnitude("")
    setType("MANUAL_ADJUSTMENT")
    setReason("")
  }, [open])

  const magnitudeNum = Math.trunc(Number(magnitude)) || 0
  const delta = direction === "add" ? magnitudeNum : -magnitudeNum
  const resultingStock = currentStock + delta
  const reasonTooShort = reason.trim().length > 0 && reason.trim().length < REASON_MIN_LENGTH
  const invalid = magnitudeNum <= 0 || resultingStock < 0 || reason.trim().length < REASON_MIN_LENGTH

  const handleConfirm = () => {
    if (invalid) return
    onConfirm({ quantity_delta: delta, type, reason: reason.trim() })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-sm font-medium">{productLabel}</p>
            <p className="text-xs text-muted-foreground">Current stock: {currentStock}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as "add" | "remove")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add (+)</SelectItem>
                  <SelectItem value="remove">Remove (−)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                value={magnitude}
                onChange={(e) => setMagnitude(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select value={type} onValueChange={(v) => setType(v as AdjustShopProductStockPayload["type"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL_ADJUSTMENT">Manual correction (miscount, etc.)</SelectItem>
                <SelectItem value="DAMAGED_STOCK">Damaged / spoiled stock</SelectItem>
                <SelectItem value="RETURN_STOCK">Customer return</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Note (required)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Recounted after weekly stock audit"
              rows={2}
            />
            {reasonTooShort && (
              <p className="text-[11px] text-destructive">At least {REASON_MIN_LENGTH} characters.</p>
            )}
          </div>

          {magnitudeNum > 0 && (
            <p className="text-xs text-muted-foreground">
              New stock will be{" "}
              <span className={resultingStock < 0 ? "font-semibold text-destructive" : "font-semibold text-ink"}>
                {resultingStock}
              </span>
              {resultingStock < 0 && " — cannot go below 0"}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={invalid || isSubmitting} onClick={handleConfirm}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply Adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
