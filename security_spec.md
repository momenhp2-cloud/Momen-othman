# Security Specification — WhatsApp Supermarket Storefront

## 1. Data Invariants
1. **Store Settings (`/storeSettings/{settingId}`)**: Publicly readable (`get` only) for storefront display (shop name, WhatsApp number, currency, delivery fees, working hours). Only verified admins (`isAdmin()`) can create or update settings.
2. **Product Catalog (`/products/{productId}`)**: Publicly readable so shoppers can browse products without forced login. Only verified admins (`isAdmin()`) can create, update, or delete products. `createdAt` is immutable; `updatedAt` must equal `request.time`.
3. **Orders (`/orders/{orderId}`)**: Contains customer PII (`customerName`, `customerPhone`, `customerAddress`). Shoppers may `create` an order only with `status == 'new'`, `createdAt == request.time`, `updatedAt == request.time`, valid bounded fields, and 1–50 line items. Only verified admins (`isAdmin()`) may `get`, `list`, `update` (status transitions only), or `delete` orders.
4. **Admins (`/admins/{adminId}`)**: Only existing verified admins (`isAdmin()`, bootstrapped via verified `momen.hp2@gmail.com`) may grant or revoke seller access. Self-assigned roles are forbidden.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Field Injection on Product Create**: `{ name: "طماطم", ..., isVerified: true }` -> Rejected by `keys().hasOnly(...)`.
2. **Unverified Admin Email Spoof**: Request with `email == 'momen.hp2@gmail.com'` and `email_verified == false` -> Rejected by `isVerified()`.
3. **Customer PII Read Attempt**: Non-admin attempting `get` or `list` on `/orders` -> Rejected by `isAdmin()`.
4. **Order Status Shortcutting on Create**: Guest creating an order with `status: 'delivered'` -> Rejected by `incoming().status == 'new'`.
5. **Timestamp Forgery on Order Create**: Guest passing backdated `createdAt` -> Rejected by `incoming().createdAt == request.time`.
6. **ID Poisoning**: Document ID with 500 characters or `/` or `.` -> Rejected by `isValidId()`.
7. **Unbounded Array / Resource Exhaustion**: Order with `items` array > 50 elements or empty array -> Rejected by `items.size() >= 1 && items.size() <= 50`.
8. **Immutable Field Tampering**: Updating a product's `createdAt` or an order's `total` -> Rejected by `incoming().createdAt == existing().createdAt` and `affectedKeys().hasOnly(...)`.
9. **Self-Role Escalation**: Normal signed-in user attempting to write `/admins/{uid}` -> Rejected by `isAdmin()`.
10. **Invalid WhatsApp Number Format**: Store setting with script tag or letters in `whatsappNumber` -> Rejected by `matches('^[0-9]{7,20}$')`.
11. **Negative Price Injection**: Creating product with `price: -50` -> Rejected by `price > 0 && price <= 100000`.
12. **Blanket List on StoreSettings**: Attempting `list` on `/storeSettings` -> Rejected by `allow list: if false`.
