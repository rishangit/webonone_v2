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
2. Desktop තිරයකදී, Close ට වමින් ඇති **expand** අයිකනය භාවිතා කර chat එක වම් navigation දක්වා පුළුල් කරන්න. නැවත click කර පටු panel එකට ආපසු යන්න. දුරකථනවල chat දැනටමත් සම්පූර්ණ පළලයි.
3. සරල භාෂාවෙන් අසන්න (උදාහරණයක් ලෙස, සැකසුමක් සොයා ගැනීමට, catalog අයිතම ලැයිස්තුගත කිරීමට, හෝ Font library එකට fonts යෝජනා කිරීමට උදව්).
4. **Staff**, **events**, **companies**, **catalog**, හෝ Design **button** සහ **text** library ලැයිස්තු සහ විස්තර පිටු වලින් **Copy to AI** භාවිතා කර එම වාර්තාව chat වෙත එක් කරන්න.
5. සහායකයට යමක් සාදන්න හෝ වෙනස් කරන්න අවශ්‍ය නම්, සෑම suggestion එකක්ම (ඉහළින් item type) පරීක්ෂා කර **Confirm** හෝ **Cancel** තෝරන්න.

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
| **Design — Forms** | Form එකක් controls සමඟ සාදන්න, control එකක් එක් කරන්න, හෝ control එකක label, required, placeholder, හෝ options වෙනස් කරන්න. සක්‍රිය company එකක් අවශ්‍යයි. සුරැකීමට පෙර Confirm කරන්න |
| **Website — Font library** | Super admin: fonts යෝජනා කරන ලෙස අසන්න. සෑම යෝජනාවක්ම Google font එකකි (නම, family, stylesheet URL). පුස්තකාලයේ ඇති fonts මඟ හරියි. සුරැකීමට පෙර Confirm කරන්න. Company පරිශීලකයින්ට fonts ලැයිස්තුව ඉල්ලිය හැක |
| **Website — Button library** | Super admin: Copy to AI එකින් button එක attach කර, basic settings, HTML, styles, හෝ script වෙනස් කරන්නැයි අසන්න. Confirm කළ පසු live preview යාවත්කාලීන වේ. [Website button library](/docs/website-forms/website-button-library) බලන්න |
| **Website — Text library** | Super admin: Copy to AI එකින් text style එක attach කර, basic settings, HTML, styles, හෝ script වෙනස් කරන්නැයි අසන්න. Confirm කළ පසු live preview යාවත්කාලීන වේ. [Website text library](/docs/website-forms/website-text-library) බලන්න |
| **Website — company site** | සක්‍රිය company එකක් සහිත company admin: pages, presets, layouts, themes, headers, footers, හෝ data sets යෝජනා කරන ලෙස අසන්න. නිර්මාණකරුව විවෘත කර ශීර්ෂයේ කතාබස් නිරූපකයෙන් කැන්වස අංග එක් කරන්න, දැනට ඇති බ්ලොක් එකක් සංස්කරණය කරන්න, හෝ එය කැන්වස් ජාලකයේ ගෙන යන්න, පළල සහ උස වෙනස් කරන්න. නම් කළ අංගය එම තැනේ පවතී; එය වසා ගන්නා අංගයක් පැත්තකට යයි. සහායකය දැන් ඇති කැන්වසය භාවිතා කරයි, එබැවින් අතින් කළ වෙනස්කම් එම කොටස වෙනස් කරන ලෙස නොඉල්ලූ විට පවතී. අන්තර්ගත ගසේ **AI වෙත පිටපත් කරන්න** එක් අංගයක් සහායකයට නම් කරයි. අදාළ අයිතම එක බ්ලොක් එකක යයි, කණ්ඩායමක අයිතම දෙකක්වත් ඇත, විශාල කොටස් ඒවායින් ගොඩනැගේ. එක් එක් අයිතමයේ පළල සහ උස අන්තර්ගතයට ගැලපේ; හිස් ඉඩක් නැත. තහවුරු කර සුරකින්න |
| **Website library** | Super admin: සමාගම් පිටපත් කරන බෙදාගත් library එකට එම අයිතම |

Rows marked **Needs active company** require company login — platform user sign-in alone is not enough.

## අදාළ උදව්

- [AI API key](/docs/app-preferences/ai-api-key)
- [Field AI polish (sparkle)](/docs/app-preferences/field-ai-polish)
- [Signed-in AI chat](/docs/public-catalog/signed-in-ai)
- [Catalog AI assistant (guest)](/docs/public-catalog/guest-assistant)
