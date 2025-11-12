# 9. `src/tools/line.ts` - 标准工具范例 II

**文件路径:** `src/tools/line.ts`

**角色:** **工具范例 II (Tool Blueprint II)**

这个文件定义了 `generate_line_chart` 工具，是继 `bar.ts` 之后，第二个最能体现项目架构模式的范例。通过与 `bar.ts` 对比，我们可以清晰地看到工具的共性与个性，从而深刻理解该插件系统的设计思想。

## 与 `bar.ts` 的共性：严格遵循的模板

`line.ts` 和 `bar.ts` 在结构上几乎完全一致，这印证了项目模板化的开发模式：

1.  **统一的工具定义**: 同样导出一个包含 `name`, `description`, `inputSchema`, `run` 四个属性的 `generateLineChartTool` 对象。
2.  **复用通用 Schema**: `inputSchema` 中同样从 `src/utils/schema.ts` 导入并复用了 `TitleSchema`, `WidthSchema`, `HeightSchema` 等通用参数定义。
3.  **声明式 API**: 同样使用 `zod` 来定义输入参数的契约，并为每个字段提供了详细的 `.describe()` 描述。
4.  **委托渲染**: `run` 函数的最后一步，同样是构建完 `echartsOption` 对象后，将其和盘托出，调用 `generateChartImage` 函数来完成所有后续的渲染、存储和格式化工作。

这种高度的一致性是项目可维护性和可扩展性的基石。

## 与 `bar.ts` 的个性：特定于图表的逻辑

差异点体现了每个工具如何封装其特定于图表类型的业务逻辑。

1.  **不同的 `inputSchema`**:
    *   **数据结构**: `line.ts` 的 `data` schema 要求每个数据点包含 `time` 和 `value` 字段，而 `bar.ts` 要求 `category` 和 `value`。这反映了两种图表在语义上的区别（折线图通常用于表示时间序列，柱状图用于类别对比）。
    *   **特有参数**: `line.ts` 额外定义了 `showArea`, `smooth`, `showSymbol` 等布尔参数，这些是折线图特有的视觉样式选项（是否显示面积、是否平滑、是否显示数据点）。而 `bar.ts` 则有 `group` 参数。

2.  **不同的数据转换逻辑 (`run` 函数内)**:
    *   `line.ts` 的 `run` 函数核心逻辑是将 `data` 数组按 `group` 字段（如果存在）进行分组，然后为每个 `group` 创建一个 `type: 'line'` 的 series。
    *   它处理缺失数据的方式与 `bar.ts` 不同：对于某个时间点，如果一个 series 没有数据，它会插入 `null` (`dataMap.get(time) ?? null`)，这使得 ECharts 可以在该点断开线图，而不是像柱状图那样简单地视为 0。
    *   它将 `showArea`, `smooth`, `showSymbol` 等特有参数转换成 `echartsOption` 中 `series` 对象的具体配置，如 `areaStyle: showArea ? {} : undefined`。

3.  **不同的 `echartsOption` 配置**:
    *   虽然 `echartsOption` 的整体结构相似，但在细节上有所不同。例如，`line.ts` 在 `xAxis` 中设置了 `boundaryGap: false`，这是一个折线图常用的配置，使得图表从坐标轴的 0 点开始绘制，而不是像柱状图那样留有间隙。

## 结论

`line.ts` 的存在完美地证明了 `mcp-echarts` 架构的成功。开发者可以完全专注于特定图表的数据处理和配置逻辑，而无需关心任何通用的、重复性的任务。

**开发新工具的流程被固化为**:

1.  复制一个现有工具文件（如 `line.ts`）。
2.  修改 `name` 和 `description`。
3.  在 `inputSchema` 中定义新图表所需的数据结构和特有参数。
4.  修改 `run` 函数中的数据转换逻辑，以生成符合新图表类型的 `echartsOption`。
5.  在 `src/tools/index.ts` 中注册新工具。

整个过程清晰、高效且不易出错。
