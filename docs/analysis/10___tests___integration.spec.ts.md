# 10. `__tests__/integration.spec.ts` - 活文档与使用说明书

**文件路径:** `__tests__/integration.spec.ts`

**角色:** **活文档 / 使用说明书 (Living Documentation / User Manual)**

虽然这是一个测试文件，但它在理解项目功能和用法方面的重要性不亚于任何一个源代码文件。`codebase_investigator` 将其识别为前10个关键文件之一是完全正确的。这个文件通过一系列可执行的测试用例，从一个外部调用者的视角，展示了如何正确地（以及错误地）使用这些图表工具，以及可以期待什么样的返回结果。对于希望重写或使用这个库的开发者来说，这是最直接、最准确的“使用说明书”。

*注意：项目中还有一个 `functional.spec.ts` 文件，它包含了更重要的图像像素级对比测试，但 `integration.spec.ts` 在展示工具的 API 边界和用法方面更具代表性。*

## 核心功能：作为文档

1.  **展示基本用法**:
    *   测试用例（`it(...)`）通过直接导入工具（如 `generateBarChartTool`）并调用其 `run` 方法，清晰地展示了调用工具所需的参数结构。
    *   例如，`boundary cases` 测试套件中的用例展示了如何传入 `data`, `title`, `width`, `height` 等参数来生成一个图表。

2.  **定义 API 边界 (`error handling`)**:
    *   “error handling” 测试套件明确地定义了工具的“禁区”。它通过传入空数组、无效的 JSON、缺失字段等非法参数，并断言 `expect(error).toBeDefined()`，来告诉使用者：如果你这样调用，程序会抛出错误。这比任何文字说明都更清晰地界定了 API 的输入边界。

3.  **演示不同配置的效果 (`configuration combinations`)**:
    *   这个测试套件展示了如何使用不同的参数组合。例如，`should handle all output types for echarts` 这个测试用例，通过循环调用 `generateEChartsTool` 并传入不同的 `outputType`（`png`, `svg`, `option`），然后检查返回结果的结构，完美地演示了不同输出类型的预期结果：
        *   `png`: 返回 `type: 'image'` 和 Base64 `data`。
        *   `svg`: 返回 `type: 'text'` 和包含 `<svg>` 标签的 `text`。
        *   `option`: 返回 `type: 'text'` 和一个 JSON 字符串 `text`。

4.  **保证接口一致性 (`tool consistency`)**:
    *   `should have consistent return structure across all tools` 测试用例通过调用多个不同的图表工具，并断言它们的返回结构都符合 `ImageContent` 的规范，向使用者保证了所有工具都遵循统一的返回格式，可以被一致地处理。

5.  **提供性能基准 (`performance`)**:
    *   `should generate charts within reasonable time` 测试用例为图表生成设定了一个性能基准（例如，在5秒内完成），为重构后的性能测试提供了参考。

## 架构意义

*   **活文档 (Living Documentation)**: 与静态的 Markdown 文档不同，这些测试用例是“活”的。如果工具的 API 发生了变化（例如，参数名改变），而测试用例没有相应更新，测试就会失败。这迫使文档（测试）与代码保持同步，确保了文档的准确性。
*   **客户端视角**: 测试文件完全从客户端（调用者）的角度与工具交互，不关心工具的内部实现。这使得它成为理解“如何使用”这些工具的最佳材料。
*   **质量保证**: 除了作为文档，它本身的核心职责是保证代码质量，覆盖了错误处理、边界情况和多种配置组合，确保了工具的健壮性。

对于重写工作来说，这个文件提供了：
1.  一个清晰的、可执行的需求列表。
2.  一套现成的验收标准，重写后的代码应该能通过所有这些测试。
3.  理解和调试现有工具行为的绝佳入口。
