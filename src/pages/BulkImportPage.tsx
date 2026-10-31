import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, FileSpreadsheet, Upload } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { useShopScope } from '@/context/ShopScopeContext'
import { useAdminCategories } from '@/hooks/useCategoriesAdmin'
import { formatINR } from '@/lib/utils'
import { commitBulkImport, downloadBulkTemplate, downloadImportErrors, previewBulkImport } from '@/services/bulkImportService'
import type { ImportMode, ImportPreview, ImportResult } from '@/services/bulkImportService'

const actions: Record<string, string> = { CREATE_MASTER_AND_ADD: 'Create and add', ADD_TO_SHOP: 'Add to store', UPDATE_SHOP: 'Update', SKIP_EXISTING: 'Skip existing', ERROR: 'Needs correction' }
const control = 'w-full rounded-md border bg-background px-3 py-2 text-sm'

export default function BulkImportPage() {
  const { shops, activeShopId, isLoading } = useShopScope()
  const { data: categories } = useAdminCategories()
  const [params] = useSearchParams()
  const [shopId, setShopId] = useState(params.get('shop') || activeShopId || '')
  const [mode, setMode] = useState<ImportMode>('ADD_ONLY')
  const [category, setCategory] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const reset = () => { setPreview(null); setResult(null); setError('') }
  const options = () => ({ shopId, file: file!, mode, defaultCategory: category || undefined })
  const showError = (err: unknown) => setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
  const previewFile = async () => {
    if (!file || !shopId) return
    setBusy(true); setError(''); setResult(null)
    try { setPreview(await previewBulkImport(options())) } catch (err) { setPreview(null); showError(err) } finally { setBusy(false) }
  }
  const commit = async () => {
    if (!file || !preview) return
    setBusy(true); setError('')
    try { setResult(await commitBulkImport(options())); setPreview(null) }
    catch (err) { setPreview(null); setError(`${err instanceof Error ? err.message : 'Import failed'}. Check the store products before retrying; the server may have completed the import.`) }
    finally { setBusy(false) }
  }
  return <div className="space-y-6 max-w-7xl">
    <PageHeader title="Bulk product import" subtitle="Add products and store prices from a spreadsheet. Missing master products are created in the library automatically.">
      <Link to="/catalogue"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Products</Button></Link>
      <Button variant="outline" onClick={() => downloadBulkTemplate().catch(showError)}><Download className="h-4 w-4 mr-2" />Download template</Button>
    </PageHeader>
    <div className="rounded-lg border bg-card p-5 space-y-5">
      <div className="flex items-start gap-3"><FileSpreadsheet className="h-5 w-5 mt-0.5 text-muted-foreground" /><div><h2 className="font-semibold">Prepare your import</h2><p className="text-sm text-muted-foreground">Select a store and upload a CSV or Excel file. You can review every row before importing. Missing master products are created and attached to the selected store.</p></div></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1.5 text-sm font-medium">Store<select aria-label="Store" className={control} value={shopId} disabled={busy || isLoading} onChange={(e) => { setShopId(e.target.value); reset() }}><option value="">Select a store</option>{shops.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="space-y-1.5 text-sm font-medium">Existing products<select aria-label="Existing products" className={control} value={mode} disabled={busy} onChange={(e) => { setMode(e.target.value as ImportMode); reset() }}><option value="ADD_ONLY">Skip existing products</option><option value="UPDATE_EXISTING">Update price and stock</option></select></label>
        <label className="space-y-1.5 text-sm font-medium">Default category<select aria-label="Default category" className={control} value={category} disabled={busy} onChange={(e) => { setCategory(e.target.value); reset() }}><option value="">Use category in file</option>{(categories ?? []).filter(c => c.is_active !== false).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="space-y-1.5 text-sm font-medium">Product file<input aria-label="Product file" className={control} type="file" accept=".csv,.xlsx" disabled={busy} onChange={(e) => { setFile(e.target.files?.[0] ?? null); reset() }} /></label>
      </div>
      <div className="flex flex-wrap items-center gap-3"><Button disabled={!shopId || !file || busy} onClick={previewFile}><Upload className="h-4 w-4 mr-2" />{busy ? 'Working…' : 'Preview import'}</Button><span className="text-xs text-muted-foreground">CSV or XLSX · up to 2,000 rows and 10 MB</span></div>
    </div>
    {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
    {preview && <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Review {preview.summary.total_rows} rows</h2><p className="text-sm text-muted-foreground">{preview.summary.valid_rows} valid · {preview.summary.error_rows} need correction · {preview.summary.skip_existing} will be skipped</p><p className="text-xs text-muted-foreground">{preview.summary.create_master} new master · {preview.summary.add_to_shop} add to store · {preview.summary.update_shop} update store</p></div><Button disabled={busy || preview.summary.valid_rows === 0} onClick={commit}>{busy ? 'Importing…' : 'Import valid rows'}</Button></div>
      <p className="text-sm text-muted-foreground">Invalid rows are skipped. Check warnings and store prices before continuing.</p>
      <div className="overflow-x-auto rounded-lg border"><table className="w-full text-left text-sm"><thead className="bg-muted/50"><tr>{['Row', 'Product', 'Category', 'Price', 'Stock', 'Action', 'Details'].map(x => <th key={x} className="px-3 py-3 font-medium">{x}</th>)}</tr></thead><tbody>{preview.rows.map(row => <tr key={row.row} className="border-t align-top"><td className="px-3 py-3">{row.row}</td><td className="px-3 py-3 font-medium">{row.product_name}<div className="text-xs font-normal text-muted-foreground">{row.sku}</div></td><td className="px-3 py-3">{row.category_name || '—'}</td><td className="px-3 py-3">{row.price != null ? formatINR(row.price) : '—'}</td><td className="px-3 py-3">{row.stock_quantity ?? '—'} {row.unit}</td><td className="px-3 py-3">{actions[row.action] || row.action}</td><td className="px-3 py-3 min-w-48">{row.errors.map((x, i) => <p className="text-red-700" key={i}>{x}</p>)}{row.warnings.map((x, i) => <p className="text-amber-700" key={i}>{x}</p>)}</td></tr>)}</tbody></table></div>
    </section>}
    {result && <section className="rounded-lg border bg-card p-5 space-y-3"><h2 className="text-lg font-semibold">Import complete</h2><p className="text-sm">{result.summary.created_master} new master · {result.summary.added_to_shop} added · {result.summary.updated_shop} updated · {result.summary.skipped} skipped · {result.summary.failed} failed</p>{result.errors.length > 0 && <Button variant="outline" onClick={() => downloadImportErrors(result.errors)}><Download className="h-4 w-4 mr-2" />Download error report</Button>}<div><Link className="text-sm underline" to="/catalogue">View products</Link></div></section>}
  </div>
}
