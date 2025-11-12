# 1. `src/index.ts` - 应用主入口

**文件路径:** `src/index.ts`

**角色:** **点火钥匙 (Ignition Key)**

此文件是 `mcp-echarts` 应用的绝对入口点。它负责解析命令行参数，根据参数选择并启动不同类型的服务器（Stdio, SSE, 或 Streamable HTTP），并初始化 `McpServer` 实例，将所有图表工具注册到服务器中。

## 核心功能

1.  **环境与参数处理**:
    *   通过 `dotenv` 库静默加载 `.env` 文件中的环境变量。
    *   使用 Node.js 内置的 `parseArgs` 解析命令行参数，如 `--transport`, `--port`, `--help` 等，以决定应用的运行模式。

2.  **服务器工厂 (`createEChartsServer`)**:
    *   这是整个应用的核心配置所在。它创建一个 `McpServer` 实例。
    *   它从 `src/tools/index.ts` 导入 `tools` 数组（一个包含了所有图表工具定义的数组）。
    *   通过遍历 `tools` 数组，它将每一个工具的 `name`, `description`, `inputSchema`, 和 `run` 方法注册到 `McpServer` 实例中。这体现了系统的“插件化”设计思想。

3.  **多传输模式支持**:
    *   `main` 函数是应用的逻辑主干，它根据解析出的 `transport` 参数，调用不同的函数来启动相应类型的服务：
        *   `runStdioServer()`: 用于标准的输入/输出流，这是最基础的模式，通常用于 CLI 或父子进程间的直接通信。
        *   `runSSEServer()`: 启动一个支持 Server-Sent Events (SSE) 的 HTTP 服务器。
        *   `runStreamableHTTPServer()`: 启动一个支持双向流式通信的 HTTP 服务器，这是更高级的 MCP 模式。
    *   每种服务器模式都实现了会话管理和消息处理的逻辑。

4.  **进程管理**:
    *   文件末尾包含了健壮的错误处理机制，通过监听 `uncaughtException` 和 `unhandledRejection` 事件来捕获所有未处理的异常，防止进程意外崩溃。
    *   调用 `main()` 函数启动整个应用。

## 关键符号/函数

*   `createEChartsServer()`:
    *   **功能**: 创建并配置 `McpServer` 的核心工厂函数。
    *   **交互**: 接收从 `./tools` 导入的 `tools` 数组，并使用 `server.tool()` 方法逐个注册。这是连接“引擎”和“工具”的桥梁。

*   `main()`:
    *   **功能**: 应用的启动逻辑分发器。根据命令行参数决定启动哪种传输协议的服务器。

*   `runStdioServer()`, `runSSEServer()`, `runStreamableHTTPServer()`:
    *   **功能**: 分别实现了三种不同通信协议的服务器启动和生命周期管理。它们都依赖 `createEChartsServer()` 来获取一个配置好的 `McpServer` 实例。

## 与其他模块的交互

*   **`@modelcontextprotocol/sdk`**:
    *   此文件深度依赖 MCP 的 SDK。`McpServer` 是服务的核心，而 `StdioServerTransport`, `SSEServerTransport`, `StreamableHTTPServerTransport` 则是 SDK 提供的标准传输层实现。

*   **`src/tools/index.ts`**:
    *   `createEChartsServer` 函数直接从此文件导入 `tools` 数组。`src/index.ts` 本身并不知道有哪些具体的图表工具，它只负责加载和注册，实现了控制反转（IoC），使得添加新图表工具无需修改主入口文件。

*   **`express`**:
    *   当运行在 HTTP 模式（SSE 或 Streamable）下时，使用 `express` 作为底层 Web 框架来处理 HTTP 请求。

## ASCII Art: 启动流程

```
+----------------------+
|   Command Line Args  |
| (e.g., --transport)  |
+-----------+----------+
            |
            v
+-----------+----------+
|      main()          |
|  (in src/index.ts)   |
+-----------+----------+
            |
            |  Selects Transport
            +------------------+------------------+
            |                  |                  |
            v                  v                  v
+-----------+----------+ +-----------+----------+ +-----------+----------+
| runStdioServer()     | | runSSEServer()       | | runStreamable...()   |
+-----------+----------+ +-----------+----------+ +-----------+----------+
            |                  |                  |
            | Calls            | Calls            | Calls
            v                  v                  v
+----------------------+----------------------+----------------------+
|                          createEChartsServer()                       |
|                                                                      |
|   1. new McpServer()                                                 |
|   2. Imports `tools` from `src/tools`                                |
|   3. Loops through `tools` and calls `server.tool(...)` for each     |
|                                                                      |
+----------------------------------------------------------------------+
            |
            v
+-----------+----------+
|   Connected Server   |
|   Ready for Requests |
+----------------------+
```
