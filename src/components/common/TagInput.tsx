import { useId, useState, type KeyboardEvent } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TagInputProps {
  /** Current list of options, in the order they were added. */
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  /** Optional autocomplete hints shown while typing — doesn't restrict what can be added. */
  suggestions?: string[]
  /** No cap by default — an admin selling many SKUs needs more than 3 fixed choices. */
  maxTags?: number
  disabled?: boolean
  className?: string
}

/**
 * Type a value, press Enter (or comma) to add it as a removable chip, repeat.
 * Backspace on an empty draft removes the last chip. Deliberately calls
 * `e.preventDefault()` on Enter so it never submits the surrounding <form>
 * — every product-form text input lives inside one shared <form>, and a
 * bare Enter there triggers the dialog's own submit/save button instead of
 * adding a chip.
 */
export function TagInput({
  value,
  onChange,
  placeholder,
  suggestions,
  maxTags,
  disabled,
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState("")
  const listId = useId()

  const commit = () => {
    const next = draft.trim()
    setDraft("")
    if (!next) return
    if (value.some((t) => t.toLowerCase() === next.toLowerCase())) return
    if (maxTags && value.length >= maxTags) return
    onChange([...value, next])
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      commit()
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag))

  return (
    <div
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => remove(tag)}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      <input
        type="text"
        list={suggestions ? listId : undefined}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={value.length === 0 ? placeholder : "Type and press Enter to add another…"}
        className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
      {suggestions && (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </div>
  )
}
