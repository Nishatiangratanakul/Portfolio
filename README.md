# portfolio

Nisha Tiangratanakul's portfolio, [ntiang.com](https://ntiang.com). Plain HTML, CSS and JavaScript on GitHub Pages; no build step.

## Where things live

- `index.json`: every project (work list + project pages)
- `funshit.json`: the fun shit images
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

    "summary": "The description row.",
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
- **Info rows** (under the title): `summary` → description, `details` → context, `deliverables` → deliverables. For different rows, use `"rows"` instead, in any order:
  `"rows": [{ "label": "description", "text": "…" }, { "label": "materials", "list": [["paper", "…"]] }]`
- **Sections** (below) run in the order you list them. An image block is `full` (one), `pair` (two), `trio` (three) or `row` (all of them side by side) across. Each image can be a plain path, or `{ "src": …, "caption": … }` for a note under it. A block with `label` + `text` and no `media` is a text row. Add `"dark": true` to put an image block on black.
- **Gallery:** `"layout": "gallery"` shows thumbnails in a row; clicking one opens it full screen (click again to zoom in, arrows to step through). Give each image a small `thumb` next to its full-size `src`: `{ "src": "a.jpg", "thumb": "a-thumb.jpg", "caption": "…" }`.
- No `sections`? The `media1`, `media2`… images are laid out automatically, one then two across.
- **Videos:** use `.mp4`. They play silently on loop with no controls. Add a `-poster.jpg` of the first frame next to each (e.g. `media-3.mp4` → `media-3-poster.jpg`); it shows while loading and on phones that block autoplay.
- **Hide a project** from the work list with `"hidden": true`. Its page still works if someone has the link.
- **Previews:** replace `assets/<project>/preview.mp4` with your own loop, keeping the same name.

## Adding to fun shit

Put the image in `assets/funshit/` and add its file name to the `images` list in `funshit.json`. The newest (last in the list) shows first.

A redesigned fun shit page (a panel with a title, medium, year and note for each piece, and a viewer) is saved on the `funshit-redesign` branch, waiting for those descriptions.
