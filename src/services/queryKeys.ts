// Central query-key factory for TanStack Query. One entry per domain so
// every service/page invalidates and refetches through the same key shape
// instead of inventing ad hoc arrays. Add a new domain here whenever a new
// service is introduced — don't hand-roll keys inline in components.
//
// Convention: `all` is the broad key to invalidate everything for a domain;
// `list(filters)` and `detail(id)` narrow it. Extend a domain's object with
// more specific keys (e.g. summary, byShop) as that service needs them.

export const queryKeys = {
  returns: {
    all: ['returns'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.returns.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.returns.all, 'detail', id] as const,
    orderSearch: (q: string) => [...queryKeys.returns.all, 'order-search', q] as const,
  },
  paymentOffers: {
    all: ['payment-offers'] as const,
    list: () => [...queryKeys.paymentOffers.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.paymentOffers.all, 'detail', id] as const,
  },
  banners: {
    all: ['banners'] as const,
    list: () => [...queryKeys.banners.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.banners.all, 'detail', id] as const,
  },
  feeSettings: {
    all: ['fee-settings'] as const,
    global: () => [...queryKeys.feeSettings.all, 'global'] as const,
    shopOverride: (shopId: string) => [...queryKeys.feeSettings.all, 'shop', shopId] as const,
    preview: (params: Record<string, unknown>) => [...queryKeys.feeSettings.all, 'preview', params] as const,
  },
  shopsBasic: {
    all: ['shops-basic'] as const,
    list: () => [...queryKeys.shopsBasic.all, 'list'] as const,
  },
  abandonedCarts: {
    all: ['abandoned-carts'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.abandonedCarts.all, 'list', filters] as const,
    summary: () => [...queryKeys.abandonedCarts.all, 'summary'] as const,
    detail: (id: string) => [...queryKeys.abandonedCarts.all, 'detail', id] as const,
  },
  storeOps: {
    all: ['store-ops'] as const,
    status: () => [...queryKeys.storeOps.all, 'status'] as const,
    weeklyHours: () => [...queryKeys.storeOps.all, 'weekly-hours'] as const,
    deliveryTemplate: () => [...queryKeys.storeOps.all, 'delivery-template'] as const,
    deliveryDays: (params?: Record<string, unknown>) => [...queryKeys.storeOps.all, 'delivery-days', params] as const,
  },
  pincodeMappings: {
    all: ['pincode-mappings'] as const,
    list: () => [...queryKeys.pincodeMappings.all, 'list'] as const,
  },
  merchandising: {
    all: ['merchandising'] as const,
    cartMilestones: () => [...queryKeys.merchandising.all, 'cart-milestones'] as const,
    firstTimeOffers: () => [...queryKeys.merchandising.all, 'first-time-offers'] as const,
  },
  coupons: {
    all: ['coupons'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.coupons.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.coupons.all, 'detail', id] as const,
    analytics: (id: string) => [...queryKeys.coupons.all, 'analytics', id] as const,
    targetUsers: (id: string) => [...queryKeys.coupons.all, 'target-users', id] as const,
  },
  notificationCampaigns: {
    all: ['notification-campaigns'] as const,
    templates: () => [...queryKeys.notificationCampaigns.all, 'templates'] as const,
    campaigns: (filters?: Record<string, unknown>) => [...queryKeys.notificationCampaigns.all, 'campaigns', filters] as const,
    campaignDetail: (id: string) => [...queryKeys.notificationCampaigns.all, 'campaign', id] as const,
    segmentCount: (params: Record<string, unknown>) => [...queryKeys.notificationCampaigns.all, 'segment-count', params] as const,
  },
  customerSegments: {
    all: ['customer-segments'] as const,
    list: () => [...queryKeys.customerSegments.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.customerSegments.all, 'detail', id] as const,
    members: (id: string) => [...queryKeys.customerSegments.all, 'members', id] as const,
    searchCandidates: (id: string, query: string) => [...queryKeys.customerSegments.all, 'search-candidates', id, query] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.customers.all, 'list', filters] as const,
    ltv: () => [...queryKeys.customers.all, 'ltv'] as const,
    churned: () => [...queryKeys.customers.all, 'churned'] as const,
    vip: () => [...queryKeys.customers.all, 'vip'] as const,
    detail: (id: string) => [...queryKeys.customers.all, 'detail', id] as const,
    orders: (id: string) => [...queryKeys.customers.all, 'orders', id] as const,
    addresses: (id: string) => [...queryKeys.customers.all, 'addresses', id] as const,
    timeline: (userId: string, filters?: Record<string, unknown>) => [...queryKeys.customers.all, 'timeline', userId, filters] as const,
  },
  themeTabs: {
    all: ['theme-tabs'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.themeTabs.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.themeTabs.all, 'detail', id] as const,
  },
  sections: {
    all: ['sections'] as const,
    byTab: (tabId: string) => [...queryKeys.sections.all, 'by-tab', tabId] as const,
    detail: (id: string) => [...queryKeys.sections.all, 'detail', id] as const,
    versions: (tabId: string) => [...queryKeys.sections.all, 'versions', tabId] as const,
  },
  shops: {
    all: ['shops'] as const,
    list: () => [...queryKeys.shops.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.shops.all, 'detail', id] as const,
    staff: (shopId: string) => [...queryKeys.shops.all, 'staff', shopId] as const,
    financials: (shopId: string) => [...queryKeys.shops.all, 'financials', shopId] as const,
    transactions: (shopId: string, filters?: Record<string, unknown>) => [...queryKeys.shops.all, 'transactions', shopId, filters] as const,
    products: (shopId: string) => [...queryKeys.shops.all, 'products', shopId] as const,
    reports: (shopId: string) => [...queryKeys.shops.all, 'reports', shopId] as const,
  },
} as const;
