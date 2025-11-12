# 7. `package.json` - 项目基石

**文件路径:** `package.json`

**角色:** **项目基石 (Project Foundation)**

这是每个 Node.js 项目的身份和配置文件。它定义了项目的名称、版本、依赖项、构建和运行脚本，以及如何将此项目作为一个可执行的命令行工具发布。

## 核心功能

1.  **项目标识**:
    *   `name`: `mcp-echarts`，项目的唯一名称。
    *   `version`: `0.6.1`，当前版本号。
    *   `description`: 项目的简短描述。
    *   `repository`: 指向项目的 GitHub 仓库。

2.  **入口点和发布内容**:
    *   `main`: `build/index.js`，指定了当其他 Node.js 项目 `require('mcp-echarts')` 时，应该加载哪个文件。
    *   `bin`: `{"mcp-echarts": "./build/index.js"}`，这是将项目定义为命令行工具的关键。当通过 npm 全局安装此包时，npm 会创建一个名为 `mcp-echarts` 的可执行文件，它会链接到 `build/index.js`。这使得用户可以直接在 shell 中运行 `mcp-echarts` 命令。
    *   `files`: `["build", "fonts"]`，定义了当发布到 npm 时，哪些文件和目录应该被包含在包中。这里明确指出，编译后的 `build` 目录和包含字体的 `fonts` 目录是必需的。

3.  **核心依赖 (`dependencies`)**:
    *   这个列表揭示了项目的核心技术栈：
        *   `@modelcontextprotocol/sdk`: 表明这是一个 MCP（模型上下文协议）应用，使用官方 SDK 与上层 Agent 进行通信。
        *   `@napi-rs/canvas`: **关键依赖**。用于在 Node.js 后端创建 Canvas 画布，是实现服务端渲染的核心。
        *   `echarts`: **关键依赖**。Apache ECharts 库，用于定义和绘制图表。
        *   `dotenv`: 用于从 `.env` 文件加载环境变量。
        *   `express`: 当以 HTTP 模式运行时，用作 Web 服务器框架。
        *   `minio`: 用于与 MinIO 或其他 S3 兼容的对象存储服务进行交互。
        *   `zod`: 用于输入数据的验证和 Schema 定义。

4.  **开发依赖 (`devDependencies`)**:
    *   `typescript`, `tsc-alias`: 表明项目使用 TypeScript 编写，并需要路径别名解析。
    *   `vitest`, `pixelmatch`, `pngjs`: 用于测试。`vitest` 是测试框架，而 `pixelmatch` 和 `pngjs` 表明项目包含对生成图片进行像素级比较的图像对比测试。
    *   `@biomejs/biome`, `husky`, `lint-staged`: 用于代码格式化和 linting，并通过 `husky` 的 pre-commit 钩子强制执行代码质量检查。
    *   `@modelcontextprotocol/inspector`: 一个用于调试和审查 MCP 通信的工具。

5.  **脚本 (`scripts`)**:
    *   `build`: `tsc && tsc-alias -p tsconfig.json`，定义了构建流程：首先使用 TypeScript 编译器 (`tsc`) 将 `src` 目录下的 `.ts` 文件编译成 `build` 目录下的 `.js` 文件，然后使用 `tsc-alias` 修复编译后代码中的路径别名。
    *   `start`: `npm run build && npx @modelcontextprotocol/inspector node build/index.js`，定义了启动应用的命令：先构建项目，然后使用 MCP Inspector 启动编译后的 `index.js` 文件。
    *   `test`: `vitest`，运行单元测试和集成测试。
    *   `prepare`, `prepublishOnly`: 这些是 npm 的生命周期脚本，确保在安装依赖或发布包之前，项目总是处于已构建的状态。

## 架构意义

`package.json` 文件为我们提供了一个关于项目技术选型、构建流程和分发方式的快速概览。通过分析此文件，我们可以得出以下结论：

*   这是一个使用 TypeScript 编写的、同时支持作为库和命令行工具使用的 Node.js 项目。
*   它的核心功能是利用 ECharts 和 `@napi-rs/canvas` 在服务端生成图表。
*   它遵循 MCP 协议，设计为被 AI Agent 或其他自动化流程调用。
*   项目具有高质量的工程实践，包括自动化测试（含图像对比测试）、代码格式化和提交前检查。
