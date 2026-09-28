import { useEffect, useMemo, useState } from "react"
import { Bell, FlaskConical, Info, LayoutTemplate, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { NotificationPushPreview } from "@/components/notifications/NotificationPushPreview"
import {
  useOrderNotificationSettings,
  useSendOrderNotificationTest,
  useUpdateOrderNotificationSetting,
} from "@/hooks/useOrderNotificationSettings"
import type {
  OrderNotificationEventKey,
  OrderNotificationSetting,
} from "@/types/orderNotificationSettings.types"

const EVENT_NAMES: Record<OrderNotificationEventKey, string> = {
  ORDER_PLACED: "Order placed",
  CONFIRMED: "Store confirmed",
  PREPARING: "Preparing",
  PACKED: "Packed",
  RIDER_ACCEPTED: "Delivery partner assigned",
  PICKED_UP: "Out for delivery",
  OTP_RESENT: "Delivery OTP requested again",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
}

// The mobile home banner is only drawn while an order is still active, and
// only for these four events (order_tracking_top_banner.dart#_notificationEventKeyFor).
// Its text is fixed in the app — only on/off is controllable from here.
const BANNER_TEXT: Partial<Record<OrderNotificationEventKey, string>> = {
  CONFIRMED: "Your order is confirmed",
  PREPARING: "Your order is being packed",
  PACKED: "Your order is packed and ready",
  PICKED_UP: "Your order is on the way 🚚",
}

const SAMPLE = { orderId: "FC-KOL-20260928-0001", otp: "4821" }

function fillSample(text: string) {
  return text
    .replace(/\{\{\s*orderId\s*\}\}/g, SAMPLE.orderId)
    .replace(/\{\{\s*otp\s*\}\}/g, SAMPLE.otp)
}

function StatusPill({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium " +
        (on ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground")
      }
    >
      <span className={"h-1.5 w-1.5 rounded-full " + (on ? "bg-green-600" : "bg-muted-foreground/50")} />
      {label}
    </span>
  )
}

function BannerPreview({ text }: { text: string }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        Top of the customer's home screen
      </p>
      <div className="max-w-[320px] rounded-2xl border bg-muted/40 p-3 space-y-2">
        <div className="h-2.5 w-24 rounded bg-muted-foreground/20" />
        <div className="h-7 rounded-lg bg-background border" />
        <div className="rounded-xl border bg-background px-3 py-2 shadow-sm">
          <p className="text-[13px] font-semibold text-ink text-center">{text}</p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Shows for a few seconds when the order reaches this stage, then hides itself.
      </p>
    </div>
  )
}

