import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BulkImportPage from './BulkImportPage'

const api = vi.hoisted(() => ({ preview: vi.fn(), commit: vi.fn(), template: vi.fn() }))
vi.mock('@/context/ShopScopeContext', () => ({ useShopScope: () => ({ shops: [{ id: 'shop-a', name: 'Test Store', is_active: true }], activeShopId: 'shop-a', isLoading: false }) }))
vi.mock('@/hooks/useCategoriesAdmin', () => ({ useAdminCategories: () => ({ data: [{ id: 'cat-a', name: 'Chicken' }] }) }))
vi.mock('@/services/bulkImportService', () => ({ previewBulkImport: api.preview, commitBulkImport: api.commit, downloadBulkTemplate: api.template, downloadImportErrors: vi.fn() }))

describe('bulk import wizard', () => {
  beforeEach(() => { vi.clearAllMocks() })
  it('previews the chosen file before allowing commit and invalidates preview when settings change', async () => {
    api.preview.mockResolvedValue({ shop_id: 'shop-a', rows: [{ row: 2, product_name: 'Chicken', category_name: 'Chicken', price: 100, stock_quantity: 4, unit: 'kg', action: 'CREATE_MASTER_AND_ADD', errors: [], warnings: [] }], summary: { total_rows: 1, valid_rows: 1, error_rows: 0, create_master: 1, add_to_shop: 0, update_shop: 0, skip_existing: 0 } })
    render(<MemoryRouter><BulkImportPage /></MemoryRouter>)
    expect(screen.queryByRole('button', { name: /import valid rows/i })).toBeNull()
    fireEvent.change(screen.getByLabelText(/product file/i), { target: { files: [new File(['x'], 'products.csv', { type: 'text/csv' })] } })
    fireEvent.click(screen.getByRole('button', { name: /preview import/i }))
    await screen.findByText('Chicken')
    expect(screen.getByRole('button', { name: /import valid rows/i })).toBeTruthy()
    fireEvent.change(screen.getByLabelText(/existing products/i), { target: { value: 'UPDATE_EXISTING' } })
    await waitFor(() => expect(screen.queryByRole('button', { name: /import valid rows/i })).toBeNull())
  })
})
