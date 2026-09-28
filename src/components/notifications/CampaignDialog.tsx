import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, AlertCircle } from "lucide-react"
import { useSendBulk, useScheduleCampaign, useSegmentCount, useTemplates } from "@/hooks/useNotifications"
import { useCustomerSegments } from "@/hooks/useCustomerSegments"
import { NotificationPushPreview } from "@/components/notifications/NotificationPushPreview"
import type { CampaignSegment, NotificationTemplate } from "@/types/notification.types"

const SEGMENTS: { value: CampaignSegment; label: string; description: string; needsValue?: boolean; valuePlaceholder?: string; comingSoon?: boolean }[] = [
  { value: "all_customers", label: "All Customers", description: "Every active customer with FCM token" },
  { value: "custom_segment", label: "Customer Segment", description: "An admin-defined segment (see Customer Segments)", needsValue: true },
  { value: "inactive_customers", label: "Inactive Customers", description: "No orders in 30 days" },
  { value: "high_value", label: "High Value", description: "₹5,000+ total orders" },
  { value: "specific_user", label: "Specific User", description: "Target by phone or user ID — customer app only", needsValue: true, valuePlaceholder: "Phone number or User ID" },
  { value: "store_customers", label: "Store Customers", description: "Customers who ordered from a specific store", needsValue: true, valuePlaceholder: "Shop ID" },
  { value: "cart_not_empty", label: "Cart Not Empty", description: "Users with items in cart", comingSoon: true },
]

// Vendor-app audience. Delivered ONLY to the FreshCuts Vendor app — never to
// the customer app, even for someone who uses the same phone number in both.
const VENDOR_SEGMENTS: typeof SEGMENTS = [
  { value: "all_vendors", label: "All Vendors", description: "Every active vendor signed into the vendor app" },
  { value: "specific_vendor", label: "Specific Vendor", description: "One vendor, by vendor ID or a vendor user's phone", needsValue: true, valuePlaceholder: "Vendor ID or vendor phone number" },
]

const VENDOR_SEGMENT_VALUES = VENDOR_SEGMENTS.map((s) => s.value)

// Every value here is a real, reachable in-app route (cross-checked against
// the mobile app's actual GoRouter route tree, app_router.dart) — an
// "Offers / Price Drop" preset used to point at `/categories?tab=price_drop`,
// but CategoryLandingScreen never reads a `tab` query param and the app has
// no discount/on-sale browsing screen anywhere, so it silently did nothing
// different from plain Categories. Removed rather than ship a dead link —
// see the mobile customer app's CLAUDE.md notification-navigation entry.
const DEEP_LINK_PRESETS = [
  { label: "Home", value: "/home" },
  { label: "Notifications", value: "/profile/notifications" },
  { label: "Cart", value: "/cart" },
  { label: "Wallet", value: "/profile/wallet" },
  { label: "Orders", value: "/orders" },
  { label: "Categories", value: "/categories" },
  { label: "Search", value: "/search" },
  { label: "Wishlist", value: "/profile/wishlist" },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "send" | "schedule"
}

