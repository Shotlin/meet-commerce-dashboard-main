import { apiClient } from './apiClient'

export type ImportMode = 'ADD_ONLY' | 'UPDATE_EXISTING'
export interface ImportOptions { shopId: string; file: File; mode: ImportMode; defaultCategory?: string }
export interface ImportRow { row: number; product_name: string; sku?: string | null; category_name: string | null; price: number | null; stock_quantity: number | null; unit: string; action: string; warnings: string[]; errors: string[] }
export interface ImportPreview { shop_id: string; rows: ImportRow[]; summary: { total_rows: number; valid_rows: number; error_rows: number; create_master: number; add_to_shop: number; update_shop: number; skip_existing: number } }
export interface ImportResult { summary: { total_rows: number; created_master: number; added_to_shop: number; updated_shop: number; skipped: number; failed: number }; errors: { row: number; product_name: string; sku: string | null; message: string }[] }

async function upload<T>(action: 'preview' | 'commit', options: ImportOptions): Promise<T> {
  const formData = new FormData()
  formData.append('file', options.file)
  const result = await apiClient.request<T>('POST', `/api/v1/products/bulk-import/${action}`, {
    formData, headers: { 'X-Shop-Id': options.shopId },
    params: { mode: options.mode, default_category: options.defaultCategory },
  })
  if (!result.success || !result.data) throw new Error(result.message || 'Import request failed')
  return result.data
}
export const previewBulkImport = (options: ImportOptions) => upload<ImportPreview>('preview', options)
export const commitBulkImport = (options: ImportOptions) => upload<ImportResult>('commit', options)

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url; anchor.download = name; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export async function downloadBulkTemplate() {
  saveBlob(await apiClient.getBlob('/api/v1/products/bulk-import/template', { format: 'xlsx' }), 'product-import-template.xlsx')
}
export function downloadImportErrors(errors: ImportResult['errors']) {
  const cell = (value: string | number | null) => {
    let text = String(value ?? '')
    if (/^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`
    return `"${text.replace(/"/g, '""')}"`
  }
  const lines = [['Row', 'Product', 'SKU', 'Error'].map(cell).join(','), ...errors.map((e) => [e.row, e.product_name, e.sku, e.message].map(cell).join(','))]
  saveBlob(new Blob(['\ufeff', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), 'product-import-errors.csv')
}
