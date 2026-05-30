# AsciiDoc Multi-Book Workspace

[![CI](https://github.com/MichengLiang/asciidoc-multi-book-workspace/actions/workflows/ci.yml/badge.svg)](https://github.com/MichengLiang/asciidoc-multi-book-workspace/actions/workflows/ci.yml)
[![Pages](https://github.com/MichengLiang/asciidoc-multi-book-workspace/actions/workflows/pages.yml/badge.svg)](https://github.com/MichengLiang/asciidoc-multi-book-workspace/actions/workflows/pages.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.19.0-339933.svg)](./package.json)
[![Template](https://img.shields.io/badge/github-template-181717.svg)](https://github.com/MichengLiang/asciidoc-multi-book-workspace/generate)

`asciidoc-multi-book-workspace` 是一个 book-first 的 GitHub 模板仓库，用于在一个 pnpm / Asciidoctor 工作区里维护多本边界独立的 AsciiDoc book。

它适合文档集、系列书、分卷书、技术书和参考手册共用一套构建脚本，但仍让每本书保留自己的入口、章节顺序、资源边界和生成产物。

## Use This Template

在 GitHub 上点击 [Use this template](https://github.com/MichengLiang/asciidoc-multi-book-workspace/generate)，生成自己的仓库后安装依赖并运行检查：

```bash
pnpm install
pnpm run check
```

本仓库不发布 npm 包。`package.json` 只作为工作区脚本和依赖入口存在，`private: true` 用于防止误发布。

## Documentation

- Live bookshelf: <https://michengliang.github.io/asciidoc-multi-book-workspace/>
- Source catalog: [`catalog.adoc`](./catalog.adoc)
- Design specification: [`DESIGN.adoc`](./DESIGN.adoc)

样本书导航由 `catalog.adoc` 维护。构建后从 `build/html/index.html` 或 `build/html/catalog.html` 进入网页书库。

## Layout

```text
catalog.adoc          # 多书网页入口和样本书导航
books/                # 每个一级子目录是一本文档边界独立的 book
shared/               # 跨书共享属性和共享图片
scripts/              # 工作区级构建与检查脚本
test/                 # 脚本测试
package.json          # 工作区唯一 Node 依赖入口
DESIGN.adoc           # 样本体系重设计规格
```

每本书保留自己的入口：

```text
books/<book-id>/
├── book.adoc
├── frontmatter/
├── chapters/ 或 parts/
├── backmatter/
└── assets/images/      # 仅在该书拥有私有图片时存在
```

## Resource Boundaries

单书图片放在 `books/<book-id>/assets/images/`。

被 `catalog.adoc` 或多本书共同引用的图片放在 `shared/images/`。

单书示例代码放对应书内，例如 `books/03-technical-book-workflow/examples/`。

根级 `shared/` 不预设没有当前消费者的共享片段目录。只有多本书实际共享、且维护责任属于工作区的内容，才进入 `shared/`。

## Commands

安装依赖：

```bash
pnpm install
```

运行脚本测试：

```bash
pnpm run test
```

构建全部产物：

```bash
pnpm run build
```

运行完整仓库检查：

```bash
pnpm run check
```

`pnpm run check` 会运行脚本测试、构建网页和 ADOC 产物，并检查模板本体的样本覆盖合同。

## Contract Checks

普通工作区合同检查：

```bash
pnpm run check:contract
```

通用合同检查只验证当前 `catalog.adoc`、现存 book、doctype 和跨书 xref。它不要求保留七本样本书，因此复制模板后可以删除不需要的样本书。

维护本模板本体时运行样本合同检查：

```bash
pnpm run check:samples
```

同时运行两类合同检查：

```bash
pnpm run check:all
```

## Outputs

展开后的 ADOC：

```text
build/adoc/catalog.adoc
build/adoc/books/<book-id>.adoc
```

网页：

```text
build/html/index.html
build/html/catalog.html
build/html/books/<book-id>/book.html
```

构建流程会复制本地资源、向每本书 HTML 注入书库首页链接，并运行通用工作区合同检查。样本合同检查不属于普通 `build` 路径，但属于本仓库 CI 的 `check` 路径。

## GitHub Pages

`.github/workflows/pages.yml` 会在 `main` 分支更新后构建 `build/html` 并部署到 GitHub Pages。

如果复制为自己的仓库，需要在仓库 Settings -> Pages 中确认 Pages source 使用 GitHub Actions。首次启用后，根路径会通过 `build/html/index.html` 进入 `catalog.html`。

## Adding A Book

新增一本普通书时至少执行：

1. 创建 `books/<book-id>/book.adoc`。
2. 按需要创建 `frontmatter/`、`chapters/`、`backmatter/` 和 `assets/images/`。
3. 在 `catalog.adoc` 中增加导航项。
4. 运行 `pnpm run test`。
5. 运行 `pnpm run build`。

被其他书引用的章节应写显式 anchor。只在本书内部临时存在的标题可以使用自动 ID。

## License

Apache-2.0. See [`LICENSE`](./LICENSE).

## References

- Asciidoctor Book Parts: https://docs.asciidoctor.org/asciidoc/latest/sections/parts/
- Asciidoctor Section Styles: https://docs.asciidoctor.org/asciidoc/latest/sections/styles/
- Asciidoctor Include Directive: https://docs.asciidoctor.org/asciidoc/latest/directives/include/
- Asciidoctor Document to Document Cross References: https://docs.asciidoctor.org/asciidoc/latest/macros/inter-document-xref/
