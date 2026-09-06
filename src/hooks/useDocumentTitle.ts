/**
 * `useDocumentTitle` — set the browser tab `<title>` for the current route.
 * Ported from bakaloo-dashboard's src/hooks/useDocumentTitle.ts, same
 * mechanism (client-side title effect since every page here is a client
 * component) — app name suffix matches this project's own real branding
 * (`index.html`'s `<title>`), not bakaloo's.
 */

import { useEffect } from "react"

const APP_NAME = "Meet Commerce Admin"

export function useDocumentTitle(title: string | null | undefined): void {
  useEffect(() => {
    if (typeof document === "undefined") return
    if (!title) return

    const previous = document.title
    document.title = `${title} · ${APP_NAME}`

    return () => {
      document.title = previous
    }
  }, [title])
}
