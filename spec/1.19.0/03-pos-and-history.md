# POS and history UI

## Company admin (WebOnOne)

Nav (main / company_admin only): **Sales** → Point of Sale `/sales/pos`, History `/sales`.

POS: pick an Identity company customer (or create one), add products/services/spaces from the company catalog, override quantity and unit price, choose cash/card/other, complete sale, open the bill.

Default unit price: company `listPrice`. Products without a list price may pre-fill Data active stock `sellPrice`.

Bill `/sales/:id`: line table, totals, void, print (`window.print()`). Void keeps the row.

Catalog detail Overview includes a Pricing card for products, services, and spaces (editable for linked items).

## Identity User History

Customer History lists sales from WebOnOne activity. Click opens `/users/:id/history/sales/:saleId` using `GET {VITE_WEBONONE_API_BASE_URL}/company/me/sales/:id`.
