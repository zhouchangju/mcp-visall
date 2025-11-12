# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mcp-echarts** is an MCP (Model Context Protocol) server that provides chart generation capabilities using Apache ECharts. It operates as a standalone microservice that can be called by AI agents, other backend services, or automation scripts to generate charts dynamically.

## Development Commands

### Build & Run
```bash
# Install dependencies
npm install

# Build the project (compiles TypeScript and resolves aliases)
npm run build

# Start with MCP Inspector (for development/testing)
npm run start

# Run tests
npm test

# Clean build artifacts before rebuilding
npm run prebuild
```

### Testing
```bash
# Run all tests with Vitest
npm test

# Run tests in watch mode (useful during development)
npm test -- --watch

# Run a specific test file
npm test __tests__/tools/bar.spec.ts
```

### Linting & Formatting
The project uses Biome for code quality. Lint-staged runs automatically on git hooks via Husky:
```bash
# These run automatically on staged files during git commit
biome check --write
biome format --write
biome lint
```

### Starting the Server with Different Transports

```bash
# Stdio transport (default, used by desktop apps like Claude)
mcp-echarts

# SSE transport (Server-Sent Events)
mcp-echarts -t sse -p 3033 -e /sse

# Streamable HTTP transport
mcp-echarts -t streamable -p 3033 -e /mcp

# Show help
mcp-echarts -h
```

## Architecture Overview

### Core Metaphor
- **Nouns**: ECharts Option objects, input data, and output results (PNG/SVG/URLs)
- **Verbs**: `run()` (transform input → Option), `renderECharts()` (render Option → image), `generateChartImage()` (orchestrate rendering + storage + formatting)
- **Engine**: `src/utils/render.ts` - uses `@napi-rs/canvas` to render ECharts server-side without a browser
- **Ignition Key**: `src/index.ts` - parses CLI args, starts MCP server, and dynamically registers all tools from `src/tools/`

### Request Flow
1. **Client** sends MCP request → `src/index.ts` (McpServer)
2. **McpServer** routes to appropriate tool → `src/tools/*.ts`
3. **Tool** transforms input data → builds ECharts Option object
4. **Tool** calls `generateChartImage()` → `src/utils/imageHandler.ts`
5. **ImageHandler** calls `renderECharts()` → `src/utils/render.ts`
6. **Renderer** creates canvas and renders chart → returns Buffer/string
7. **ImageHandler** checks MinIO configuration:
   - If configured: uploads to MinIO → returns URL
   - If not: converts to Base64 → returns image data
8. **McpServer** sends MCP response back to client

### Key Modules

- **`src/index.ts`**: Application entry point, MCP server setup, supports stdio/SSE/streamable transports
- **`src/tools/index.ts`**: Central registry that exports all available chart tools
- **`src/tools/*.ts`**: Individual chart tools (bar, line, pie, etc.) - each exports a tool with `name`, `description`, `inputSchema` (Zod), and `run()` function
- **`src/utils/render.ts`**: Core rendering engine using `@napi-rs/canvas` and ECharts
- **`src/utils/imageHandler.ts`**: Output coordinator - handles rendering, optional MinIO storage, and formats MCP responses
- **`src/utils/schema.ts`**: Common Zod schemas for tool input validation (title, width, height, theme, outputType, etc.)
- **`src/utils/minio.ts`**: MinIO integration for storing charts as URLs instead of Base64

### Tool Design Philosophy

Two types of tools for different use cases:

1. **Simplified Tools** (`generate_bar_chart`, `generate_line_chart`, etc.)
   - High-level, type-specific interfaces with simplified parameters
   - Abstract complex ECharts config into intuitive params (title, stack, group, etc.)
   - Best for common, standard charts
   - Easy to use, but limited customization

2. **Generic Tool** (`generate_echarts`)
   - Accepts raw ECharts Option JSON strings
   - Maximum flexibility - supports any ECharts feature
   - Requires deep ECharts knowledge
   - Ideal for complex, highly customized charts

### Service Model

**Important**: This project IS a backend service itself, not a library. It operates as a "called service" (microservice pattern):

- Runs as HTTP server (Express with SSE/streamable) or stdio process
- Waits for external clients to call its tools
- Clients can be: AI agents, LLM applications, other backend services, automation scripts
- You don't write a backend to use this - you write a client to call it

## Output Formats

Tools support three output types via `outputType` parameter:

- **`png`** (default): Returns PNG image as Base64 or MinIO URL
- **`svg`**: Returns SVG string as text
- **`option`**: Returns validated ECharts configuration JSON (useful for debugging)

## MinIO Configuration (Optional)

For better performance and sharing, configure MinIO to store charts as URLs:

1. Copy `.env.example` to `.env`
2. Set MinIO credentials:
   ```
   MINIO_ENDPOINT=localhost
   MINIO_PORT=9000
   MINIO_USE_SSL=false
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   MINIO_BUCKET_NAME=mcp-echarts
   ```

**Note**: If MinIO is not configured, the system automatically falls back to Base64 output.

## Adding New Chart Tools

To add a new chart type:

1. Create `src/tools/your-chart.ts` following the pattern in `src/tools/bar.ts`:
   ```typescript
   export const generateYourChartTool = {
     name: "generate_your_chart",
     description: "...",
     inputSchema: z.object({ /* Zod schema */ }),
     run: async (params) => {
       // 1. Transform input data
       // 2. Build ECharts Option object
       // 3. Call generateChartImage()
       return await generateChartImage(option, width, height, theme, outputType, "generate_your_chart");
     }
   };
   ```

