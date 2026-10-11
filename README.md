# behindmedia.com

Static site for [www.behindmedia.com](https://www.behindmedia.com), built with
[Astro](https://astro.build) and deployed to GitHub Pages on every push to `main`.

Replaces the previous WordPress install (4.9.26), which is no longer maintained.

## Working on it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview  # serve the built output
```

Node 22 or newer.

## Writing a post

Add a markdown file to `src/content/blog/`:

```markdown
---
title: "Post title"
description: "One or two sentences, used on the index and in metadata."
pubDate: 2026-10-11
draft: false
---

Body goes here.
```

The URL is derived from `pubDate` and the filename: a file named
`my-post.md` dated 2026-10-11 is published at `/2026/10/11/my-post/`.
This matches the permalink structure of the old WordPress site, so existing
links keep working. Set `draft: true` to keep a post out of the build.

## Layout

```
src/
  content/blog/           posts (markdown)
  pages/
    index.astro           front page
    about.astro           about
    contact.astro         contact
    writing/index.astro   post archive
    [year]/[month]/[day]/[slug].astro   post permalinks
    rss.xml.js            feed
  layouts/                Base, BlogPost
  components/             header, footer, date, head
  styles/global.css       all styling
  consts.ts               site title, email, permalink helper
public/images/            images carried over from WordPress
```

## Deployment

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages.
The custom domain is configured in the repository's **Settings → Pages**.

## Migration notes

- All three 2017 posts were converted from WordPress, including the Swift code
  blocks, which were stored as CodeColorer HTML tables and are now fenced
  markdown.
- Post permalinks are unchanged. `/feed/` redirects to `/rss.xml`.
- The Contact Form 7 form was replaced with a plain email address; a static site
  has no server to accept a form post.
- Comments were not carried over.
