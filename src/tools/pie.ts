import { z } from "zod";
import { generateChartImage } from "../utils";
import {
  HeightSchema,
  OutputTypeSchema,
  ThemeSchema,
  TitleSchema,
  WidthSchema,
} from "../utils/schema";

// VISALL Pie chart data schema - single data point
const dataPoint = z
  .record(z.union([z.string(), z.number()]))
  .describe(
    "A single data point object with dynamic keys representing field names and values (string, number)",
  );

// VISALL Pie chart layer encoding schema
const pieEncodingSchema = z.object({
  x: z
    .string()
    .describe(
      "X-axis field name (category field), should be a string field from the data representing pie slice names",
    ),
  y: z
    .string()
    .describe(
      "Y-axis field name (value field), should be a numeric field from the data representing pie slice values",
    ),
});

export const generatePieChartTool = {
  name: "generate_pie_chart",
  description:
    "Generate a pie chart to show the proportion of parts, such as market share and budget allocation. Supports up to 10 data points.",
  inputSchema: z.object({
    data: z
      .array(dataPoint)
      .describe(
        "Array of data objects. Each object should contain fields that will be mapped to x and y axes. Example: [{ name: 'Product A', value: 30 }, { name: 'Product B', value: 25 }]",
      )
      .min(1, "Pie chart requires at least 1 data point.")
      .max(10, "Pie chart supports maximum 10 data points.")
      .refine((arr) => arr.length > 0, "Pie chart data cannot be empty."),
    encoding: pieEncodingSchema.describe(
      "Field mapping configuration. Specifies which data fields to use for x-axis (categories) and y-axis (values)",
    ),
    height: HeightSchema,
    width: WidthSchema,
    theme: ThemeSchema,
    title: TitleSchema,
    innerRadius: z
      .number()
      .min(0, "Inner radius cannot be negative.")
      .max(0.9, "Inner radius cannot be larger than 0.9.")
      .default(0)
      .describe(
        "Set the inner radius of pie chart (0-0.9). Set to 0 for standard pie chart, or value like 0.6 for donut chart.",
      ),
    outputType: OutputTypeSchema,
  }),
  run: async (params: {
    data: Array<Record<string, string | number>>;
    encoding: {
      x: string;
      y: string;
    };
    height: number;
    width: number;
    theme?: "default" | "dark";
    title?: string;
    innerRadius?: number;
    outputType?: "png" | "svg" | "option";
  }) => {
    const {
      data,
      encoding,
      height,
      width,
      theme,
      title,
      innerRadius = 0,
      outputType,
    } = params;

    // Validate data limits
    if (data.length === 0) {
      throw new Error("Pie chart requires at least 1 data point.");
    }

    if (data.length > 10) {
      throw new Error(
        `Pie chart supports maximum 10 data points. Current data has ${data.length} items.`,
      );
    }

    // Build VISALL component configuration
    const visallConfig = {
      data: [
        {
          values: data,
        },
      ],
      view: {
        main: {
          layers: [
            {
              type: "pie",
              encoding: {
                x: encoding.x,
                y: encoding.y,
              },
            },
          ],
        },
      },
    };

    // If outputType is 'option', return the VISALL config as JSON string
    if (outputType === "option") {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(visallConfig, null, 2),
          },
        ],
      };
    }

    // For 'png' or 'svg' output, convert VISALL config to ECharts option
    const xField = encoding.x;
    const yField = encoding.y;

    // Transform data for ECharts
    const pieData = data.map((item) => ({
      name: String(item[xField]),
      value: Number(item[yField]) || 0,
    }));

    const echartsOption = {
      legend: {
        left: "center" as const,
        orient: "horizontal" as const,
        top: title ? ("bottom" as const) : ("center" as const),
      },
      series: [
        {
          data: pieData,
          radius: innerRadius > 0 ? [`${innerRadius * 100}%`, "70%"] : "70%",
          type: "pie" as const,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
      title: title
        ? {
            left: "center" as const,
            text: title,
            bottom: "85%",
          }
        : undefined,
      tooltip: {
        trigger: "item" as const,
        formatter: "{a} <br/>{b}: {c} ({d}%)",
      },
    };

    return await generateChartImage(
      echartsOption,
      width,
      height,
      theme,
      outputType,
      "generate_pie_chart",
    );
  },
};
