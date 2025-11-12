# VISALL Component Migration Guide

This document describes the migration from ECharts-style chart APIs to VISALL component APIs for bar, line, and pie charts.

## Overview

The chart generation tools (`generate_bar_chart`, `generate_line_chart`, and `generate_pie_chart`) have been updated to support VISALL component configuration format, providing more flexibility in data field mapping and output options.

## API Changes

### Old API (ECharts-style)

**Bar Chart:**
```typescript
{
  title: "Chart Title",
  axisXTitle: "X Axis",
  axisYTitle: "Y Axis",
  data: [
    { category: "A", value: 100, group: "Group1" }
  ],
  group: true,  // or stack: true
  width: 800,
  height: 600,
  theme: "default",
  outputType: "png"
}
```

**Line Chart:**
```typescript
{
  title: "Chart Title",
  axisXTitle: "Time",
  axisYTitle: "Value",
  data: [
    { time: "2024-01", value: 100, group: "Series A" }
  ],
  stack: true,
  smooth: true,
  showArea: true,
  width: 800,
  height: 600
}
```

**Pie Chart:**
```typescript
{
  title: "Chart Title",
  data: [
    { category: "Category A", value: 27 },
    { category: "Category B", value: 25 },
    { category: "Category C", value: 48 }
  ],
  innerRadius: 0.4,  // Optional: for donut chart
  width: 800,
  height: 600,
  theme: "default"
}
```

**Limitations:**
- Fixed field names (`category`/`time`, `value`, `group`)
- Boolean flags for grouping/stacking
- Less flexible data structure

### New API (VISALL-style)

**Bar Chart:**
```typescript
{
  data: [
    { date: "2024-01-01", profitability: 89.02, name: "Company A" }
  ],
  encoding: {
    x: "date",        // X-axis field name (category/date)
    y: "profitability", // Y-axis field name(s) - single or array
    z: "name"         // Optional grouping field
  },
  width: 800,
  height: 600,
  theme: "default",
  outputType: "png" | "svg" | "option"
}
```

**Line Chart:**
```typescript
{
  data: [
    { date: "2024-01-01", profitability: 89.02, name: "Company A" }
  ],
  encoding: {
    x: "date",        // X-axis field name (time/date)
    y: "profitability", // Y-axis field name(s) - single or array
    z: "name"         // Optional grouping field
  },
  smooth: true,       // Smooth curve
  showArea: true,     // Fill area under line
  showSymbol: true,   // Show data point markers
  width: 800,
  height: 600,
  theme: "default",
  outputType: "png" | "svg" | "option"
}
```

**Pie Chart:**
```typescript
{
  data: [
    { category: "Product A", value: 30 },
    { category: "Product B", value: 25 },
    { category: "Product C", value: 45 }
  ],
  encoding: {
    x: "category",    // Field name for pie slice labels
    y: "value"        // Field name for pie slice values
  },
  innerRadius: 0.3,  // Optional: 0 for pie, >0 for donut chart (0-0.9)
  width: 800,
  height: 600,
  theme: "default",
  outputType: "png" | "svg" | "option"
}
```

**Benefits:**
- Flexible field names - use any field from your data
- `encoding` object for explicit field mapping
- Support for multiple y-axis fields: `y: ["sales", "marketing"]`
- `outputType: "option"` returns VISALL component configuration
- Line chart specific options: `smooth`, `showArea`, `showSymbol`
- Pie chart support: pie charts and donut charts with `innerRadius` option
- Data validation: pie charts limited to 1-10 data points for optimal readability

## Migration Examples

### Bar Chart Examples

#### Example 1: Basic Bar Chart

**Before:**
```typescript
{
  data: [
    { category: "Shirt", value: 120 },
    { category: "Pants", value: 80 }
  ],
  axisXTitle: "Products",
  axisYTitle: "Sales"
}
```

**After:**
```typescript
{
  data: [
    { product: "Shirt", sales: 120 },
    { product: "Pants", sales: 80 }
  ],
  encoding: {
    x: "product",
    y: "sales"
  }
}
```

#### Example 2: Grouped Bar Chart

**Before:**
```typescript
{
  data: [
    { category: "Q1", value: 120, group: "Sales" },
    { category: "Q1", value: 100, group: "Marketing" }
  ],
  group: true
}
```

**After (Multiple Y Fields):**
```typescript
{
  data: [
    { quarter: "Q1", sales: 120, marketing: 100 }
  ],
  encoding: {
    x: "quarter",
    y: ["sales", "marketing"]  // Array for multiple series
  }
}
```

