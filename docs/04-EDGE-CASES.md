# Edge-Case Catalog

The features that separate a real store from a demo. Each row = the case + how we
handle it. Owner: BE = backend, FE = frontend.

## Inventory & concurrency
| Case | Handling | Owner |
| --- | --- | --- |
| Two customers buy the last unit simultaneously | Atomic decrement in a transaction with `RowVersion`/row lock; loser gets "out of stock" | BE |
| Size available, another size sold out | Availability is per-variant; disable unavailable variant | BE + FE |
| Different stock per color/size | Stock lives on the variant, never the parent | BE |
| Product globally out of stock | All variants zero → product shows out of stock, not purchasable | BE + FE |
| Stock drops between add-to-cart and checkout | Revalidate at checkout; reduce/reject with clear message | BE |
| Variant deactivated while in cart | Checkout rejects the line item; FE shows inline warning | BE + FE |

## Catalog / product lifecycle
| Case | Handling | Owner |
| --- | --- | --- |
| Product unpublished but exists in admin | Storefront hides it; admin still sees it | BE + FE |
| Product removed after being added to a cart | Checkout drops/flags the item; cart shows notice | BE + FE |
| Admin edits price/name after an order | Order uses snapshots; history unchanged | BE |
| Invalid image upload (type/size) | Validate mime + size; reject with error | BE + FE |

## Cart & pricing
| Case | Handling | Owner |
| --- | --- | --- |
| Price changed while item in cart | Server recomputes at checkout; show updated total | BE + FE |
| Frontend sends manipulated price/total | Ignored — server is authoritative | BE |
| Manipulated shipping cost | Server computes shipping | BE |

## Discounts
| Case | Handling | Owner |
| --- | --- | --- |
| Expired code | Reject at checkout with reason | BE |
| Usage limit reached | Atomic check on usage count; reject | BE |
| Minimum order not met | Reject with required minimum | BE |
| Discount exceeds order value | Cap discount at order total | BE |
| Code disabled while in customer's cart | Revalidate at checkout; remove + notify | BE + FE |
| Same code applied twice / race on last use | Atomic increment + `DiscountUsage` unique constraint | BE |

## Payments
| Case | Handling | Owner |
| --- | --- | --- |
| Payment fails | Order stays pending / → Payment Failed; allow retry | BE + FE |
| Customer closes payment window | Order remains pending until webhook or expiry | BE |
| Payment succeeds but redirect back fails | Webhook confirms independently of frontend | BE |
| Webhook delivered twice / retried | `WebhookEvents` idempotency ledger (unique event id) | BE |
| Confirmation arrives after order expired | Reconcile: mark paid + flag, or auto-refund per policy | BE |
| Customer refreshes success page | Idempotent — reads current server order status | BE + FE |
| Provider takes minutes to confirm | Success page shows "processing payment"; poll/refresh status | BE + FE |
| Duplicate payment processing | Idempotency ledger + order status guard | BE |

## Orders & status
| Case | Handling | Owner |
| --- | --- | --- |
| Admin saves same status repeatedly | No-op; no duplicate history entry or notification | BE |
| Invalid status transition | Rejected by allowed-transition rules | BE |
| Cancel/refund after payment | Keep record; add status + refund entry; never delete | BE |
| Partial refund | Track refunded amount; status `Partially Refunded` | BE |

## Notifications
| Case | Handling | Owner |
| --- | --- | --- |
| Webhook fires multiple times → duplicate emails | Idempotent send via unique `EventKey` | BE |
| Background job retries | Same `EventKey` guard prevents resend | BE |
| Repeated admin status save | Event only raised on actual transition | BE |

## Security & access
| Case | Handling | Owner |
| --- | --- | --- |
| Guessing `/orders/1`, `/orders/2` | No sequential public IDs; token/reference only | BE + FE |
| Accessing another customer's order | Require reference+email or secret token; generic errors | BE |
| Unauthorized admin API access | JWT + role checks on every admin endpoint | BE |
| Webhook spoofing | Verify provider signature before processing | BE |
| Brute force on login/tracking | Rate limiting | BE |
| Secret leakage | Secrets in env/user-secrets, never committed | BE |

## Assumptions to confirm
- Single currency for MVP (e.g. NGN). Multi-currency is 💡 future.
- Flat or simple rule-based shipping for MVP.
- One payment provider live at launch (abstraction proven with a second later).
- Email is the only notification channel at launch.
