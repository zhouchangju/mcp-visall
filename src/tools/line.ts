import { z } from "zod";
import { generateChartImage } from "../utils";
import {
  HeightSchema,
  OutputTypeSchema,
  ThemeSchema,
  WidthSchema,
} from "../utils/schema";

// VISALL Line chart data schema - single data point
const dataPoint = z
  .record(z.union([z.string(), z.number()]))
  .describe(
    "A single data point object with dynamic keys representing field names and values (string, number, or date string)",
  );

// VISALL Line chart layer encoding schema
const lineEncodingSchema = z.object({
  x: z
    .string()
    .describe(
      "X-axis field name (time/date field), should be a date type field from the data",
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

export const generateLineChartTool = {
  name: "generate_line_chart",
  description:
    "Generate a line chart to show trends over time. Supports single or multiple series with flexible data field mapping.",
  inputSchema: z.object({
    data: z
      .array(dataPoint)
      .describe(
        "Array of data objects. Each object should contain fields that will be mapped to x, y, and optionally z axes. Example: [{ date: '2024-01-01', value: 100, category: 'A' }]",
      )
      .nonempty({ message: "Line chart data cannot be empty." }),
    encoding: lineEncodingSchema.describe(
      "Field mapping configuration. Specifies which data fields to use for x-axis (time/date), y-axis (values), and optional z-axis (grouping)",
    ),
    height: HeightSchema,
    width: WidthSchema,
    theme: ThemeSchema,
    smooth: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to use a smooth curve. Default is false."),
    showArea: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to fill the area under the line. Default is false."),
    showSymbol: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether to show symbols on data points. Default is true."),
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
    smooth?: boolean;
    showArea?: boolean;
    showSymbol?: boolean;
    outputType?: "png" | "svg" | "option";
  }) => {
    const {
      data,
      encoding,
      height,
      width,
      theme,
      smooth = false,
      showArea = false,
      showSymbol = true,
      outputType,
    } = params;

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
              type: "line",
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

    // For 'png' or 'svg' output, convert VISALL config to ECharts option
    const xField = encoding.x;
    const yFields = Array.isArray(encoding.y) ? encoding.y : [encoding.y];
    const zField = encoding.z;

    // Extract unique time points for x-axis and sort them
    const timePoints = Array.from(
      new Set(data.map((d) => String(d[xField]))),
    ).sort();

    // Build series based on y fields and optional z field
    const series: Array<{
      data: (number | null)[];
      name?: string;
      type: "line";
      smooth?: boolean;
      areaStyle?: Record<string, never>;
      showSymbol?: boolean;
    }> = [];

    if (zField) {
      // Multiple series grouped by z field
      const groups = Array.from(new Set(data.map((d) => String(d[zField]))));

      for (const group of groups) {
        for (const yField of yFields) {
          const groupData = data.filter((d) => String(d[zField]) === group);
          const values = timePoints.map((time) => {
            const point = groupData.find((d) => String(d[xField]) === time);
            return point ? Number(point[yField]) || null : null;
          });

          series.push({
            data: values,
            name: yFields.length > 1 ? `${group} - ${yField}` : group,
            type: "line",
            smooth,
            areaStyle: showArea ? {} : undefined,
            showSymbol,
          });
        }
      }
    } else if (yFields.length > 1) {
      // Multiple series from multiple y fields
      for (const yField of yFields) {
        const values = timePoints.map((time) => {
          const point = data.find((d) => String(d[xField]) === time);
          return point ? Number(point[yField]) || null : null;
        });

        series.push({
          data: values,
          name: yField,
          type: "line",
          smooth,
          areaStyle: showArea ? {} : undefined,
          showSymbol,
        });
      }
    } else {
      // Single series
      const yField = yFields[0];
      const values = timePoints.map((time) => {
        const point = data.find((d) => String(d[xField]) === time);
        return point ? Number(point[yField]) || null : null;
      });

      series.push({
        data: values,
        type: "line",
        smooth,
        areaStyle: showArea ? {} : undefined,
        showSymbol,
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
        boundaryGap: false,
        data: timePoints,
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
      "generate_line_chart",
    );
  },
};
