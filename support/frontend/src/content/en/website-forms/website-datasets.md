---
title: "Website data sets"
category: website-forms
slug: website-datasets
audience: owner
order: 11
summary: "Define live filter queries over products, services, spaces, staff, users, or analytics that the public website is allowed to show."
---

1. Open **Design → Website** and choose the **Data Sets** tab.
2. Click **Add data set**, give it a name, and pick a **source type** (products, services, spaces, staff, users, or analytics).
3. For analytics, also choose a **dimension** (for example KPIs or top products) and an optional date range.
4. On the **Filters** step, add rules such as status equals active or price greater than 200. Conditions include equals, not equal, greater/less than, between, contains, and in list.
5. Save the data set. Filters are stored — the website always reads **live** matching rows, not a frozen copy.
6. Set status to **Active** so the public API can return the data. Inactive data sets are hidden from the public site.

Only data exposed through an active data set should be shown on the company website. Use the preview step after saving to confirm the live results.

See [Website presets](/docs/website-forms/website-presets) and [Website pages](/docs/website-forms/website-pages).