**Or (Using Z Field):**
```typescript
{
  data: [
    { quarter: "Q1", value: 120, department: "Sales" },
    { quarter: "Q1", value: 100, department: "Marketing" }
  ],
  encoding: {
    x: "quarter",
    y: "value",
    z: "department"  // Grouping by department
  }
}
```

### Line Chart Examples

#### Example 1: Basic Line Chart

**Before:**
```typescript
{
  data: [
    { time: "Jan", value: 120 },
    { time: "Feb", value: 150 }
  ],
  axisXTitle: "Month",
  axisYTitle: "Sales",
  smooth: true
}
```

**After:**
```typescript
{
  data: [
    { month: "Jan", sales: 120 },
    { month: "Feb", sales: 150 }
  ],
  encoding: {
    x: "month",
    y: "sales"
  },
  smooth: true
}
```

#### Example 2: Multi-Series Line Chart

**Before:**
```typescript
{
  data: [
    { time: "Jan", value: 120, group: "Product A" },
    { time: "Jan", value: 100, group: "Product B" }
  ]
}
```

**After (Multiple Y Fields):**
```typescript
{
  data: [
    { month: "Jan", productA: 120, productB: 100 }
  ],
  encoding: {
    x: "month",
    y: ["productA", "productB"]
  }
}
```

**Or (Using Z Field):**
```typescript
{
  data: [
    { month: "Jan", value: 120, product: "Product A" },
    { month: "Jan", value: 100, product: "Product B" }
  ],
  encoding: {
    x: "month",
    y: "value",
    z: "product"
  }
}
```

#### Example 3: Smooth Area Chart

**Before:**
```typescript
{
  data: [
    { time: "Q1", value: 150 },
    { time: "Q2", value: 230 }
  ],
  smooth: true,
  showArea: true,
  showSymbol: true
}
```

**After:**
```typescript
{
  data: [
    { quarter: "Q1", sales: 150 },
    { quarter: "Q2", sales: 230 }
  ],
  encoding: {
    x: "quarter",
    y: "sales"
  },
  smooth: true,
  showArea: true,
  showSymbol: true
}
```

### Pie Chart Examples

#### Example 1: Basic Pie Chart

**Before:**
```typescript
{
  data: [
    { category: "Electronics", value: 320 },
    { category: "Clothing", value: 280 },
    { category: "Books", value: 150 }
  ],
  title: "Sales by Category"
}
```

**After:**
```typescript
{
  data: [
    { category: "Electronics", sales: 320 },
    { category: "Clothing", sales: 280 },
    { category: "Books", sales: 150 }
  ],
  encoding: {
    x: "category",
    y: "sales"
  },
  title: "Sales by Category"
}
```

#### Example 2: Donut Chart

**Before:**
```typescript
{
  data: [
    { category: "Development", value: 45 },
    { category: "Marketing", value: 30 },
    { category: "Operations", value: 25 }
  ],
  innerRadius: 0.4
}
```

**After:**
```typescript
{
  data: [
    { department: "Development", budget: 45 },
    { department: "Marketing", budget: 30 },
    { department: "Operations", budget: 25 }
  ],
  encoding: {
    x: "department",
    y: "budget"
  },
  innerRadius: 0.4
}
```

## Output Type: "option"

The new API introduces `outputType: "option"` which returns the VISALL component configuration as a JSON string:

**Bar Chart:**
```typescript
{
  data: [{ name: "光线传媒", profitability: 89.02, date: "2024-01-01" }],
  encoding: { x: "date", y: "profitability" },
  outputType: "option"
}
```

**Line Chart:**
```typescript
{
  data: [{ name: "光线传媒", profitability: 89.02, date: "2024-01-01" }],
  encoding: { x: "date", y: "profitability" },
  outputType: "option"
}
```

**Pie Chart:**
```typescript
{
  data: [
    { category: "Electronics", sales: 320 },
    { category: "Clothing", sales: 280 },
    { category: "Books", sales: 150 }
  ],
  encoding: { x: "category", y: "sales" },
  outputType: "option"
}
```

**Returns (Bar Chart):**
```json
{
  "data": [
    {
      "values": [
        { "name": "光线传媒", "profitability": 89.02, "date": "2024-01-01" }
      ]
    }
  ],
  "view": {
    "main": {
      "layers": [
        {
          "type": "bar",
          "encoding": {
            "x": "date",
            "y": "profitability"
          }
        }
      ]
    }
  }
}
```

