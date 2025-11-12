import { describe, expect, it } from "vitest";
import { generateLineChartTool } from "../../src/tools/line";
import "../utils/matcher";

describe("Line Chart Tool", () => {
  it("should generate a basic line chart", async () => {
    const result = await generateLineChartTool.run({
      data: [
        { month: "January", temperature: 12 },
        { month: "February", temperature: 15 },
        { month: "March", temperature: 18 },
        { month: "April", temperature: 22 },
        { month: "May", temperature: 26 },
        { month: "June", temperature: 30 },
      ],
      encoding: {
        x: "month",
        y: "temperature",
      },
      width: 800,
      height: 600,
      theme: "default",
    });

    await expect(result).toImageEqual("line-basic");
  });

  it("should generate a smooth line chart with area", async () => {
    const result = await generateLineChartTool.run({
      data: [
        { quarter: "Q1", sales: 150 },
        { quarter: "Q2", sales: 230 },
        { quarter: "Q3", sales: 324 },
        { quarter: "Q4", sales: 218 },
      ],
      encoding: {
        x: "quarter",
        y: "sales",
      },
      width: 800,
      height: 600,
      theme: "default",
      smooth: true,
      showArea: true,
      showSymbol: true,
    });

    await expect(result).toImageEqual("line-smooth-area");
  });

  it("should generate a multi-series line chart", async () => {
    const result = await generateLineChartTool.run({
      data: [
        { month: "Jan", productA: 120, productB: 100 },
        { month: "Feb", productA: 200, productB: 150 },
        { month: "Mar", productA: 150, productB: 180 },
        { month: "Apr", productA: 80, productB: 90 },
      ],
      encoding: {
        x: "month",
        y: ["productA", "productB"],
      },
      width: 800,
      height: 600,
      theme: "default",
      showSymbol: true,
    });

    await expect(result).toImageEqual("line-multi-series");
  });

  it("should generate a multi-series line chart with z field", async () => {
    const result = await generateLineChartTool.run({
      data: [
        { year: "2020", value: 120, channel: "Online" },
        { year: "2020", value: 100, channel: "Offline" },
        { year: "2021", value: 200, channel: "Online" },
        { year: "2021", value: 150, channel: "Offline" },
        { year: "2022", value: 250, channel: "Online" },
        { year: "2022", value: 180, channel: "Offline" },
      ],
      encoding: {
        x: "year",
        y: "value",
        z: "channel",
      },
      width: 800,
      height: 600,
      theme: "default",
      showArea: true,
    });

    await expect(result).toImageEqual("line-stacked");
  });

  it("should return VISALL config when outputType is option", async () => {
    const result = await generateLineChartTool.run({
      data: [
        { name: "光线传媒", profitability: 89.02, date: "2024-01-01" },
        { name: "光线传媒", profitability: 31.75, date: "2023-01-01" },
        { name: "光线传媒", profitability: 83.85, date: "2022-01-01" },
      ],
      encoding: {
        x: "date",
        y: "profitability",
      },
      width: 800,
      height: 600,
      outputType: "option",
    });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const config = JSON.parse(
      (result.content[0] as { type: string; text: string }).text,
    );
    expect(config).toHaveProperty("data");
    expect(config).toHaveProperty("view");
    expect(config.view.main.layers[0].type).toBe("line");
    expect(config.view.main.layers[0].encoding.x).toBe("date");
    expect(config.view.main.layers[0].encoding.y).toBe("profitability");
  });
});
