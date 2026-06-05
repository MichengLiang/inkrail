# inkrail Bookshelf

This directory is the documentation bookshelf for `inkrail`. It intentionally stays under `docs/bookshelf/` so the repository can later hold other documentation surfaces beside books.

## Documentation

- Live site: <https://michengliang.github.io/inkrail/>
- Source catalog: [`catalog.adoc`](./catalog.adoc)
- Primary book: [`books/10-inkrail-cli-design/book.adoc`](./books/10-inkrail-cli-design/book.adoc)
- Bookshelf design notes: [`DESIGN.adoc`](./DESIGN.adoc)

The root site entry `build/html/index.html` redirects to the inkrail CLI design book:

```text
build/html/books/10-inkrail-cli-design/book.html
```

The catalog remains available at:

```text
build/html/catalog.html
```

## Layout

```text
catalog.adoc          # Bookshelf navigation
books/                # Each first-level child is an independent book
shared/               # Cross-book attributes and shared images
scripts/              # Bookshelf build and validation scripts
test/                 # Script tests
package.json          # Bookshelf Node dependency entry
DESIGN.adoc           # Bookshelf template design notes
```

## Commands

Install dependencies from the repository root:

```bash
pnpm install
```

Run documentation tests:

```bash
pnpm --dir docs/bookshelf test
```

Build the bookshelf:

```bash
pnpm --dir docs/bookshelf build
```

Run the full repository check from the root:

```bash
pnpm check
```

## Outputs

Expanded ADOC:

```text
build/adoc/catalog.adoc
build/adoc/books/<book-id>.adoc
```

HTML:

```text
build/html/index.html
build/html/catalog.html
build/html/books/<book-id>/book.html
```

The build copies local resources, injects a home link into each generated book HTML file, writes the root redirect, checks local HTML resources, and validates the bookshelf contract.

## GitHub Pages

The repository-level workflow at `../../.github/workflows/pages.yml` builds this directory and deploys `docs/bookshelf/build/html` to GitHub Pages.

## License

PolyForm Noncommercial License 1.0.0. See [`../../LICENSE`](../../LICENSE).

Commercial use is not permitted under this license.