**Returns (Line Chart):**
```json
{
  "data": [
    {
      "values": [
        { "name": "光线传媒", "profitability": 89.02, "date": "2024-01-01" }
      ]
    }
  ],
  "view": {
    "main": {
      "layers": [
        {
          "type": "line",
          "encoding": {
            "x": "date",
            "y": "profitability"
          }
        }
      ]
    }
  }
}
```

**Returns (Pie Chart):**
```json
{
  "data": [
    {
      "values": [
        { "category": "Electronics", "sales": 320 },
        { "category": "Clothing", "sales": 280 },
        { "category": "Books", "sales": 150 }
      ]
    }
  ],
  "view": {
    "main": {
      "layers": [
        {
          "type": "pie",
          "encoding": {
            "x": "category",
            "y": "sales"
          }
        }
      ]
    }
  }
}
```

This configuration can be used directly with VISALL visualization components.

## Field Mapping Reference

### encoding.x
- **Type**: `string`
- **Description**: Field name for X-axis
  - **Bar Chart**: Categories or dates
  - **Line Chart**: Time/date field
  - **Pie Chart**: Category field (pie slice labels)
- **Data Type**: Should map to string fields in your data
- **Required**: Yes

### encoding.y
- **Type**: `string | string[]`
- **Description**: Field name(s) for Y-axis (numeric values)
- **Data Type**: Should map to numeric fields in your data
- **Required**: Yes
- **Multiple Series**: Use array for multiple y-axis fields (Bar/Line charts only)
- **Pie Chart**: Single string field for pie slice values

### encoding.z
- **Type**: `string`
- **Description**: Field name for grouping (creates multiple series)
- **Data Type**: Should map to categorical fields (string) in your data
- **Required**: No
- **Usage**: Creates separate series for each unique value in the z field (Bar/Line charts only)
- **Pie Chart**: Not applicable

## Line Chart Specific Options

### smooth
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to use smooth curves instead of straight lines between points

### showArea
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to fill the area under the line (creates an area chart)

### showSymbol
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Whether to show markers/symbols on data points

## Pie Chart Specific Options

### innerRadius
- **Type**: `number`
- **Default**: `0`
- **Description**: Inner radius for donut charts (0-0.9). Set to 0 for standard pie chart, or value like 0.6 for donut chart.

## Data Structure Requirements

Your data array should contain objects with:
- All fields referenced in `encoding.x`, `encoding.y`, and `encoding.z`
- Field values matching their expected types:
  - **Bar Chart**:
    - X-axis: string or date string
    - Y-axis: number
    - Z-axis: string (categorical)
  - **Line Chart**:
    - X-axis: date string (recommended) or string
    - Y-axis: number
    - Z-axis: string (categorical)
  - **Pie Chart**:
    - X-axis: string (category labels)
    - Y-axis: number (values)
    - Z-axis: not applicable
  - **Data Limits**:
    - Pie Chart: 1-10 data points for optimal readability

**Example:**
```typescript
data: [
  { date: "2024-01-01", value: 100, category: "A" },
  { date: "2024-01-02", value: 150, category: "A" },
  { date: "2024-01-01", value: 120, category: "B" }
]
```

## Backward Compatibility

The old API is **not supported** in the new implementation. You must migrate to the new `encoding`-based API.

If you need the old behavior, consider:
1. Using the generic `generate_echarts` tool with custom ECharts options
2. Transforming your data to match the new API format
3. Creating a wrapper that converts old-style calls to new-style calls

## Testing

Updated test suites demonstrate all scenarios:

**Bar Chart:**
- Basic single-series bar chart
- Grouped bar chart (multiple y fields)
- Grouped bar chart (z field)
- VISALL config output

**Line Chart:**
- Basic line chart
- Smooth line chart with area
- Multi-series line chart (multiple y fields)
- Multi-series line chart (z field)
- VISALL config output

**Pie Chart:**
- Basic pie chart
- Donut chart (with innerRadius)
- Multi-category pie chart
- VISALL config output
- Data validation (1-10 items)

Run tests:
```bash
# Bar chart tests
npm test -- __tests__/tools/bar.spec.ts

# Line chart tests
npm test -- __tests__/tools/line.spec.ts

# Pie chart tests
npm test -- __tests__/tools/pie.spec.ts
```
