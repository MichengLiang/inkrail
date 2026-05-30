# inkrail

Project memory, projection freshness, and SPARQL query workflow for AsciiDoc multi-book workspaces.

[![npm version](https://img.shields.io/npm/v/inkrail.svg?cacheSeconds=300&color=blue)](https://www.npmjs.com/package/inkrail)
[![CI](https://github.com/MichengLiang/inkrail/actions/workflows/ci.yml/badge.svg)](https://github.com/MichengLiang/inkrail/actions/workflows/ci.yml)
[![Pages](https://github.com/MichengLiang/inkrail/actions/workflows/pages.yml/badge.svg)](https://github.com/MichengLiang/inkrail/actions/workflows/pages.yml)
[![License](https://img.shields.io/npm/l/inkrail.svg?cacheSeconds=300)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/inkrail.svg?cacheSeconds=300)](./packages/inkrail/package.json)

`inkrail` is a planned CLI for AsciiDoc bookshelf projects. It records project memory, derives standard book paths, refreshes stale projections, and runs SPARQL queries over RDF12 Turtle produced from book sources.

## What inkrail Is

`inkrail` is a documentation-first CLI design for book-oriented AsciiDoc workspaces. The public specification covers:

- Standard bookshelf profile and project memory.
- Book path derivation and initialization contracts.
- Projection freshness over aggregate ADOC, RDF12 TTL, and RDF12 JSON-LD outputs.
- Oxigraph-backed SPARQL query modes and output surfaces.
- Built-in query action contracts for headings, structure, xrefs, neighborhoods, and audits.

## What inkrail Is Not

`inkrail` is not yet a runtime CLI, AsciiDoc parser, graph database, editor plugin, or replacement for Asciidoctor. The npm package currently reserves the public package name and points users to the design book.

## Documentation

The primary document is the inkrail CLI design book:

- Source: [`docs/bookshelf/books/10-inkrail-cli-design/book.adoc`](docs/bookshelf/books/10-inkrail-cli-design/book.adoc)
- Local build output: `docs/bookshelf/build/html/index.html`
- Published site: `https://michengliang.github.io/inkrail/`

Build the documentation locally:

```bash
cd docs/bookshelf
pnpm install
pnpm run test
pnpm run build
```

The generated site entry redirects to:

```text
docs/bookshelf/build/html/books/10-inkrail-cli-design/book.html
```

The generated catalog remains available at:

```text
docs/bookshelf/build/html/catalog.html
```

## Package State

`inkrail` is currently a specification package. It reserves the public npm name and points users to the CLI design book. It does not yet export a CLI, parser, projection engine, query library, or SDK runtime.

## Repository Layout

```text
docs/
  bookshelf/
    catalog.adoc
    books/
      10-inkrail-cli-design/
    scripts/
    test/
packages/
  inkrail/
```

`docs/bookshelf/` is an AsciiDoc book workspace. `packages/inkrail` is the npm package metadata surface for the future TypeScript-facing CLI package.

## Development

```bash
pnpm install
pnpm check
```

Useful focused commands:

```bash
pnpm --dir docs/bookshelf test
pnpm --dir docs/bookshelf build
pnpm --filter inkrail pack:check
```

## Release State

`inkrail` is prepared for public npm publishing as a specification package. Tag releases use `v<package-version>`, run the full check suite, publish the npm package with provenance, and create a GitHub release from `CHANGELOG.md`.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

Apache License 2.0. See [`LICENSE`](LICENSE).
