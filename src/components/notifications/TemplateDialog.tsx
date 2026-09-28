import { useState, useEffect } from "react"
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
import {
  useCreateTemplate,
  useUpdateTemplate,
} from "@/hooks/useNotifications"
import { NotificationPushPreview } from "@/components/notifications/NotificationPushPreview"
import type { NotificationTemplate, CreateTemplatePayload } from "@/types/notification.types"

const TEMPLATE_TYPES = ["PUSH", "SMS", "EMAIL", "IN_APP"] as const

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: NotificationTemplate | null
}

export function TemplateDialog({ open, onOpenChange, template }: Props) {
  const [form, setForm] = useState<CreateTemplatePayload>({
    name: "",
    title: "",
    body: "",
    type: "PUSH",
    variables: [],
  })
  const [variablesInput, setVariablesInput] = useState("")

  const createMutation = useCreateTemplate()
  const updateMutation = useUpdateTemplate()
  const isEdit = !!template

  useEffect(() => {
    if (template) {
      let vars: string[] = []
      try {
        vars = JSON.parse(template.variables || "[]")
      } catch {
        /* empty */
      }
      setForm({
        name: template.name,
        title: template.title,
        body: template.body,
        type: template.type,
        variables: vars,
        image_url: template.image_url ?? "",
        deep_link: template.deep_link ?? "",
      })
      setVariablesInput(vars.join(", "))
    } else {
      setForm({ name: "", title: "", body: "", type: "PUSH", variables: [], image_url: "", deep_link: "" })
      setVariablesInput("")
    }
  }, [template, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const vars = variablesInput
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
    const payload = { ...form, variables: vars.length ? vars : undefined }

    if (isEdit && template) {
      updateMutation.mutate(
        { id: template.id, payload },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => onOpenChange(false),
      })
    }
  }

  const pending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Template" : "Create Template"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="t-name">Name *</Label>
              <Input
                id="t-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Order Confirmed"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-type">Type *</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm({ ...form, type: v as CreateTemplatePayload["type"] })
                }
              >
                <SelectTrigger id="t-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title *</Label>
            <Input
              id="t-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Notification title"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-body">Body *</Label>
            <Textarea
              id="t-body"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Notification body text. Use {{variable}} for dynamic content."
              rows={3}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-vars">Variables (comma-separated)</Label>
            <Input
              id="t-vars"
              value={variablesInput}
              onChange={(e) => setVariablesInput(e.target.value)}
              placeholder="{{name}}, {{order_id}}"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="t-image">Image URL</Label>
              <Input
                id="t-image"
                value={form.image_url ?? ""}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-deeplink">Deep Link</Label>
              <Input
                id="t-deeplink"
                value={form.deep_link ?? ""}
                onChange={(e) => setForm({ ...form, deep_link: e.target.value })}
                placeholder="/home  /orders  /cart  /profile/notifications  /profile/wallet"
              />
              <p className="text-[11px] text-muted-foreground">
                Use app paths: <span className="font-mono">/home</span>, <span className="font-mono">/orders</span>, <span className="font-mono">/cart</span>, <span className="font-mono">/profile/notifications</span>, <span className="font-mono">/profile/wallet</span>, <span className="font-mono">/product/:id</span>
              </p>
            </div>
          </div>

          {/* Push Preview */}
          {form.type === "PUSH" && form.title && (
            <NotificationPushPreview
              title={form.title}
              body={form.body}
              imageUrl={form.image_url}
              deepLink={form.deep_link}
            />
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
