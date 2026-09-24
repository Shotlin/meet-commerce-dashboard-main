import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowUpDown,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Save,
  ShieldAlert,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  activateRazorpayMode,
  getRazorpaySettings,
  saveRazorpayCredentials,
  testRazorpayCredentials,
} from "@/services/razorpaySettingsService"
import type {
  RazorpayMode,
  RazorpaySettings,
  RazorpayTestResult,
} from "@/types/razorpaySettings.types"

const QUERY_KEY = ["admin", "razorpay-settings"] as const

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return "Something went wrong"
}

function formatTimestamp(value: string | null): string {
  if (!value) return "Never"
  const diffMs = Date.now() - new Date(value).getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ago`
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}

interface CredentialDraft {
  keyId: string
  keySecret: string
  webhookSecret: string
}

const emptyDraft: CredentialDraft = { keyId: "", keySecret: "", webhookSecret: "" }

/**
 * Razorpay TEST/PRODUCTION payment gateway credentials — dashboard-managed
 * as of migration 132, replacing manual `.env` edits on the server.
 * Secrets are encrypted at rest server-side (src/utils/encryption.js) and
 * never returned in full by any GET — only a masked Key ID and whether a
 * webhook secret is set. Testing credentials never activates an
 * environment; activating PRODUCTION requires an explicit confirmation,
 * since it switches real customer payments to real money.
 */
export default function RazorpaySettingsPage() {
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getRazorpaySettings,
    staleTime: 30_000,
  })

  // ── Environment switch (pending selection until Save/Activate) ────────
  const [pendingMode, setPendingMode] = useState<RazorpayMode>("TEST")
  const [confirmProductionOpen, setConfirmProductionOpen] = useState(false)

  useEffect(() => {
    if (settings) setPendingMode(settings.activeMode)
  }, [settings])

  const activateMutation = useMutation({
    mutationFn: (payload: { mode: RazorpayMode; confirm?: boolean }) => activateRazorpayMode(payload),
    onSuccess: (result) => {
      queryClient.setQueryData(QUERY_KEY, result)
      toast.success(`${result.activeMode} is now the active Razorpay environment`)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const handleActivate = () => {
    if (!settings || pendingMode === settings.activeMode) return
    if (pendingMode === "PRODUCTION") {
      setConfirmProductionOpen(true)
      return
    }
    activateMutation.mutate({ mode: pendingMode })
  }

  const confirmActivateProduction = () => {
    setConfirmProductionOpen(false)
    activateMutation.mutate({ mode: "PRODUCTION", confirm: true })
  }

  // ── Credential editing (one environment at a time) ─────────────────────
  const [editingMode, setEditingMode] = useState<RazorpayMode>("TEST")
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<CredentialDraft>(emptyDraft)
  const [showSecret, setShowSecret] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  const [testResult, setTestResult] = useState<RazorpayTestResult | null>(null)

  const startEditing = (mode: RazorpayMode) => {
    setEditingMode(mode)
    setIsEditing(true)
    setDraft(emptyDraft)
    setTestResult(null)
    setShowSecret(false)
    setShowWebhookSecret(false)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setDraft(emptyDraft)
    setTestResult(null)
  }

  const testMutation = useMutation({
    mutationFn: () => {
      const hasDraft = draft.keyId.trim() || draft.keySecret.trim()
      return testRazorpayCredentials({
        mode: editingMode,
        keyId: hasDraft ? draft.keyId.trim() : undefined,
        keySecret: hasDraft ? draft.keySecret.trim() : undefined,
      })
    },
    onSuccess: (result) => {
      setTestResult(result)
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      if (result.success) toast.success(`Connected${result.statusCode ? ` — HTTP ${result.statusCode}` : ""}`)
      else toast.error(result.message)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      saveRazorpayCredentials(editingMode, {
        keyId: draft.keyId.trim() ? draft.keyId.trim() : undefined,
        keySecret: draft.keySecret.trim() ? draft.keySecret.trim() : undefined,
        webhookSecret: draft.webhookSecret.trim() ? draft.webhookSecret.trim() : undefined,
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(QUERY_KEY, result)
      toast.success(`${editingMode} credentials saved`)
      setIsEditing(false)
      setDraft(emptyDraft)
      setTestResult(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const editingEnv = settings?.environments[editingMode]
  const hasAnyDraftValue = Boolean(draft.keyId.trim() || draft.keySecret.trim() || draft.webhookSecret.trim())

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Razorpay Payments" subtitle="TEST / LIVE payment gateway credentials" />
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Razorpay Payments"
        subtitle="TEST / LIVE payment gateway credentials — managed here, no server redeploy needed"
      >
        <Badge variant={settings?.activeMode === "PRODUCTION" ? "destructive" : "secondary"}>
          {settings?.activeMode === "PRODUCTION" ? "LIVE ACTIVE" : "TEST ACTIVE"}
        </Badge>
      </PageHeader>

      {/* Environment switch */}
      <Card className="max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Active Environment
          </CardTitle>
          <CardDescription>
            Pick which credential set new payment operations use. Nothing changes until you
            press Save / Activate below.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="flex flex-col items-stretch">
            {(["top", "bottom"] as const).map((slot) => {
              const mode: RazorpayMode =
                slot === "top"
                  ? pendingMode
                  : pendingMode === "TEST"
                    ? "PRODUCTION"
                    : "TEST"
              const env = settings?.environments[mode]
              const isCurrentlyActive = settings?.activeMode === mode
              return (
                <div
                  key={slot}
                  className={`rounded-lg border p-4 text-center ${
                    slot === "top"
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-muted/30 opacity-70"
                  }`}
                >
                  <p className="text-sm font-bold tracking-wide">{mode}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {env?.configured
                      ? isCurrentlyActive
                        ? "Key configured • Active"
                        : "Key configured • Not active"
                      : "Not configured"}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={() => setPendingMode((m) => (m === "TEST" ? "PRODUCTION" : "TEST"))}
              className="h-9 w-9 rounded-full border bg-background shadow flex items-center justify-center hover:bg-accent transition-colors"
              aria-label="Swap active environment selection"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-3">
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={handleActivate}
              disabled={
                !settings ||
                pendingMode === settings.activeMode ||
                activateMutation.isPending ||
                !settings.environments[pendingMode].configured
              }
            >
              {activateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : null}
              {settings && pendingMode !== settings.activeMode
                ? `Activate ${pendingMode}`
                : "Save / Activate"}
            </Button>
          </div>
          {settings && pendingMode !== settings.activeMode && !settings.environments[pendingMode].configured && (
            <p className="text-xs text-destructive mt-2 text-center">
              Save {pendingMode} credentials below before activating it.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Credential editing */}
      <Card className="max-w-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Credentials</CardTitle>
              <CardDescription>
                Never sent to the mobile app or storefront — key secret / webhook secret stay
                server-side, encrypted at rest.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            {(["TEST", "PRODUCTION"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  if (isEditing) cancelEditing()
                  setEditingMode(mode)
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                  editingMode === mode
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-accent"
                }`}
              >
                {mode}
                {settings?.activeMode === mode && (
                  <span className="ml-1.5 opacity-80">• Active</span>
                )}
              </button>
            ))}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span>Key ID:</span>
            <span className="font-mono">{editingEnv?.maskedKeyId ?? "Not set"}</span>
            <span className="mx-1">·</span>
            <span>Webhook secret:</span>
            <span>{editingEnv?.hasWebhookSecret ? "Configured" : "Not set"}</span>
            {editingEnv?.lastTestStatus && (
              <Badge
                variant={editingEnv.lastTestStatus === "SUCCESS" ? "default" : "destructive"}
                className="text-[10px]"
              >
                {editingEnv.lastTestStatus === "SUCCESS" ? "Last test passed" : "Last test failed"}
              </Badge>
            )}
          </div>
          {editingEnv?.lastTestedAt && (
            <p className="text-xs text-muted-foreground -mt-3">
              Last tested {formatTimestamp(editingEnv.lastTestedAt)}
              {editingEnv.lastTestMessage ? ` — ${editingEnv.lastTestMessage}` : ""}
            </p>
          )}

          <Separator />

          {!isEditing ? (
            <Button type="button" variant="outline" size="sm" onClick={() => startEditing(editingMode)}>
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit Credentials
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Key ID</Label>
                <Input
                  autoComplete="off"
                  placeholder={editingEnv?.configured ? "Enter a new Key ID to replace it" : `Paste your ${editingMode} Key ID`}
                  value={draft.keyId}
                  onChange={(e) => {
                    setDraft((d) => ({ ...d, keyId: e.target.value }))
                    setTestResult(null)
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Key Secret</Label>
                <div className="relative">
                  <Input
                    type={showSecret ? "text" : "password"}
                    autoComplete="off"
                    placeholder={editingEnv?.configured ? "Enter a new Key Secret to replace it" : "Paste your Key Secret"}
                    value={draft.keySecret}
                    onChange={(e) => {
                      setDraft((d) => ({ ...d, keySecret: e.target.value }))
                      setTestResult(null)
                    }}
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showSecret ? "Hide key secret" : "Show key secret"}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Webhook Secret (optional)</Label>
                <div className="relative">
                  <Input
                    type={showWebhookSecret ? "text" : "password"}
                    autoComplete="off"
                    placeholder={editingEnv?.hasWebhookSecret ? "Enter a new webhook secret to replace it" : "Paste your webhook secret"}
                    value={draft.webhookSecret}
                    onChange={(e) => setDraft((d) => ({ ...d, webhookSecret: e.target.value }))}
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showWebhookSecret ? "Hide webhook secret" : "Show webhook secret"}
                  >
                    {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave blank to keep the current one (or if not using webhooks yet).
                </p>
              </div>

              {testResult && (
                <div
                  className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
                    testResult.success
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  )}
                  <span>
                    {testResult.message}
                    {testResult.statusCode ? ` (HTTP ${testResult.statusCode})` : ""}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => testMutation.mutate()}
                  disabled={
                    testMutation.isPending ||
                    (!hasAnyDraftValue && !editingEnv?.configured)
                  }
                >
                  {testMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  Test Connection
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !hasAnyDraftValue}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1.5" />
                  )}
                  Save Credentials
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Saving here never activates {editingMode} — use the switch above to make it live.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmProductionOpen} onOpenChange={setConfirmProductionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Enable LIVE payments?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are enabling LIVE payments. New customer payments will use real money.
              Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmActivateProduction} className="bg-destructive hover:bg-destructive/90">
              Enable LIVE payments
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