export function OrderLifecyclePanel() {
  const { data, isLoading, isError, refetch } = useOrderNotificationSettings()
  const updateMutation = useUpdateOrderNotificationSetting()
  const testMutation = useSendOrderNotificationTest()

  const [selectedKey, setSelectedKey] = useState<OrderNotificationEventKey | null>(null)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  const settings = data ?? []
  const selected: OrderNotificationSetting | undefined = useMemo(
    () => settings.find((s) => s.eventKey === selectedKey) ?? settings[0],
    [settings, selectedKey],
  )

  useEffect(() => {
    if (!selected) return
    setTitle(selected.title)
    setMessage(selected.message)
    setImageUrl(selected.imageUrl ?? "")
    // Reset the draft whenever a different event is opened or the saved copy changes.
  }, [selected?.eventKey, selected?.updatedAt, selected?.title, selected?.message, selected?.imageUrl])

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-[520px] rounded-xl" />
        <Skeleton className="h-[520px] rounded-xl" />
      </div>
    )
  }

  if (isError || !selected) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Couldn't load the order lifecycle settings.</p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  const bannerText = BANNER_TEXT[selected.eventKey]
  const supportsBanner = bannerText !== undefined
  const supportsOtp = selected.eventKey === "OTP_RESENT"
  const dirty =
    title !== selected.title ||
    message !== selected.message ||
    (imageUrl.trim() || "") !== (selected.imageUrl ?? "")
  const imageInvalid = imageUrl.trim() !== "" && !imageUrl.trim().startsWith("https://")
  const saving = updateMutation.isPending

  const toggle = (patch: { notificationEnabled?: boolean; bannerEnabled?: boolean }) =>
    updateMutation.mutate({ eventKey: selected.eventKey, payload: patch })

  const save = () =>
    updateMutation.mutate({
      eventKey: selected.eventKey,
      payload: { title: title.trim(), message: message.trim(), imageUrl: imageUrl.trim() },
    })

  const insertPlaceholder = (token: string) => setMessage((m) => `${m}${m && !m.endsWith(" ") ? " " : ""}${token}`)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground max-w-3xl">
        These run automatically as an order moves through its journey — separate from marketing
        campaigns. Every stage has two independent switches: the <b>push notification</b> and the
        <b> banner at the top of the app's home screen</b>. Wording changes apply to new orders
        immediately, no app update needed.
      </p>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr] items-start">
        {/* Left: every lifecycle stage */}
        <div className="rounded-xl border bg-card p-2 space-y-1 lg:max-h-[calc(100vh-14rem)] overflow-y-auto">
          <p className="px-2 pt-1.5 pb-1 text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold">
            Order lifecycle
          </p>
          {settings.map((s) => {
            const active = s.eventKey === selected.eventKey
            const hasBanner = BANNER_TEXT[s.eventKey] !== undefined
            return (
              <button
                key={s.eventKey}
                type="button"
                onClick={() => setSelectedKey(s.eventKey)}
                className={
                  "w-full text-left rounded-lg px-3 py-2.5 transition-colors border " +
                  (active ? "bg-muted border-border" : "border-transparent hover:bg-muted/60")
                }
              >
                <p className="text-sm font-medium text-ink">{EVENT_NAMES[s.eventKey] ?? s.eventKey}</p>
                <p className="text-[11.5px] text-muted-foreground truncate">{s.label}</p>
                <div className="mt-1.5 flex gap-1.5">
                  <StatusPill on={s.notificationEnabled} label="Push" />
                  {hasBanner && <StatusPill on={s.bannerEnabled} label="Banner" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Right: the selected stage */}
        <div className="rounded-xl border bg-card p-5 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-ink">{EVENT_NAMES[selected.eventKey]}</h3>
            <p className="text-sm text-muted-foreground">Sent when: {selected.label}</p>
          </div>

          {/* The two independent lifecycles */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
              <div className="flex gap-2.5">
                <Bell className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-ink">Push notification</p>
                  <p className="text-xs text-muted-foreground">
                    {selected.notificationEnabled ? "Customer gets a push at this stage" : "No push at this stage"}
                  </p>
                </div>
              </div>
              <Switch
                checked={selected.notificationEnabled}
                disabled={saving}
                onCheckedChange={(v) => toggle({ notificationEnabled: v })}
                aria-label="Push notification"
              />
            </div>

            <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
              <div className="flex gap-2.5">
                <LayoutTemplate className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-ink">Home top banner</p>
                  <p className="text-xs text-muted-foreground">
                    {!supportsBanner
                      ? "Not shown at this stage"
                      : selected.bannerEnabled
                        ? "Banner appears on the home screen"
                        : "No banner at this stage"}
                  </p>
                </div>
              </div>
              <Switch
                checked={supportsBanner && selected.bannerEnabled}
                disabled={saving || !supportsBanner}
                onCheckedChange={(v) => toggle({ bannerEnabled: v })}
                aria-label="Home top banner"
              />
            </div>
          </div>
          {!supportsBanner && (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground -mt-3">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              The home banner only shows while an order is in progress (confirmed, preparing, packed,
              out for delivery), so this stage has no banner to switch.
            </p>
          )}

          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            {/* Editable push wording */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="olc-title">Notification title</Label>
                <Input id="olc-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="olc-message">Message</Label>
                <Textarea
                  id="olc-message"
                  rows={3}
                  value={message}
                  maxLength={2000}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-muted-foreground mr-1">Insert:</span>
                  <Button type="button" size="sm" variant="outline" className="h-6 px-2 text-xs font-mono" onClick={() => insertPlaceholder("{{orderId}}")}>
                    {"{{orderId}}"}
                  </Button>
                  {supportsOtp && (
                    <Button type="button" size="sm" variant="outline" className="h-6 px-2 text-xs font-mono" onClick={() => insertPlaceholder("{{otp}}")}>
                      {"{{otp}}"}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Filled with the real order number when sent.
                  {selected.eventKey === "PICKED_UP" &&
                    " The delivery OTP is added to this message automatically."}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="olc-image">
                  Image <span className="text-muted-foreground font-normal">(optional, https link)</span>
                </Label>
                <Input
                  id="olc-image"
                  placeholder="https://…"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                {imageInvalid && (
                  <p className="text-xs text-red-600">Must start with https:// or it won't be shown.</p>
                )}
              </div>
            </div>

            {/* Live previews */}
            <div className="space-y-5">
              <NotificationPushPreview
                variant="sticky"
                title={fillSample(title)}
                body={fillSample(message)}
                imageUrl={imageUrl.trim() || undefined}
                deepLink="/orders"
              />
              {supportsBanner && selected.bannerEnabled && bannerText && <BannerPreview text={bannerText} />}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <Button
              size="sm"
              variant="outline"
              disabled={testMutation.isPending}
              onClick={() =>
                testMutation.mutate({
                  eventKey: selected.eventKey,
                  draft: { title: title.trim(), message: message.trim() },
                })
              }
            >
              {testMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <FlaskConical className="h-4 w-4 mr-1.5" />
              )}
              Send test to me
            </Button>
            <Button
              size="sm"
              disabled={!dirty || saving || imageInvalid || !title.trim() || !message.trim()}
              onClick={save}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
