import { z } from "zod";
import { generateChartImage } from "../utils";
import {
  HeightSchema,
  OutputTypeSchema,
  ThemeSchema,
  WidthSchema,
} from "../utils/schema";

// VISALL Bar chart data schema - single data point
const dataPoint = z
  .record(z.union([z.string(), z.number()]))
  .describe(
    "A single data point object with dynamic keys representing field names and values (string, number, or date string)",
  );

// VISALL Bar chart layer encoding schema
const barEncodingSchema = z.object({
  x: z
    .string()
    .describe(
      "X-axis field name (category field), should be a string or date type field from the data",
    ),
  y: z
    .union([z.string(), z.array(z.string())])
    .describe(
      "Y-axis field name(s) (numeric field). Can be a single field name or an array of field names for multiple series",
    ),
  z: z
    .string()
    .optional()
    .describe(
      "Z-axis field name (grouping/category field), optional. Used for grouping data into multiple series",
    ),
});

export const generateBarChartTool = {
  name: "generate_bar_chart",
  description:
    "Generate a bar chart to show data for numerical comparisons among different categories, such as, comparing categorical data and for horizontal comparisons. Supports single or multiple series with flexible data field mapping.",
  inputSchema: z.object({
    data: z
      .array(dataPoint)
      .describe(
        "Array of data objects. Each object should contain fields that will be mapped to x, y, and optionally z axes. Example: [{ date: '2024-01-01', value: 100, category: 'A' }]",
      )
      .nonempty({ message: "Bar chart data cannot be empty." }),
    encoding: barEncodingSchema.describe(
      "Field mapping configuration. Specifies which data fields to use for x-axis (category), y-axis (values), and optional z-axis (grouping)",
    ),
    height: HeightSchema,
    width: WidthSchema,
    theme: ThemeSchema,
    outputType: OutputTypeSchema,
  }),
  run: async (params: {
    data: Array<Record<string, string | number>>;
    encoding: {
      x: string;
      y: string | string[];
      z?: string;
    };
    height: number;
    width: number;
    theme?: "default" | "dark";
    outputType?: "png" | "svg" | "option";
  }) => {
    const { data, encoding, height, width, theme, outputType } = params;

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
              type: "bar",
              encoding: {
                x: encoding.x,
                y: encoding.y,
                ...(encoding.z && { z: encoding.z }),
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

    // For 'png' or 'svg' output, we need to convert VISALL config to ECharts option
    // This requires understanding how VISALL generates ECharts options internally
    // For now, we'll create a basic ECharts option based on the VISALL config
    const xField = encoding.x;
    const yFields = Array.isArray(encoding.y) ? encoding.y : [encoding.y];
    const zField = encoding.z;

    // Extract unique categories for x-axis
    const categories = Array.from(new Set(data.map((d) => String(d[xField]))));

    // Build series based on y fields and optional z field
    const series: Array<{
      data: number[];
      name?: string;
      type: "bar";
    }> = [];

    if (zField) {
      // Multiple series grouped by z field
      const groups = Array.from(new Set(data.map((d) => String(d[zField]))));

      for (const group of groups) {
        for (const yField of yFields) {
          const groupData = data.filter((d) => String(d[zField]) === group);
          const values = categories.map((cat) => {
            const point = groupData.find((d) => String(d[xField]) === cat);
            return point ? Number(point[yField]) || 0 : 0;
          });

          series.push({
            data: values,
            name: yFields.length > 1 ? `${group} - ${yField}` : group,
            type: "bar",
          });
        }
      }
    } else if (yFields.length > 1) {
      // Multiple series from multiple y fields
      for (const yField of yFields) {
        const values = categories.map((cat) => {
          const point = data.find((d) => String(d[xField]) === cat);
          return point ? Number(point[yField]) || 0 : 0;
        });

        series.push({
          data: values,
          name: yField,
          type: "bar",
        });
      }
    } else {
      // Single series
      const yField = yFields[0];
      const values = categories.map((cat) => {
        const point = data.find((d) => String(d[xField]) === cat);
        return point ? Number(point[yField]) || 0 : 0;
      });

      series.push({
        data: values,
        type: "bar",
      });
    }

    const echartsOption = {
      legend:
        series.length > 1
          ? {
              left: "center" as const,
              orient: "horizontal" as const,
              bottom: 10,
            }
          : undefined,
      series,
      tooltip: {
        trigger: "axis" as const,
      },
      xAxis: {
        data: categories,
        type: "category" as const,
      },
      yAxis: {
        type: "value" as const,
      },
    };

    return await generateChartImage(
      echartsOption,
      width,
      height,
      theme,
      outputType,
      "generate_bar_chart",
    );
  },
};
