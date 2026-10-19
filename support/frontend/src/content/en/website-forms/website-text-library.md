---
title: "Website text library"
category: website-forms
slug: website-text-library
audience: owner
order: 12
summary: "Super Admin designs shared text styles (basic settings, HTML, styles, and script) and can ask the AI assistant to update a text style’s live preview."
---

Super Admin maintains the **shared text library**. Company admins pick from it when adding typography to a theme.

## Open a text style

1. Sign in as Super Admin.
2. Open **Website** → **Texts**.
3. Click a row, or use the three-dot menu → **Edit**, to open the text detail page.

The detail page shows **Preview**, **Basic settings**, **HTML**, **Styles**, and **Scripts**. The preview updates as those tabs change. **Basic settings** use the same color controls as a library button: a **color palette**, then a **font color** from that palette, plus style name, font type, and size.

## Edit a text style

1. On the detail page, hover a section card (**Preview**, **Basic settings**, **HTML**, **Styles**, or **Scripts**) and click the Edit icon.
2. The **Add text style to library** dialog opens on that tab.
3. Change the fields, then **Save**. The detail page stays view-only.

Keep `{{content}}` in the HTML so company websites can fill the text.

## Scripts in preview

Scripts run in the **Preview** (and in the side preview on **Scripts**). Stay on Preview to watch timers.

The selected color palette is available as CSS variables `--el-color-1` through `--el-color-6`. `.animate-slide-up` is built in. Example:

```js
const el = document.querySelector('.website-el-lib-text-heading') || root
el.classList.add('animate-slide-up')
setTimeout(() => {
  el.style.color = 'var(--el-color-4)'
}, 10000)
setTimeout(() => {
  el.style.color = 'var(--el-color-5)'
}, 20000)
```

`root` is always this text element. `document.querySelector('.website-el-…')` also targets it in preview even if the class name differs from the saved id.

## Copy to AI

When Design is open inside WebOnOne:

1. Open the three-dot menu on the text detail page (or a list row).
2. Choose **Copy to AI**. The assistant opens with that text style attached.
3. Ask for a design change in plain language (for example, “make this heading bolder with a fade-in”).
4. Review the suggestion and choose **Confirm**. The assistant only changes basic settings, HTML, styles, and script.
5. Stay on the text page — the preview reloads with the confirmed design.

See also [AI assistant capabilities](/docs/app-preferences/ai-assistant) and [Website themes](/docs/website-forms/website-themes).