2. Export tool in `src/tools/index.ts`:
   ```typescript
   import { generateYourChartTool } from "./your-chart";
   export const tools = [..., generateYourChartTool];
   ```

3. Add tests in `__tests__/tools/your-chart.spec.ts`

The server automatically discovers and registers all exported tools.

## TypeScript Configuration

- **Target**: ES6, CommonJS modules
- **Output**: `./build` directory
- **Root**: `./src`
- **Path aliases**: Resolved by `tsc-alias` during build
- **Strict mode**: enabled

## Testing Strategy

- **Integration tests**: `__tests__/integration.spec.ts` - test complete request/response flow
- **Tool tests**: `__tests__/tools/*.spec.ts` - test individual chart tools with sample data
- **Custom matchers**: `__tests__/utils/toImageEqual.ts` - visual regression testing with pixelmatch
- Use `DEBUG_MCP_ECHARTS=1` environment variable to enable debug logging (logs to stderr)

## Common Gotchas

1. **Don't mix stdio and HTTP logging**: Use `console.error()` for debug logs (writes to stderr), never `console.log()` in stdio mode as it contaminates the MCP protocol stream

2. **Font rendering**: The project bundles `AlibabaPuHuiTi-3-55-Regular.otf` in `fonts/` directory and registers it globally for proper CJK character rendering

3. **Canvas backend**: Uses `@napi-rs/canvas` (native Rust-based) instead of `node-canvas` for better performance and easier installation

4. **Schema validation**: All tools use Zod schemas from `src/utils/schema.ts` for consistent validation. Validation errors are automatically returned as MCP errors.

5. **Environment variables**: `.env` file is loaded silently (`DOTENV_CONFIG_QUIET=true`) to avoid polluting stdio output

## Code Quality Standards

### OOP Design Principles
When developing components and services, strictly adhere to these 7 OOP principles:

1. **开闭原则 (Open-Closed Principle, OCP)**
   - Classes should be open for extension but closed for modification
   - Use composition and dependency injection for extensibility
   - Prefer abstract interfaces over concrete implementations

2. **里氏替换原则 (Liskov Substitution Principle, LSP)**
   - Subtypes must be substitutable for their base types
   - Derived classes should enhance, not restrict, base class behavior
   - Ensure interface contracts are maintained in implementations

3. **依赖倒置原则 (Dependency Inversion Principle, DIP)**
   - Depend on abstractions, not concretions
   - High-level modules should not depend on low-level modules
   - Use dependency injection for loose coupling

4. **单一职责原则 (Single Responsibility Principle, SRP)**
   - Each class/module should have only one reason to change
   - Separate concerns into focused, cohesive units
   - Avoid god classes and utility dumping grounds

5. **接口隔离原则 (Interface Segregation Principle, ISP)**
   - Clients should not depend on interfaces they don't use
   - Create focused, role-specific interfaces
   - Prefer multiple small interfaces over large monolithic ones

6. **迪米特法则 (Law of Demeter, LoD)**
   - Objects should only communicate with immediate neighbors
   - Minimize knowledge of other classes' internal structures
   - Use facade patterns to reduce coupling

7. **合成复用原则 (Composite Reuse Principle)**
   - Prefer composition over inheritance
   - Build complex behavior through object collaboration
   - Avoid deep inheritance hierarchies

### Maintainability Metrics
Monitor and maintain these 6 key quality indicators:

1. **圈复杂度 (Cyclomatic Complexity, CNN)**
   - Keep functions under complexity level 10
   - Break down complex conditional logic
   - Use early returns and guard clauses

2. **扇入扇出度 (Fan-in/Fan-out Coupling, FFC)**
   - Minimize dependencies between modules
   - High fan-in (reusable) and low fan-out (focused) preferred
   - Track coupling through import/export analysis

3. **模块间耦合度 (Coupling Between Objects, CBO)**
   - Reduce interdependencies between classes
   - Use interfaces and dependency injection
   - Aim for loose coupling, high cohesion

4. **模块的响应 (Response For Class, RFC)**
   - Limit the number of methods that can be invoked
   - Keep public API surface minimal and focused
   - Consider method complexity and call chains

5. **紧内聚度 (Tight Class Cohesion, TCC)**
   - Ensure class methods work together toward common goals
   - High cohesion indicates well-designed classes
   - Methods should share instance variables and collaborate

6. **松内聚度 (Loose Class Cohesion, LCC)**
   - Monitor for classes with unrelated responsibilities
   - Low loose cohesion is preferred
   - Split classes that have multiple unrelated concerns

### Development Constraints

**File Size Limits:**
- **Maximum 500 lines per file** - Split larger files into focused modules
- Use composition and module extraction for complex logic
- Consider readability and maintainability over brevity

**Design Guidelines:**
- **Avoid over-engineering** - Choose simple solutions that meet current requirements
- Don't build abstractions until you need them (YAGNI principle)
- Balance flexibility with simplicity
- Focus on readable, maintainable code over clever optimizations

**Code Organization:**
- Group related functionality into cohesive modules
- Extract reusable utilities and shared concerns
- Use consistent naming conventions and patterns
- Document complex business logic and architectural decisions