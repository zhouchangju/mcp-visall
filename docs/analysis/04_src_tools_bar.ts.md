# 4. `src/tools/bar.ts` - 标准工具范例

**文件路径:** `src/tools/bar.ts`

**角色:** **工具范例 (Tool Blueprint)**

这个文件是理解 `mcp-echarts` 插件化架构的最佳范例。它定义了一个名为 `generate_bar_chart` 的独立功能单元（“工具”），该工具负责接收特定格式的数据，并将其转换为柱状图。所有其他图表工具（如 `line.ts`, `pie.ts` 等）都遵循与此文件完全相同的结构和逻辑。

## 核心功能

1.  **定义工具契约 (`generateBarChartTool`)**:
    *   导出一个名为 `generateBarChartTool` 的常量对象，这个对象就是工具的完整定义。
    *   `name`: `generate_bar_chart`，这是工具的唯一标识符，用于在 MCP 服务器中注册和被外部调用。
    *   `description`: 一段自然语言描述，解释该工具的用途。这对于 AI Agent 或其他使用者理解工具功能至关重要。
    *   `inputSchema`: 使用 `zod` 库定义了此工具期望的输入参数的精确格式、类型和约束。这是工具的“API 契约”，MCP 服务器会用它来自动验证传入的请求。
    *   `run`: 一个 `async` 函数，是工具的核心执行逻辑。

2.  **输入参数 Schema (`inputSchema`)**:
    *   它通过 `z.object({...})` 定义了所有可接受的参数。
    *   它大量复用了来自 `src/utils/schema.ts` 的公共 Schema（如 `TitleSchema`, `WidthSchema`），确保了所有工具在通用参数上的一致性。
    *   它也定义了自身特有的数据结构，如 `data` 数组的 schema，清晰地描述了生成柱状图所需的数据点格式（`category`, `value`, `group`）。
    *   通过 `.describe()` 为每个字段添加了注释，这同样是为 AI Agent 提供上下文信息的重要手段。

3.  **执行逻辑 (`run` function)**:
    *   `run` 函数接收一个经过 `inputSchema` 验证和解析后的 `params` 对象。
    *   **数据转换**: 这是 `run` 函数最核心的职责。它根据传入的 `data` 数组以及 `group`、`stack` 等参数，将原始数据处理并重组成 ECharts 所期望的 `series` 和 `categories` 格式。它能够处理单系列、分组、堆叠等多种柱状图模式。
    *   **构建 Option 对象**: 在数据转换完成后，它会构建一个完整的 `echartsOption` 对象。这个对象是 ECharts 的“渲染蓝图”，详细描述了图表的标题、图例、坐标轴、系列、提示框等所有视觉元素。
    *   **委托渲染**: `run` 函数的最后一步，是调用从 `../utils`（即 `imageHandler.ts`）导入的 `generateChartImage` 函数。它将构建好的 `echartsOption` 和其他参数（如 `width`, `height`）传递给 `imageHandler`，然后将 `imageHandler` 的返回结果直接 `return`。工具本身不关心渲染或输出的任何细节。

## 结构模式：一个清晰的模板

这个文件完美地展示了“关注点分离”原则：

*   **`bar.ts` (The Tool)**: 只关心一件事——如何将特定于柱状图的数据和业务逻辑，转换成一个通用的、声明式的 ECharts `Option` 对象。
*   **`imageHandler.ts` (The Coordinator)**: 接收 `Option` 对象，处理渲染、存储和响应格式化。
*   **`render.ts` (The Engine)**: 接收 `Option` 对象，执行底层的图形渲染。

这个模式使得添加一个新的图表类型（例如，一个`k-line`图）变得非常简单：开发者只需要复制 `bar.ts`，修改 `name`、`description`、`inputSchema` 以及 `run` 函数中的数据转换逻辑即可，完全不需要触碰任何渲染或服务器相关的代码。

## 与其他模块的交互

*   **`src/utils/index.ts` (下游)**:
    *   `run` 函数的终点是调用 `generateChartImage`，将渲染任务委托出去。

*   **`src/utils/schema.ts` (下游)**:
    *   `inputSchema` 大量依赖此文件来复用通用的参数定义。

*   **`src/tools/index.ts` (上游)**:
    *   `generateBarChartTool` 对象被导出后，会被 `src/tools/index.ts` 导入并添加到一个统一的 `tools` 数组中，最终被 `src/index.ts` 的服务器工厂函数所使用。

*   **`zod`**:
    *   深度使用 `zod` 来进行声明式的数据验证和类型推断。

## 配置灵活度分析

`generate_bar_chart` 工具提供了一个高度封装和简化的接口，这在带来易用性的同时，也意味着它在配置灵活性上是**有限的**。

此工具并未暴露 ECharts `Option` 的所有配置项。开发者只能通过 `inputSchema` 中定义的参数（如 `title`, `stack`）来影响图表的最终样式。对于需要微调图例位置、自定义 `tooltip` 格式、添加 `dataZoom` 或使用 ECharts 其他高级功能的用户来说，`generate_bar_chart` 工具无法满足需求。

**替代方案：`generateEChartsTool`**

为了解决这一问题，系统提供了 `generateEChartsTool` 工具作为“后门”。该工具允许用户直接提供一个完整的、原生的 ECharts `Option` JSON 字符串作为输入。

因此，当 `generate_bar_chart` 无法满足您的自定义需求时，正确的做法是：

1.  在您的代码中自行构建一个完整的 ECharts `Option` 对象。
2.  将其序列化为 JSON 字符串。
3.  调用 `generateEChartsTool` 并将此 JSON 字符串作为参数传入。

这种设计将“易用性”和“灵活性”这两种需求分离到不同的工具中，使得系统既能满足快速出图的简单场景，也能应对复杂、精细的定制化需求。
