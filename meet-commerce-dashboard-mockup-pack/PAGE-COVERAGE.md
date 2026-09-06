# Page coverage and functional mapping

The asset pack covers the dashboard capabilities in the supplied specifications. Boards contain four related page concepts; their individual screens should be split into separate routes during implementation.

| Area | Pages / states | Visual source |
|---|---|---|
| HQ command | Executive overview, exception queue, revenue, order status, demand, coverage, recent orders | `02-dashboard-mockups/01-hq-operations-command-center.png` |
| Orders | Order list, filters, status pipeline, variable-weight line items, rider assignment, payment state, lot trace | `02-dashboard-mockups/02-orders-and-cutting-evidence.png` |
| Vendor cutting evidence | Evidence video player, timestamps, replace/upload action, moderation status; this is attached to the selected order and linked to supply-batch evidence | `02-dashboard-mockups/02-orders-and-cutting-evidence.png` |
| Warehouse receipt and QC | Appointment, expected/arrived/weighed/QC/lot-created stepper, measured vs declared quantity, temperature, attachments, accepted/rejected/quarantined decision, audit trail | `02-dashboard-mockups/03-warehouse-receiving-and-qc.png` |
| Catalogue | Product families, categories, cut/variant, price, pack, storage, shelf-life, product media | `02-dashboard-mockups/04-catalogue-vendors-procurement-board.png` |
| Vendors | Onboarding queue, KYC/licence review, compliance checks, risk and approval | `02-dashboard-mockups/04-catalogue-vendors-procurement-board.png` |
| Vendor proposals | Proposal detail, canonical comparison, requested changes, approval history | `02-dashboard-mockups/04-catalogue-vendors-procurement-board.png` |
| Procurement and batches | Purchase requests, vendor quotes, delivery windows, award decision, create supply batch | `02-dashboard-mockups/04-catalogue-vendors-procurement-board.png` |
| Inventory | Lot list, availability/reservations/picks, expiry, temperature, inventory-ledger drilldown, adjustment/wastage/hold | `02-dashboard-mockups/05-inventory-fulfilment-delivery-board.png` |
| Fulfilment | Pick waves, picker tasks, bin and lot scans, scan exceptions, pack station, actual weight, seal and label | `02-dashboard-mockups/05-inventory-fulfilment-delivery-board.png` |
| Delivery | Rider status, delivery map, clusters, failure queue, OTP and proof of delivery | `02-dashboard-mockups/05-inventory-fulfilment-delivery-board.png` |
| Customers | Customer profile, segment/cohort, purchase history, wallet and loyalty balances | `02-dashboard-mockups/06-crm-support-quality-recall-board.png` |
| Support | Ticket inbox, linked order, refund / replacement controls, customer messages and private notes | `02-dashboard-mockups/06-crm-support-quality-recall-board.png` |
| Quality and recalls | Complaint triage, linked lot investigation, recall exposure, customer notification progress, hold/release/stop controls | `02-dashboard-mockups/06-crm-support-quality-recall-board.png` |
| Finance | GMV, fees, refunds, payout health, vendor settlement reconciliation, provider event exceptions, wallet controls | `02-dashboard-mockups/07-finance-loyalty-board.png` |
| Loyalty | Points liability, ledger, tier distribution, accrual/redemption/expiry rules | `02-dashboard-mockups/07-finance-loyalty-board.png` |
| Marketing | Campaign calendar, audience segment, conversion, coupon/offer guardrails and redemptions | `02-dashboard-mockups/08-marketing-content-board.png` |
| Content | Theme/section builder, channel composition, preview/publish, banner and tutorial media approval/scheduling | `02-dashboard-mockups/08-marketing-content-board.png` and `01-banner-assets/` |
| Analytics and reports | Executive KPI drilldown, cohorts, category mix, regional map, quality/temperature/expiry reporting | `02-dashboard-mockups/09-analytics-traceability-governance-board.png` |
| Traceability | Order item -> warehouse lot -> receipt -> supply batch -> vendor lineage, chain of custody and export | `02-dashboard-mockups/09-analytics-traceability-governance-board.png` |
| Governance | Audit explorer, role/permission matrix, MFA/session/security controls and configuration | `02-dashboard-mockups/09-analytics-traceability-governance-board.png` |
| Auth and scope | Login, forced password rotation, MFA, vendor/warehouse scope selection and secure session indicators | `02-dashboard-mockups/11-auth-retention-communications-platform-board.png` |
| Retention and communications | Abandoned carts, reviews moderation, notification composer/queue and delivery status | `02-dashboard-mockups/11-auth-retention-communications-platform-board.png` |
| Platform operations | App-version rollout, store status, delivery slots/calendar and feature flags | `02-dashboard-mockups/11-auth-retention-communications-platform-board.png` |
| Merchandising depth | Product-family/category hierarchy, create/edit product, cart milestones, purchase limits, first-time offers and suggestions | `02-dashboard-mockups/12-catalogue-merchandising-shops-board.png` |
| Shops and team | Shop/warehouse list, staff roles, scope, opening hours, coverage and team actions | `02-dashboard-mockups/12-catalogue-merchandising-shops-board.png` |
| Themes and tutorials | Theme library/detail/new, versions, builder, channel tabs, tutorials and analytics | `02-dashboard-mockups/13-content-configuration-board.png` |
| Commerce configuration | Payment methods, provider offers, fees, tip presets, refunds, wallet, pincode mapping, serviceability and notification templates | `02-dashboard-mockups/13-content-configuration-board.png` |
| Universal states | Manual order creation, team/profile, loading, empty, error, permission denied, upload progress, rollback, bulk actions and responsive detail drawer | `02-dashboard-mockups/14-universal-states-and-edge-cases-board.png` |
| Supply-chain administration | Vendor staff/documents, batch detail, evidence moderation, appointments/receipt inbox and lot ledger/adjustments | `02-dashboard-mockups/15-supply-chain-detail-board.png` |

## Required universal behaviours

- Role and warehouse/vendor scope must determine both navigation visibility and record access.
- Every material status change presents the current state, actor, timestamp and audit history.
- Inventory actions are ledger-based; direct available-stock edits are never offered.
- Any recall, QC, temperature or payment exception must surface in the HQ exception queue.
- Lists support search, filters, saved views, CSV export and a drilled-in detail view.
- All data visualisations include a date range, legend and accessible tabular alternative.
