import { describe, expect, it } from "vitest";
import { generatePieChartTool } from "../../src/tools/pie";
import "../utils/matcher";

describe("Pie Chart Tool", () => {
  it("should generate a basic pie chart", async () => {
    const result = await generatePieChartTool.run({
      title: "Market Share Distribution",
      data: [
        { category: "Search Engine", value: 1048 },
        { category: "Direct Visit", value: 735 },
        { category: "Email Marketing", value: 580 },
        { category: "Affiliate Ads", value: 484 },
        { category: "Video Ads", value: 300 },
      ],
      encoding: {
        x: "category",
        y: "value",
      },
      width: 800,
      height: 600,
      theme: "default",
    });

    await expect(result).toImageEqual("pie-basic");
  });

  it("should generate a donut chart", async () => {
    const result = await generatePieChartTool.run({
      title: "Budget Allocation (Donut Chart)",
      data: [
        { department: "Development", budget: 45 },
        { department: "Marketing", budget: 30 },
        { department: "Operations", budget: 15 },
        { department: "Support", budget: 10 },
      ],
      encoding: {
        x: "department",
        y: "budget",
      },
      width: 800,
      height: 600,
      theme: "default",
      innerRadius: 0.4,
    });

    await expect(result).toImageEqual("pie-donut");
  });

  it("should generate a pie chart with many categories", async () => {
    const result = await generatePieChartTool.run({
      title: "Sales by Product Category",
      data: [
        { product: "Electronics", sales: 320 },
        { product: "Clothing", sales: 280 },
        { product: "Books", sales: 150 },
        { product: "Sports", sales: 120 },
        { product: "Home", sales: 90 },
        { product: "Beauty", sales: 75 },
        { product: "Toys", sales: 50 },
        { product: "Others", sales: 35 },
      ],
      encoding: {
        x: "product",
        y: "sales",
      },
      width: 800,
      height: 600,
      theme: "default",
    });

    await expect(result).toImageEqual("pie-many-categories");
  });

  it("should return VISALL config when outputType is option", async () => {
    const result = await generatePieChartTool.run({
      data: [
        { x: "index0", y: 66.23 },
        { x: "index1", y: 72.71 },
        { x: "index2", y: 65.15 },
        { x: "index3", y: 58.24 },
        { x: "index4", y: 44.27 },
        { x: "index5", y: 35.68 },
      ],
      encoding: {
        x: "x",
        y: "y",
      },
      width: 800,
      height: 600,
      innerRadius: 0.3,
      outputType: "option",
    });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const config = JSON.parse(
      (result.content[0] as { type: string; text: string }).text,
    );
    expect(config).toHaveProperty("data");
    expect(config).toHaveProperty("view");
    expect(config.view.main.layers[0].type).toBe("pie");
    expect(config.view.main.layers[0].encoding.x).toBe("x");
    expect(config.view.main.layers[0].encoding.y).toBe("y");
  });

  it("should validate data limits (max 10 items)", async () => {
    // Test with more than 10 items should fail
    const tooMuchData = Array.from({ length: 11 }, (_, i) => ({
      category: `Item ${i}`,
      value: Math.floor(Math.random() * 100) + 1,
    }));

    await expect(
      generatePieChartTool.run({
        data: tooMuchData,
        encoding: { x: "category", y: "value" },
        width: 800,
        height: 600,
        outputType: "option",
      }),
    ).rejects.toThrow();
  });

  it("should validate data limits (min 1 item)", async () => {
    // Test with empty data should fail
    await expect(
      generatePieChartTool.run({
        data: [],
        encoding: { x: "category", y: "value" },
        width: 800,
        height: 600,
        outputType: "option",
      }),
    ).rejects.toThrow();
  });
});
