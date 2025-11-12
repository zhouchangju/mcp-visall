# 5. `src/tools/index.ts` - 工具注册中心

**文件路径:** `src/tools/index.ts`

**角色:** **工具注册中心 (Tool Registry)**

这是一个结构简单但至关重要的文件。它的唯一职责是作为所有独立图表工具的“集散地”。它从 `src/tools` 目录下的各个工具文件（`bar.ts`, `line.ts` 等）中导入工具定义，并将它们全部聚合到一个名为 `tools` 的数组中。

## 核心功能

1.  **聚合 (Aggregation)**:
    *   通过一系列的 `import` 语句，它收集了所有图表工具的定义对象（如 `generateBarChartTool`, `generateLineChartTool`）。
    *   它将所有这些导入的对象放入一个名为 `tools` 的数组中。

2.  **导出 (Exportation)**:
    *   它将 `tools` 数组作为主要的导出内容。这个数组是提供给 `src/index.ts` 中的服务器工厂函数 `createEChartsServer` 使用的唯一来源。
    *   为了方便单元测试或集成测试，它也重新导出了所有单个的工具定义。这使得测试代码可以直接导入某个特定的工具进行测试，而无需通过服务器。

## 架构意义

这个文件是 `mcp-echarts` 插件化和可扩展架构的核心体现。

*   **解耦**: `src/index.ts` 中的服务器启动逻辑完全不需要知道存在哪些具体的图表工具。它只依赖于 `src/tools/index.ts` 提供的这个 `tools` 数组。这实现了服务器与工具集的完全解耦。
*   **可扩展性**: 当需要向系统中添加一个新的图表类型时，开发者只需要：
    1.  在 `src/tools` 目录下创建一个新的工具文件（例如 `my_new_chart.ts`）。
    2.  在 `src/tools/index.ts` 中添加两行代码：一行 `import` 和一行在 `tools` 数组中的引用。
    *   完成这两步后，新的图表工具就会在下次服务器启动时被自动发现、注册和提供服务，无需对任何核心服务器逻辑进行修改。

## 与其他模块的交互

*   **`src/tools/*.ts` (下游)**:
    *   这是所有单个工具文件的消费者。它导入它们的定义。

*   **`src/index.ts` (上游)**:
    *   这是 `tools` 数组的唯一消费者。`createEChartsServer` 函数导入并遍历这个数组来注册所有工具。

## ASCII Art: 聚合流程

```
+------------------------+
| src/tools/bar.ts       |
| exports                |
| generateBarChartTool   |
+------------------------+
        |
+------------------------+
| src/tools/line.ts      |
| exports                |
| generateLineChartTool  |
+------------------------+
        |
+------------------------+
| src/tools/pie.ts       |
| exports                |
| generatePieChartTool   |
+------------------------+
        |
        v
+------------------------------------------------+
|               src/tools/index.ts               |
|                                                |
|  1. Imports all tool objects                   |
|  2. Puts them into a single `tools` array      |
|                                                |
|  `export const tools = [ ... ];`               |
|                                                |
+-----------------------+------------------------+
                        |
                        | exports `tools` array
                        v
+-----------------------+------------------------+
|                    src/index.ts                |
|                                                |
|  `import { tools } from './tools';`            |
|  `for (const tool of tools) { ... }`           |
|                                                |
+------------------------------------------------+
```
