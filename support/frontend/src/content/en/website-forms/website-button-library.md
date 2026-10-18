---
title: "Website button library"
category: website-forms
slug: website-button-library
audience: owner
order: 11
summary: "Super Admin designs shared button styles (basic settings, HTML, styles, and script) and can ask the AI assistant to update a button’s live preview."
---

Super Admin maintains the **shared button library**. Company admins pick from it when adding buttons to a theme.

## Open a button style

1. Sign in as Super Admin.
2. Open **Website** → **Buttons**.
3. Click a row, or use the three-dot menu → **Edit**, to open the button detail page.

The detail page shows **Preview**, **Basic settings**, **HTML**, **Styles**, and **Scripts**. The preview updates as those tabs change.

## Edit a button

1. On the detail page, hover a section card (**Preview**, **Basic settings**, **HTML**, **Styles**, or **Scripts**) and click the Edit icon.
2. The **Add button style to library** dialog opens on that tab.
3. Change the fields, then **Save**. The detail page stays view-only.

Keep `{{label}}` in the HTML so company websites can fill the button text. The root element must be the `<button>` itself (not a wrapping `div`). Basic settings apply to that button. The Styles tab includes the `.website-el-…` class for that button.

## Copy to AI

When Design is open inside WebOnOne:

1. Open the three-dot menu on the button detail page (or a list row).
2. Choose **Copy to AI**. The assistant opens with that button attached.
3. Ask for a design change in plain language (for example, “make this a pill button with a hover glow”).
4. Review the suggestion and choose **Confirm**. The assistant only changes basic settings, HTML, styles, and script.
5. Stay on the button page — the preview reloads with the confirmed design.

See also [AI assistant capabilities](/docs/app-preferences/ai-assistant) and [Website themes](/docs/website-forms/website-themes).
