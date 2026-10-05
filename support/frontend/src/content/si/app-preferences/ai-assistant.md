---
title: "AI සහායක හැකියාවන්"
category: app-preferences
slug: ai-assistant
audience: all
order: 6
summary: "ගුවන් සහායක විවෘත කරන්න, මෙවලම් ඇති ක්ෂේත්‍ර බලන්න, සහ chat හි සෑදීම් හෝ වෙනස්කම් තහවුරු කරන්න."
---

ඔබ sign in වී සිටින විට, header හි **chat** බොත්තමක් දිස්වේ.

1. සහායක panel විවෘත කිරීමට එය click කරන්න.
2. සරල භාෂාවෙන් අසන්න (උදාහරණයක් ලෙස, සැකසුමක් සොයා ගැනීමට හෝ catalog අයිතම ලැයිස්තුගත කිරීමට උදව්).
3. **Staff**, **events**, **companies**, හෝ **catalog** ලැයිස්තු සහ විස්තර පිටු වලින් **Copy to AI** භාවිතා කර එම වාර්තාව chat වෙත එක් කරන්න.
4. සහායකයට යමක් සාදන්න හෝ වෙනස් කරන්න අවශ්‍ය නම්, සෑම suggestion එකක්ම (ඉහළින් item type) පරීක්ෂා කර **Confirm** හෝ **Cancel** තෝරන්න.

සහායකයට ක්‍රියාත්මක API key එකක් අවශ්‍යයි. [AI API key](/docs/app-preferences/ai-api-key) යටතේ එය සකස් කරන්න. එම සැකසුම [text field sparkle](/docs/app-preferences/field-ai-polish) ද සක්‍රිය කරයි. public website හි guests වෙනම [catalog assistant](/docs/public-catalog/guest-assistant) භාවිතා කරයි.

## සහායකයට කළ හැකි දේ

**Settings → Basic Settings → AI** යටතේ **What the assistant can do** කාඩ්පත විවෘත කරන්න. එය ඔබේ **වර්තමාන role**, **company session**, සහ permissions අනුව chat හට platform tools කැඳවිය හැකි ක්ෂේත්‍ර ලැයිස්තුගත කරයි. ලැයිස්තුව සජීවීයි — ඔබේ account සඳහා එම tools ඇති විට පමණක් පේළි පෙන්වයි.

සෑම ක්ෂේත්‍රයකටම **List & search**, **View details**, **Create**, **Update**, **Link & manage**, සහ **Delete** chips පෙන්විය හැක. Creates, updates, deletes සහ similar writes සඳහා chat panel හි **Confirm** (හෝ **Cancel**) අවශ්‍යයි — සෑම suggestion එකකම item type (උදා: Product හෝ Tag) සහ fields පෙන්වයි. ඔබ library items කිහිපයක් ඉල්ලූ විට, හැකි නම් එතරම් confirm rows park කරයි. This card does not replace Calendar or POS for front-desk work; it describes assistant tools only.

Form sparkle (field-level polish) can still work on many screens even when an area is not listed on this card.

## මෙවලම් ක්ෂේත්‍ර

Depending on your account, the card may include:

| Area | What chat can help with |
|------|-------------------------|
| **Public marketplace catalog** | Search products, services, and spaces published across companies |
| **Your company catalog** | Browse and manage company copies — custom items, Data library link, fork, or update linked items (usually needs an active company) |
| **Calendar & events** | List, view, create, update, and delete company calendar events |
| **Staff** | List staff profiles, open details, and create or update staff for your company |
| **Staff leave** | List leave requests and approve or reject them when you have permission |
| **Companies & registration** | Register a company, list companies you belong to, open profiles, update settings, discover public companies, and (super admin) review pending registrations |
| **Data library — Tags** | Shared tag library used across catalogs |
| **Data library — Units** | Measurement units for numeric attributes (name, symbol, description) |
| **Data library — Attributes** | Reusable attribute definitions linked to units where needed |
| **Data library — Products / Services / Spaces** | Platform templates before they are linked into a company catalog |
| **Payment — Invoices** | Read-only subscription invoices when you can open Payment |
| **SMS — Templates** | List and view SMS templates when your role includes SMS access |

Rows marked **Needs active company** require company login — platform user sign-in alone is not enough.

## අදාළ උදව්

- [AI API key](/docs/app-preferences/ai-api-key)
- [Field AI polish (sparkle)](/docs/app-preferences/field-ai-polish)
- [Signed-in AI chat](/docs/public-catalog/signed-in-ai)
- [Catalog AI assistant (guest)](/docs/public-catalog/guest-assistant)