export function CampaignDialog({ open, onOpenChange, mode }: Props) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [segment, setSegment] = useState<CampaignSegment>("all_customers")
  const [segmentValue, setSegmentValue] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [deepLinkPreset, setDeepLinkPreset] = useState("")
  const [deepLink, setDeepLink] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [expiresAt, setExpiresAt] = useState("")

  const { data: templates } = useTemplates()
  const { data: customerSegments } = useCustomerSegments()
  const { data: segmentData } = useSegmentCount(segment, segmentValue || undefined)
  const sendMutation = useSendBulk()
  const scheduleMutation = useScheduleCampaign()

  const isVendorAudience = VENDOR_SEGMENT_VALUES.includes(segment)
  const segmentOptions = isVendorAudience ? VENDOR_SEGMENTS : SEGMENTS
  const selectedSeg = segmentOptions.find(s => s.value === segment)

  function switchAudience(vendors: boolean) {
    setSegment(vendors ? "all_vendors" : "all_customers")
    setSegmentValue("")
    if (vendors) {
      // Deep links are customer-app routes; the vendor app just opens.
      setDeepLink(""); setDeepLinkPreset("")
    }
  }

  function applyTemplate(t: NotificationTemplate) {
    setTitle(t.title)
    setBody(t.body)
    if (t.image_url) setImageUrl(t.image_url)
    if (t.deep_link) setDeepLink(t.deep_link)
    setSelectedTemplateId(t.id)
  }

  function handleDeepLinkPreset(val: string) {
    setDeepLinkPreset(val)
    setDeepLink(val)
  }

  const effectiveDeepLink = deepLink || deepLinkPreset

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      title, body, segment,
      ...(segmentValue && { segmentValue }),
      ...(imageUrl && { image_url: imageUrl }),
      ...(!isVendorAudience && effectiveDeepLink && { deep_link: effectiveDeepLink }),
      ...(expiresAt && { expires_at: new Date(expiresAt).toISOString() }),
      ...(selectedTemplateId && { template_id: selectedTemplateId }),
    }

    if (mode === "send") {
      sendMutation.mutate(payload, {
        onSuccess: () => { onOpenChange(false); reset() },
      })
    } else {
      scheduleMutation.mutate(
        { ...payload, scheduledAt: new Date(scheduledAt).toISOString() },
        { onSuccess: () => { onOpenChange(false); reset() } }
      )
    }
  }

  const reset = () => {
    setTitle(""); setBody(""); setSegment("all_customers"); setSegmentValue("")
    setScheduledAt(""); setImageUrl(""); setDeepLinkPreset(""); setDeepLink("")
    setSelectedTemplateId(""); setExpiresAt("")
  }

  const pending = sendMutation.isPending || scheduleMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>
            {mode === "send" ? "Send Bulk Notification" : "Schedule Campaign"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 overflow-hidden flex-1 min-h-0 px-6 pb-6 pt-4">
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 min-h-0">

          {/* Template selector */}
          {templates && templates.length > 0 && (
            <div className="space-y-1.5">
              <Label>Use Template (optional)</Label>
              <Select value={selectedTemplateId} onValueChange={(v) => {
                const t = templates.find(x => x.id === v)
                if (t) applyTemplate(t)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template…" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.type === 'PUSH').map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="c-title">Title *</Label>
            <Input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-body">Message *</Label>
            <Textarea id="c-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type your message…" rows={3} required />
          </div>

          {/* Audience: which app receives this. */}
          <div className="space-y-1.5">
            <Label>Send to *</Label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { vendors: false, label: "Customers", hint: "FreshCuts customer app" },
                { vendors: true, label: "Vendors", hint: "FreshCuts Vendor app" },
              ] as const).map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => switchAudience(o.vendors)}
                  className={
                    "rounded-lg border px-3 py-2 text-left transition-colors " +
                    (isVendorAudience === o.vendors ? "border-ink bg-muted" : "hover:bg-muted/60")
                  }
                >
                  <p className="text-sm font-medium">{o.label}</p>
                  <p className="text-xs text-muted-foreground">{o.hint}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Each notification goes to one app only — customer messages never appear in the vendor app, and vendor messages never appear in the customer app.
            </p>
          </div>

          {/* Segment */}
          <div className="space-y-1.5">
            <Label>{isVendorAudience ? "Which vendors *" : "Target Segment *"}</Label>
            <Select value={segment} onValueChange={(v) => { setSegment(v as CampaignSegment); setSegmentValue("") }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {segmentOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value} disabled={s.comingSoon}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.label}</span>
                      <span className="text-xs text-muted-foreground">— {s.description}</span>
                      {s.comingSoon && <Badge variant="outline" className="text-[10px] ml-1">Soon</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {segmentData && !selectedSeg?.comingSoon && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Users className="h-3 w-3" />
                <span>{segmentData.count.toLocaleString()} users in segment</span>
              </div>
            )}
          </div>

          {/* Segment value: a picker for custom_segment, free text for specific_user/store_customers */}
          {segment === "custom_segment" ? (
            <div className="space-y-1.5">
              <Label>Choose Segment *</Label>
              <Select value={segmentValue} onValueChange={setSegmentValue}>
                <SelectTrigger><SelectValue placeholder="Select a segment…" /></SelectTrigger>
                <SelectContent>
                  {(customerSegments ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.member_count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customerSegments?.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No segments yet — create one under Customer Segments first.
                </p>
              )}
            </div>
          ) : selectedSeg?.needsValue ? (
            <div className="space-y-1.5">
              <Label>Segment Value *</Label>
              <Input
                value={segmentValue}
                onChange={(e) => setSegmentValue(e.target.value)}
                placeholder={selectedSeg.valuePlaceholder}
                required={selectedSeg.needsValue}
              />
            </div>
          ) : null}

          {/* Schedule */}
          {mode === "schedule" && (
            <div className="space-y-1.5">
              <Label htmlFor="c-scheduled">Schedule Date & Time (IST) *</Label>
              <Input
                id="c-scheduled"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required={mode === "schedule"}
              />
              <p className="text-xs text-muted-foreground">Sent in UTC. Backend fires within 60s of scheduled time.</p>
            </div>
          )}

          {/* Image URL */}
          <div className="space-y-1.5">
            <Label htmlFor="c-image">Image URL (https only)</Label>
            <Input
              id="c-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://res.cloudinary.com/…"
            />
            {imageUrl && !imageUrl.startsWith('https://') && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <AlertCircle className="h-3 w-3" /> Must be HTTPS. HTTP images will be skipped.
              </div>
            )}
          </div>

          {/* Deep Link — customer app only */}
          {!isVendorAudience && (
          <div className="space-y-1.5">
            <Label>Deep Link</Label>
            <Select value={deepLinkPreset} onValueChange={handleDeepLinkPreset}>
              <SelectTrigger><SelectValue placeholder="Select preset…" /></SelectTrigger>
              <SelectContent>
                {DEEP_LINK_PRESETS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={deepLink}
              onChange={(e) => { setDeepLink(e.target.value); setDeepLinkPreset("") }}
              placeholder="/custom/path or app://screen"
              className="mt-1.5"
            />
          </div>
          )}

          {/* Campaign Expiry */}
          <div className="space-y-1.5">
            <Label htmlFor="c-expires">Campaign Expiry (optional)</Label>
            <Input
              id="c-expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">If set, included in notification data for countdown display in app.</p>
          </div>

          {mode === "send" && segmentData && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950 p-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                This will immediately send to{" "}
                <Badge variant="secondary" className="text-xs">
                  {segmentData.count.toLocaleString()} users
                </Badge>
                . Cannot be undone.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Processing…" : mode === "send" ? "Send Now" : "Schedule"}
            </Button>
          </DialogFooter>
        </form>

        {/* Right-side simulation — always visible while filling the form,
            no scrolling needed to see what the customer will actually see. */}
        <div className="border-l pl-6 overflow-y-auto min-h-0">
          <NotificationPushPreview
            title={title}
            body={body}
            imageUrl={imageUrl}
            deepLink={isVendorAudience ? undefined : effectiveDeepLink}
            variant="sticky"
            appName={isVendorAudience ? "FreshCuts Vendor" : undefined}
          />
        </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
