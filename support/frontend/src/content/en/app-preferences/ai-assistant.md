---
title: "AI assistant capabilities"
category: app-preferences
slug: ai-assistant
audience: all
order: 6
summary: "Open the floating assistant, see which areas have tools, and confirm creates or changes in chat."
---

When you are signed in, a **chat** button appears in the header.

1. Click it to open the assistant panel.
2. Ask in plain language (for example, help finding a setting or listing catalog items).
3. From **staff**, **events**, **companies**, or **catalog** lists and detail pages, use **Copy to AI** to attach that record to the chat.
4. If the assistant wants to create or change something, confirm the action when asked.

The assistant needs a working API key. Configure it under [AI API key](/docs/app-preferences/ai-api-key). The same setup enables the [sparkle on text fields](/docs/app-preferences/field-ai-polish). Guests on the public website use a separate [catalog assistant](/docs/public-catalog/guest-assistant).

## What the assistant can do

Under **Settings → Basic Settings → AI**, open the **What the assistant can do** card. It lists the platform areas where chat can call tools for your **current role**, **company session**, and permissions. The list is live — rows appear only when those tools are available for your account.

For each area you may see operation chips such as **List & search**, **View details**, **Create**, **Update**, **Link & manage**, and **Delete**. Creates, updates, deletes, and similar writes always need your **Confirm** (or Skip) in the chat panel. The card does not replace Calendar or POS for front-desk work; it describes assistant tools only.

Field-level polish (the sparkle on forms) can still work on many screens even when an area is not listed on this card.

## Tooling areas

Depending on your account, the card may include areas such as:

| Area | What chat can help with |
|------|-------------------------|
| **Public marketplace catalog** | Search products, services, and spaces published across companies |
| **Your company catalog** | Browse and manage company copies of products, services, spaces, tags, units, and attributes — add custom items, link from the Data library, fork, or update linked items (usually needs an active company) |
| **Calendar & events** | List, view, create, update, and delete company calendar events |
| **Staff** | List staff profiles, open details, and create or update staff for your company |
| **Staff leave** | List leave requests and approve or reject them when you have permission |
| **Companies & registration** | Register a company, list companies you belong to, open profiles, update settings, discover public companies, and (super admin) review pending registrations |
| **Data library — Tags** | Shared tag library used across catalogs |
| **Data library — Units** | Measurement units for numeric attributes (name, symbol, description) |
| **Data library — Attributes** | Reusable attribute definitions linked to units where needed |
| **Data library — Products / Services / Spaces** | Platform templates with descriptions, tags, and attributes before they are linked into a company catalog |
| **Payment — Invoices** | Read-only subscription invoices when you can open Payment |
| **SMS — Templates** | List and view SMS templates when your role includes SMS access |

Rows marked **Needs active company** require that you are logged into a company, not only signed in as a platform user.

## Related help

- [Configure your AI API key](/docs/app-preferences/ai-api-key)
- [Improve text with AI (sparkle)](/docs/app-preferences/field-ai-polish)
- [Signed-in AI chat](/docs/public-catalog/signed-in-ai)
- [Catalog AI assistant (guest)](/docs/public-catalog/guest-assistant)
