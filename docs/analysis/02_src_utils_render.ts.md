# 2. `src/utils/render.ts` - 核心渲染引擎

**文件路径:** `src/utils/render.ts`

**角色:** **引擎 (Engine)**

这是 `mcp-echarts` 项目的心脏。此文件的核心职责是将一个 JSON 格式的 ECharts `Option` 对象转换成一个真正的图形文件（PNG 或 SVG）。它通过在服务器端模拟浏览器环境中的 Canvas 或 SVG 渲染，完全摆脱了对 Puppeteer、Playwright 等重量级无头浏览器的依赖，实现了轻量、高效的服务端图表生成。

## 核心功能

1.  **服务端 Canvas 渲染 (PNG)**:
    *   当请求的输出类型为 `png` 时，它使用 `@napi-rs/canvas` 库的 `createCanvas` 方法在内存中创建一个虚拟的 Canvas 画布。
    *   它将这个 Canvas 实例传递给 ECharts 的 `init` 方法。ECharts 会像在浏览器中一样，在这个画布上进行绘制。
    *   为了支持高清渲染（HiDPI），`devicePixelRatio` 被硬编码为 `3`，这意味着画布的实际像素密度是其尺寸的3倍，生成的图片更清晰。
    *   绘制完成后，调用 `canvas.toBuffer("image/png")` 方法，将画布内容转换成 PNG 格式的二进制 `Buffer`。

2.  **服务端 SVG 渲染**:
    *   当请求的输出类型为 `svg` 时，它以 `ssr` (Server-Side Rendering) 模式初始化 ECharts，并指定渲染器为 `'svg'`。
    *   在这种模式下，ECharts 不会进行实际的绘制，而是直接计算出描述图表的 SVG 矢量图形代码。
    *   调用 `chart.renderToSVGString()` 方法，直接返回一个包含 `<svg>` 标签的完整 XML 字符串。

3.  **自定义字体加载**:
    *   为了保证图表在不同环境下（特别是无字体的 Docker 容器）渲染效果的一致性，并支持中文显示，该文件在模块加载时就通过 `@napi-rs/canvas` 的 `GlobalFonts.registerFromPath` 方法，从 `fonts/` 目录加载并注册了一个全局字体（Alibaba PuHuiTi）。

4.  **资源管理**:
    *   在每次渲染任务（无论是 PNG 还是 SVG）完成后，都会显式调用 `chart.dispose()` 方法。这是一个非常重要的步骤，它会释放 ECharts 实例所占用的内存，防止因大量请求导致的内存泄漏。

## 关键符号/函数

*   `renderECharts(echartsOption, width, height, theme, outputType)`:
    *   **功能**: 这是该模块唯一的导出函数，是一个纯函数，接收图表配置和参数，返回渲染结果。它不处理任何与文件存储或网络请求相关的逻辑。
    *   **参数**:
        *   `echartsOption`: 核心的图表定义对象。
        *   `width`, `height`: 生成图片的尺寸。
        *   `theme`: ECharts 主题。
        *   `outputType`: 决定了渲染路径是 `png` 还是 `svg`。
    *   **返回值**: 根据 `outputType`，返回一个 `Buffer` (对于 PNG) 或一个 `string` (对于 SVG)。

## 与其他模块的交互

*   **`@napi-rs/canvas`**:
    *   这是实现服务端 Canvas 渲染的基石。`renderECharts` 深度依赖它来创建画布、加载字体和生成图片 Buffer。

*   **`echarts`**:
    *   此模块是 ECharts 库的直接使用者。它调用 `echarts.init` 来初始化图表实例，并使用 `chart.setOption` 来应用配置。

*   **`src/utils/imageHandler.ts`**:
    *   `imageHandler.ts` 是 `render.ts` 的直接上游调用者。它负责准备好 `echartsOption` 和其他参数，然后调用 `renderECharts` 来执行真正的渲染工作。获取渲染结果（Buffer 或 string）后，`imageHandler` 再进行后续处理（如 Base64 编码或上传到 MinIO）。

## ASCII Art: 渲染流程

```
+--------------------------------+
| imageHandler.ts                |
| Calls renderECharts(...)       |
+---------------+----------------+
                |
                v
+---------------+----------------+
| renderECharts(..., outputType) |
| in render.ts                   |
+---------------+----------------+
                |
+---------------v----------------+
|  Is outputType === 'svg'?      |
+---------------+----------------+
       |                        |
       | Yes                    | No (it's 'png')
       v                        v
+---------------+----------------+ +--------------------------------+
| echarts.init(null, {ssr:true}) | | const canvas = createCanvas()  |
+---------------+----------------+ +--------------------------------+
                |                                  |
                v                                  v
+---------------+----------------+ +--------------------------------+
| chart.renderToSVGString()      | | echarts.init(canvas)           |
+---------------+----------------+ +--------------------------------+
                |                                  |
                v                                  v
+---------------+----------------+ +--------------------------------+
| Returns SVG string             | | const buffer = canvas.toBuffer() |
+--------------------------------+ +--------------------------------+
                |                                  |
                +----------------+-----------------+
                                 |
                                 v
+--------------------------------+
| chart.dispose()                |  // (Crucial for memory management)
+--------------------------------+
                                 |
                                 v
+--------------------------------+
| Returns Buffer or String       |
| to imageHandler.ts             |
+--------------------------------+
```
