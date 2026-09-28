import { Flame } from "lucide-react"

// Mirrors the dashboard's own DEEP_LINK_PRESETS (CampaignDialog.tsx) so the
// preview can show a human label ("Opens: Cart") instead of a raw path —
// kept as a plain lookup here rather than importing from CampaignDialog to
// avoid a circular/one-off dependency between the two dialogs that use this.
const KNOWN_DEEP_LINK_LABELS: Record<string, string> = {
  "/home": "Home",
  "/profile/notifications": "Notifications",
  "/cart": "Cart",
  "/profile/wallet": "Wallet",
  "/orders": "Orders",
  "/categories": "Categories",
  "/search": "Search",
  "/profile/wishlist": "Wishlist",
}

function deepLinkLabel(path: string): string {
  return KNOWN_DEEP_LINK_LABELS[path] ?? path
}

interface Props {
  title: string
  body: string
  imageUrl?: string
  deepLink?: string
  /** Right-side sticky layout (CampaignDialog) vs. compact inline (TemplateDialog). */
  variant?: "sticky" | "inline"
}

/**
 * A close simulation of the real Android notification the customer will
 * see — same icon/app-name/title/body/image layout as
 * `LocalNotificationService.show()` (mobile `local_notification_service.dart`)
 * actually renders: a big-picture image below the text when one is present,
 * and the notification channel's real name ("FreshCuts Notifications").
 * Only Android has a real Firebase config today (iOS is still unconfigured
 * dummy — see mobile CLAUDE.md §10), so this deliberately doesn't try to
 * also simulate an iOS banner.
 */
export function NotificationPushPreview({ title, body, imageUrl, deepLink, variant = "inline" }: Props) {
  const hasImage = !!imageUrl && imageUrl.startsWith("https://")
  const resolvedDeepLink = deepLink?.trim()

  const card = (
    <div className="rounded-2xl border bg-background shadow-sm overflow-hidden max-w-[320px]">
      {/* Android notification-shade header row */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
        <div className="h-5 w-5 rounded-md bg-brand-500 flex items-center justify-center text-white shrink-0">
          <Flame className="h-3 w-3 fill-current" />
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">FreshCuts</span>
        <span className="text-[10px] text-muted-foreground ml-auto">now</span>
      </div>
      <div className="px-3 pb-3 space-y-0.5">
        <p className="text-[13.5px] font-semibold leading-snug truncate text-ink">
          {title || <span className="text-muted-foreground font-normal">Notification title</span>}
        </p>
        <p className="text-[12.5px] text-muted-foreground leading-snug line-clamp-2">
          {body || <span className="italic">Message body will appear here…</span>}
        </p>
      </div>
      {hasImage && (
        <div className="w-full aspect-[2/1] bg-muted overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = "none"
            }}
          />
        </div>
      )}
    </div>
  )

  return (
    <div className={variant === "sticky" ? "space-y-2.5" : "rounded-xl border bg-muted/50 p-3 space-y-2"}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {variant === "sticky" ? "On the customer's phone" : "Push Preview"}
      </p>
      {card}
      {resolvedDeepLink && (() => {
        const label = deepLinkLabel(resolvedDeepLink)
        const isKnown = label !== resolvedDeepLink
        return (
          <p className="text-[11px] text-muted-foreground">
            Tapping it opens{" "}
            {isKnown ? (
              <span className="font-medium text-ink-2">{label}</span>
            ) : (
              <span className="font-mono text-ink-2">{resolvedDeepLink}</span>
            )}
          </p>
        )
      })()}
      {!resolvedDeepLink && variant === "sticky" && (
        <p className="text-[11px] text-muted-foreground">
          No deep link set — tapping it just opens the app.
        </p>
      )}
    </div>
  )
}
