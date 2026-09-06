import { useRef, useState } from "react"
import { Loader2, ImagePlus, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { uploadMultipleImages } from "@/services/uploads.service"

interface ProductImageGalleryUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

/**
 * Multi-image gallery uploader for the product form. Every upload lands in
 * the backend's shared `<CLOUDINARY_FOLDER>/products` folder and comes back
 * already Cloudinary-optimized (f_auto/q_auto/dpr_auto — see
 * uploads.service.js#uploadImage). Removing an image here only edits the
 * local array; the actual Cloudinary asset is deleted server-side on Save,
 * once the product row's new `images[]` is confirmed persisted (see
 * products.service.js#_deleteOrphanedImages) — the same "delete only after
 * the swap lands" contract as the theme-tab icon uploader.
 */
export function ProductImageGalleryUploader({
  images,
  onChange,
  maxImages = 8,
}: ProductImageGalleryUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const remainingSlots = maxImages - images.length

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"))
    if (files.length === 0) return

    if (remainingSlots <= 0) {
      toast.error(`You can only add up to ${maxImages} images`)
      return
    }
    const accepted = files.slice(0, remainingSlots)
    if (accepted.length < files.length) {
      toast.warning(`Only ${remainingSlots} more image(s) can be added (max ${maxImages})`)
    }

    setIsUploading(true)
    setProgress(0)
    try {
      const uploaded = await uploadMultipleImages(accepted, setProgress)
      onChange([...images, ...uploaded.map((u) => u.url)])
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload images")
    } finally {
      setIsUploading(false)
    }
  }

  const removeAt = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const setAsCover = (index: number) => {
    if (index === 0) return
    const next = [...images]
    const [picked] = next.splice(index, 1)
    next.unshift(picked)
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Product Images</Label>
        <span className="text-xs text-muted-foreground">
          {images.length} / {maxImages}
        </span>
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-4">
        <button
          type="button"
          disabled={isUploading || remainingSlots <= 0}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setIsDragging(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files)
          }}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className="w-full max-w-sm space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground">Uploading... {progress}%</p>
              </div>
            </>
          ) : (
            <>
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">
                {remainingSlots <= 0 ? "Maximum images reached" : "Drop images here or click to upload"}
              </p>
              <p className="text-xs text-muted-foreground">Up to {maxImages} images · JPG, PNG, WEBP</p>
            </>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files)
            e.currentTarget.value = ""
          }}
        />

        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {images.map((url, index) => (
              <div key={url + index} className="group relative aspect-square overflow-hidden rounded-md border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                {index === 0 && (
                  <Badge className="absolute left-1 top-1 gap-1 px-1.5 py-0 text-[10px]">
                    <Star className="h-2.5 w-2.5" /> Cover
                  </Badge>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {index !== 0 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      title="Set as cover image"
                      onClick={() => setAsCover(index)}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7"
                    title="Remove image"
                    onClick={() => removeAt(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
