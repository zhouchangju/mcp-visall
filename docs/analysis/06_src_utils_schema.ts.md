# 6. `src/utils/schema.ts` - API 契约

**文件路径:** `src/utils/schema.ts`

**角色:** **API 契约 (API Contract)**

这个文件为整个 `mcp-echarts` 应用的所有工具定义了一套统一、可复用的“API 契约”。通过使用 `zod` 库，它将所有图表工具共有的输入参数（如标题、宽度、高度、主题等）抽象成了标准化的、可复用的 Schema。

## 核心功能

1.  **定义通用参数 Schema**:
    *   为每个通用参数（如 `title`, `width`, `height`, `theme`, `outputType`）创建了一个独立的、可导出的 `zod` Schema。
    *   **`TitleSchema`**: 定义图表标题，一个可选的字符串。
    *   **`WidthSchema` / `HeightSchema`**: 定义图表宽高，是可选的正整数，并带有默认值（800 / 600）。
    *   **`ThemeSchema`**: 定义图表主题，是一个枚举类型（`default` 或 `dark`），有默认值。
    *   **`OutputTypeSchema`**: 定义输出类型，是一个枚举类型（`png`, `svg`, `option`），有默认值。
    *   **`AxisXTitleSchema` / `AxisYTitleSchema`**: 定义坐标轴标题。

2.  **提供默认值和描述**:
    *   每个 Schema 都精心配置了 `.optional()` 和 `.default()`，这不仅为参数提供了合理的默认值，还简化了上游工具的使用——调用者可以省略这些参数，系统会自动应用默认配置。
    *   每个 Schema 都使用了 `.describe()` 方法添加了清晰的自然语言描述。这个描述是 `zod` Schema 的一个重要部分，它会被用于自动生成文档，或在运行时提供给 AI Agent，帮助其理解每个参数的含义和用途。

3.  **确保一致性**:
    *   这是该文件的核心价值。通过让所有工具（`bar.ts`, `line.ts` 等）从这个中心文件导入这些基础 Schema，而不是在各自文件中重复定义，保证了整个系统的 API 在通用参数上是完全一致的。例如，所有工具的 `width` 参数都具有相同的类型、约束和默认值。

4.  **JSON Schema 转换 (Utility)**:
    *   文件中还包含一个 `zodToJsonSchema` 的辅助函数，它包装了 `zod-to-json-schema` 库。虽然在当前运行时代码中没有被直接使用，但它的存在表明了项目有将 Zod Schema 转换为标准 JSON Schema 的能力，这对于与其他系统（如前端表单生成器、文档生成工具）集成非常有用。

## 架构意义

*   **代码复用 (DRY - Don't Repeat Yourself)**: 避免了在每个工具文件中重复定义相同的参数，减少了代码冗余。
*   **可维护性**: 当需要修改一个通用参数的行为时（例如，修改 `width` 的默认值或添加一个新的 `theme`），只需要在这个文件中修改一次，所有工具就会自动继承这个变更。这极大地提高了项目的可维护性。
*   **API 一致性**: 保证了所有工具都提供统一、可预测的接口，降低了客户端（无论是人类开发者还是 AI Agent）的学习成本和使用难度。
*   **自文档化**: 通过 `.describe()` 提供的描述，代码本身在某种程度上实现了自文档化。

## 与其他模块的交互

*   **`src/tools/*.ts` (上游)**:
    *   所有位于 `src/tools` 目录下的工具文件都是此文件的主要消费者。它们通过 `import` 语句导入这些 Schema，并在各自的 `inputSchema` 定义中像积木一样组合使用它们。

*   **`zod`**:
    *   此文件完全基于 `zod` 库构建。

## 示例：Schema 的使用

在 `src/tools/bar.ts` 中，`inputSchema` 的定义清晰地展示了 `schema.ts` 的作用：

```typescript
// in src/tools/bar.ts
import {
  TitleSchema,
  WidthSchema,
  HeightSchema,
  // ... and others
} from "../utils/schema";

export const generateBarChartTool = {
  // ...
  inputSchema: z.object({
    // ... other specific properties
    data: z.array(...),

    // Re-used schemas from src/utils/schema.ts
    height: HeightSchema,
    theme: ThemeSchema,
    title: TitleSchema,
    width: WidthSchema,
    outputType: OutputTypeSchema,
  }),
  // ...
};
```
