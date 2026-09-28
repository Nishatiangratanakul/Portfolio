# portfolio

Nisha Tiangratanakul's portfolio, [ntiang.com](https://ntiang.com). Plain HTML, CSS and JavaScript on GitHub Pages; no build step.

## Where things live

- `index.json`: every project (work list + project pages)
- `funshit.json`: the fun shit pieces
- `js/site.js`: header, footer and the **about** text (bio, exhibitions & fairs, contact) at the top of the file
- `assets/<project>/`: each project's images and videos

To preview locally: `python3 -m http.server` in this folder, then open http://localhost:8000.

## Adding or editing a project

Each project is one entry in `index.json`. Only `title`, `year`, `description` and `icon` are required; everything else is optional, and the page adapts to whatever is there.

```json
{
    "title": "unspoken dialogue",
    "subject": "book design",
    "format": "book · 160 pp · perfect bound",
    "year": "2026",
    "description": "Used if there's no summary.",
    "icon": "unspokendialogue/icon.jpg",
    "preview": "unspokendialogue/preview.mp4",
    "hero": "unspokendialogue/media-1.jpg",

    "summary": "The overview row.",
    "details": [
        ["role", "designer, editor"],
        ["duration", "8 months"]
    ],
    "deliverables": "The deliverables row.",

    "sections": [
        { "layout": "full", "media": ["unspokendialogue/media-5.mp4"] },
        { "layout": "pair", "media": [
            { "src": "unspokendialogue/media-2.jpg", "caption": "a note under this image" },
            "unspokendialogue/media-3.mp4"
        ] },
        { "label": "a new part", "text": "A text row between images, with its own label." },
        { "layout": "trio", "media": ["a.jpg", "b.jpg", "c.jpg"] }
    ],

    "hidden": true
}
```

- **Work list:** shows `title`, then `format` (or `subject` if there's no format), then `year`. Hovering plays `preview` (or shows `icon`).
- **Info rows** (under the title): `summary` → overview, `details` → context, `deliverables` → deliverables. For different rows, use `"rows"` instead, in any order:
  `"rows": [{ "label": "overview", "text": "…" }, { "label": "materials", "list": [["paper", "…"]] }]`
- **Sections** (below) run in the order you list them. An image block is `full` (one), `pair` (two) or `trio` (three) across. Each image can be a plain path, or `{ "src": …, "caption": … }` for a note under it. A block with `label` + `text` and no `media` is a text row.
- No `sections`? The `media1`, `media2`… images are laid out automatically, one then two across.
- **Videos:** use `.mp4`. They play silently on loop with no controls. Add a `-poster.jpg` of the first frame next to each (e.g. `media-3.mp4` → `media-3-poster.jpg`); it shows while loading and on phones that block autoplay.
- **Hide a project** from the work list with `"hidden": true`. Its page still works if someone has the link.
- **Previews:** replace `assets/<project>/preview.mp4` with your own loop, keeping the same name.

## Adding to fun shit

Put the images in `assets/funshit/`, then add a piece to `funshit.json`:

```json
{ "title": "tassel", "medium": "cord, thread, printed fabric", "year": "2024", "note": "a line or two about it", "images": ["image4.jpg", "image5.jpg"] }
```

`year` and `note` can be left as `""`. The page shows them in a new random order on every visit. `intro` at the top of the file is the text shown under "fun shit".
