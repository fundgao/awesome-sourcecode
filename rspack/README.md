## Rspack 比 webpack 快得益于如下几方面：

- **Rust 语言优势:** Rspack 使用 Rust 语言编写， 得益于 Rust 的高性能编译器支持， Rust 编译生成的 Native Code 通常比 JavaScript 性能更为高效。
- **高度并行的架构:** webpack 受限于 JavaScript 对多线程的羸弱支持，导致其很难进行高度的并行化计算，而得益于 Rust 语言的并行化的良好支持， Rspack 采用了高度并行化的架构，如模块图生成，代码生成等阶段，都是**采用多线程并行执行**，这使得其编译性能随着 CPU 核心数的增长而增长，充分挖掘 CPU 的多核优势。
- **内置大部分的功能:** 事实上 webpack 本身的性能足够高效，但是因为 webpack 本身内置了较少的功能，这使得我们在使用 webpack 做现代 Web App 开发时，通常需要配合很多的 plugin 和 loader 进行使用，而这些 loader 和 plugin 往往是性能的瓶颈，而 Rspack 虽然支持 loader 和 plugin，但是保证绝大部分常用功能都内置在 Rspack 内，从而减小 JS plugin | loader 导致的低性能和通信开销问题。
- **增量编译:** 尽管 Rspack 的全量编译足够高效，但是当项目庞大时，全量的编译仍然难以满足 HMR 的性能要求，因此在 HMR 阶段，我们采用的是更为高效的增量编译策略，从而保证，无论你的项目多大，其 HMR 的开销总是控制在合理范围内。

## Rspack 和 Vite 的区别

Vite 提供了很好的开发者体验，但 Vite 在生产构建中依赖了 Rollup ，因此与其他基于 JavaScript 的工具链一样，面临着生产环境的构建性能问题。

另外，Rollup 相较于 webpack 做了一些平衡取舍，在这里同样适用。比如，Rollup 缺失了 webpack 对于拆包的灵活性，即缺失了 `optimization.splitChunks` 提供的很多功能。

## Rspack 和 Turbopack 的区别#

Rspack 和 turbopack 都是基于 Rust 实现的 bundler，且都发挥了 Rust 语言的优势。

与 turbopack 不同的是，Rspack 选择了对 webpack 生态兼容的路线，一方面，这些兼容可能会带来一定的性能开销，但在实际的业务落地中，我们发现对于大部分的应用来说，这些性能开销是可以接受的，另一方面，这些兼容也使得 Rspack 可以更好地与上层的框架和生态进行集成，能够实现业务的渐进式迁移。

## 资源模块

资源（如：图片、字体、视频等）是 Rspack 的一等公民，这意味着你不需要任何的 Loader 来处理这些内容。 资源和其他的模块类型不同，它们通常是独立存在的，因此资源会以模块的粒度做最终的生成。

### 支持的 Asset Module 类型

- `asset/inline` 替换 `url-loader`: 将资源转换为 DataURI，使用 Base64 编码，暂不支持编码配置。
- `asset/resource` 替换 `file-loader`: 将资源转换为单独的文件，并且导出产物地址。
- `asset`:
  - 根据条件（如：资源的体积）自动选择 `asset/inline` 或 `asset/resource`。
  - 默认如果资源体积小于等于 8096 bytes，则使用 `asset/inline` 策略，否则使用 `asset/resource` 策略。
- `asset/source` 替换 `raw-loader`: 将资源文件转为字符串导出。

### 使用 Optimizer Loader 进行优化图片

- `loader: ImageMinimizerPlugin.loader,`

### 内置 lightningcss-loader

- `builtin:lightningcss-loader` 使用 Rspack 内置的 lightningcss 处理 CSS，可以替代 `postcss-loader` 中的降级功能，让 CSS 编译更快。

### 内置 swc-loader

- `builtin:swc-loader` 是 `swc-loader` 的 Rust 版本，旨在提供更优的性能，Loader 的配置与 JS 版本的 `swc-loader` 保持对齐。
- 对 ts 文件进行转译
- 对 jsx 文件进行转译

### HMR

Rspack 在 dev 模式下默认开启了 HMR，你也可以在 `rspack.config.js` 中配置 `devServer.hot` 选项来关闭 HMR。

### Proxy

Rspack 内置了一个简单的代理服务器，你可以在 rspack.config.js 中配置 devServer.proxy 选项来开启代理服务器。

### 内置 HtmlRspackPlugin

- `HtmlRspackPlugin` 是以 Rust 实现的高性能 HTML 插件，它的构建性能显著优于 `HtmlWebpackPlugin` 插件，尤其是在构建大量 HTML 文件的场景下。

## 优化

### 包分析

Rspack CLI 支持使用 --analyze 选项进行包体积分析

- `rspack build --analyze`

### 代码分割 Chunk

```
entry: {
    index: './src/index.js',
    another: './src/another-module.js',
},
```

### 生产优化 SourceMap

生产环境下建议开启 SourceMap，以便于调试，但切记不要将 SourceMap 同产物一起上传到线上。

### 代码压缩

在执行生产构建时，Rspack 默认使用内置的压缩器对 JavaScript 和 CSS 代码进行压缩，你可以使用 `SwcJsMinimizerRspackPlugin` 和 `LightningCssMinimizerRspackPlugin` 来进行配置。

### 性能分析

尽管 Rspack 本身提供的构建性能已经足够优秀，但在 Rspack 中使用一些 JavaScript 编写的 loaders 和 plugins 时，它们可能会导致整体的构建性能劣化，尤其是在大型项目中。

### Tree Shaking

Rspack 支持 tree shaking 功能，这是一个在 JavaScript 生态中广泛使用的术语，主要用于去除未被访问的代码，俗称“死代码”。当一个模块的某些导出未被使用且不存在副作用时，这部分代码就可以被安全地删除，以减小最终产物的体积。

在设置 mode 为 production 后，Rspack 会默认启用一系列与 tree shaking 相关的优化措施。

### 使用 Rsdoctor

Rsdoctor 是一个针对 Rspack 的构建分析器，可以直观地展示构建过程，例如编译时间、编译前后的代码变化、模块引用关系、重复模块等。如果您需要排查构建产物或构建时编译问题，可以使用 Rsdoctor。

- `npm add @rsdoctor/rspack-plugin -D`

