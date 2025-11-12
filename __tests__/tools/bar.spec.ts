import { describe, expect, it } from "vitest";
import { generateBarChartTool } from "../../src/tools/bar";
import "../utils/matcher";

describe("Bar Chart Tool", () => {
  it("should generate a basic bar chart", async () => {
    const result = await generateBarChartTool.run({
      data: [
        { category: "Shirt", value: 120 },
        { category: "Sweater", value: 200 },
        { category: "Chiffon Top", value: 150 },
        { category: "Pants", value: 80 },
        { category: "High Heels", value: 70 },
        { category: "Socks", value: 110 },
      ],
      encoding: {
        x: "category",
        y: "value",
      },
      width: 800,
      height: 600,
      theme: "default",
    });

    await expect(result).toImageEqual("bar-basic");
  });

  it("should generate a grouped bar chart", async () => {
    const result = await generateBarChartTool.run({
      data: [
        { category: "Q1", sales: 120, marketing: 100 },
        { category: "Q2", sales: 200, marketing: 150 },
        { category: "Q3", sales: 150, marketing: 180 },
        { category: "Q4", sales: 80, marketing: 90 },
      ],
      encoding: {
        x: "category",
        y: ["sales", "marketing"],
      },
      width: 800,
      height: 600,
      theme: "default",
    });

    await expect(result).toImageEqual("bar-grouped");
  });

  it("should generate a stacked bar chart with z field", async () => {
    const result = await generateBarChartTool.run({
      data: [
        { quarter: "Q1", value: 120, product: "Product A" },
        { quarter: "Q1", value: 100, product: "Product B" },
        { quarter: "Q2", value: 200, product: "Product A" },
        { quarter: "Q2", value: 150, product: "Product B" },
        { quarter: "Q3", value: 150, product: "Product A" },
        { quarter: "Q3", value: 180, product: "Product B" },
        { quarter: "Q4", value: 80, product: "Product A" },
        { quarter: "Q4", value: 90, product: "Product B" },
      ],
      encoding: {
        x: "quarter",
        y: "value",
        z: "product",
      },
      width: 800,
      height: 600,
      theme: "default",
    });

    await expect(result).toImageEqual("bar-stacked");
  });

  it("should return VISALL config when outputType is option", async () => {
    const result = await generateBarChartTool.run({
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
    expect(config.view.main.layers[0].type).toBe("bar");
    expect(config.view.main.layers[0].encoding.x).toBe("date");
    expect(config.view.main.layers[0].encoding.y).toBe("profitability");
  });
});
