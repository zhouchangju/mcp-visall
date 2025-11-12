# 3. `src/utils/imageHandler.ts` - 输出协调器

**文件路径:** `src/utils/imageHandler.ts`

**角色:** **输出协调器 (Output Coordinator)**

如果说 `render.ts` 是生产图表的工厂，那么 `imageHandler.ts` 就是工厂的物流和包装部门。它接收来自上游工具（如 `bar.ts`）的渲染指令，调用 `render.ts` 引擎生成图表，然后根据系统配置决定如何“包装”和“交付”最终产品。它是连接“渲染”和“输出”的关键枢纽。

## 核心功能

1.  **统一的入口 (`generateChartImage`)**:
    *   这是该模块唯一的导出函数，为所有图表工具提供了一个统一的、高级的图表生成接口。工具本身不需要关心渲染的具体实现，也不需要关心最终图片是以 Base64 形式返回还是上传到对象存储。
    *   它接收 `echartsOption` 和各种渲染参数，并将其直接透传给 `renderECharts` 函数。

2.  **输出路径决策**:
    *   这是该模块最核心的逻辑。在 `renderECharts` 返回结果后，`generateChartImage` 会执行一个决策树：
        *   **分支 1: 非图片类型 (`svg` 或 `option`)**: 如果输出类型是 SVG 或 ECharts Option，结果是字符串。它会直接将这个字符串包装成 MCP SDK 标准的 `TextContent` 格式并返回。
        *   **分支 2: 图片类型 (`png`)**:
            *   **子分支 2a: MinIO 已配置**: 它会调用 `isMinIOConfigured()` 检查环境变量。如果配置存在，它会尝试调用 `storeBufferToMinIO()` 将图片 Buffer 上传到 MinIO。成功后，返回一个包含图片 URL 的 `TextContent`。
            *   **子分支 2b: MinIO 上传失败或未配置**: 如果 MinIO 未配置，或者上传过程中出现错误，它会优雅地降级（Fallback）到 Base64 方案。它将图片 Buffer 转换为 Base64 编码的字符串，并将其包装在一个 `ImageContent` 对象中返回。

3.  **格式化为 MCP 响应**:
    *   无论最终的交付物是 URL 还是 Base64 数据，`imageHandler` 都负责将其构造成 MCP SDK（`@modelcontextprotocol/sdk`）所期望的标准 `content` 数组格式。这确保了所有工具的返回值都符合协议规范。

4.  **调试与错误处理**:
    *   通过检查 `process.env.DEBUG_MCP_ECHARTS` 环境变量，该模块可以输出详细的调试日志，包括正在生成的图表参数、最终的输出类型和大小/URL，以及任何发生的错误。
    *   它包裹了对 `renderECharts` 的调用，并提供了统一的错误捕获和抛出机制，使得上层调用者可以更容易地处理渲染失败的情况。

## 关键符号/函数

*   `generateChartImage(echartsOption, ...)`:
    *   **功能**: 一个高级的、与业务逻辑紧密集成的函数，负责端到端地处理从“给我一个图表定义”到“给我一个符合 MCP 规范的响应”的全过程。
    *   **返回值**: `Promise<ImageHandlerResult>`，其中 `ImageHandlerResult` 是一个包含了 `content` 数组的对象，该数组的成员是 `ImageContent` 或 `TextContent`。

## 与其他模块的交互

*   **`src/utils/render.ts` (下游)**:
    *   `generateChartImage` 是 `renderECharts` 函数的直接调用者。它将渲染所需的全部参数传递给 `renderECharts`，并等待其返回渲染结果（Buffer 或 string）。

*   **`src/utils/minio.ts` (下游)**:
    *   当需要将图片上传时，`generateChartImage` 会调用 `isMinIOConfigured` 和 `storeBufferToMinIO` 这两个从 `minio.ts` 导入的函数。

*   **`src/tools/*.ts` (上游)**:
    *   所有的图表工具文件（如 `bar.ts`, `line.ts` 等）都是 `generateChartImage` 的调用者。工具的 `run` 函数在构建好 `echartsOption` 后，就将所有后续工作委托给 `generateChartImage`。

*   **`@modelcontextprotocol/sdk`**:
    *   该模块的输出类型（`ImageContent`, `TextContent`）和最终返回结构都严格遵循 MCP SDK 的定义。

## ASCII Art: 决策流程

```
+-----------------------------+
| Tool (e.g., bar.ts)         |
| Calls generateChartImage()  |
+--------------+--------------+
               |
               v
+--------------+--------------+
|   generateChartImage()      |
|   (in imageHandler.ts)      |
+--------------+--------------+
               |
               | Calls renderECharts()
               v
+--------------+--------------+
|      render.ts              |
| Returns Buffer or String    |
+--------------+--------------+
               |
               v
+--------------+--------------+
|  Is result a String (SVG)?  |
+--------------+--------------+
       |                      |
       | Yes                  | No (it's a Buffer)
       v                      v
+--------------+--------------+ +-----------------------------+
| Wrap String in TextContent  | | Is MinIO Configured?        |
+--------------+--------------+ +--------------+--------------+
               |                      |                      |
               |                      | Yes                  | No
               |                      v                      v
               |              +-------+-------+      +-------+-------+
               |              | storeToMinIO()|      | toBase64()    |
               |              +-------+-------+      +-------+-------+
               |                      |                      |
               |                      | On Success           |
               |                      v                      v
               |              +-------+-------+      +-------+-------+
               |              | Wrap URL in   |      | Wrap Base64 in|
               |              | TextContent   |      | ImageContent  |
               |              +-------+-------+      +-------+-------+
               |                      |                      |
               |                      | On Failure (Fallback) |
               |                      +---------------------->+
               |                                             |
               +----------------------+----------------------+
                                      |
                                      v
+-------------------------------------+-------------------------------------+
|                                Returns MCP Content                          |
|                                to Tool (bar.ts)                             |
+-----------------------------------------------------------------------------+
```
