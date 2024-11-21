# SilverBullet Readwise Plug

A SilverBullet plug that integrates with Readwise's API to fetch and query your books and highlights.

## Features
- Query your Readwise library directly from SilverBullet
- Filter books by various attributes (category, source, updated, last highlight date)

## Prerequisites
- A Readwise account
- Your Readwise API token

## Installation
Add the following to your `PLUGS` file:
```
- github:nightscape/silverbullet-readwise/readwise.plug.js
```

Then run the `Plugs: Update` command in SilverBullet.

## Configuration
1. Set up your Readwise API token in SilverBullet's secrets:
   - Add `readwiseToken: your-token-here` to your `SECRETS` page

## Usage
### Books
Query your Readwise books using the `readwise` query provider:

````
```query
rwbook where category = "books" and updated > "2024-01-01T00:00:00 limit 5"
```
````

### Highlights
Query your Readwise highlights using the `readwise` query provider:

````
```query
rwhighlight where book_id = 1234567890 limit 5
```
````

## Nicer display
### Books
In order to display the book list nicely, add the following template (e.g. as a page called `Template/ReadwiseBookList`):

```markdown
---
tags: template
description: Readwise Book List
---

| Title | Author | Highlights | Updated |
| ----- | ------ | ---------- | ------- |
{{#each @b in .}}
| ![{{@b.title}}]({{@b.cover_image_url}}) {{@b.title}} | {{@b.author}} | ([{{@b.num_highlights}} highlights]({{@b.highlights_url}})) | {{@b.updated}} |
{{/each}}
```

Then, you can enhance your query with a `render all`:

````
```query
readwise where category = "books" and updated > "2024-01-01T00:00:00" render all [[Template/ReadwiseBookList]]
```
````



## Build
To build this plug, make sure you have [SilverBullet installed with Deno](https://silverbullet.md/Install/Deno). Then, build the plug with:

```shell
deno task build
```

Or to watch for changes and rebuild automatically

```shell
deno task watch
```

Then, copy the resulting `.plug.js` file into your space's `_plug` folder. Or build and copy in one command:

```shell
deno task build && cp *.plug.js /my/space/_plug/
```

SilverBullet will automatically sync and load the new version of the plug, just watch the logs (browser and server) to see when this happens.
