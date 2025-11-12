# 8. `src/utils/minio.ts` - 外部存储接口

**文件路径:** `src/utils/minio.ts`

**角色:** **外部存储接口 (External Storage Interface)**

这个模块封装了与 MinIO（或任何 S3 兼容的对象存储服务）进行交互的所有逻辑。它提供了一个可选的功能，即将生成的图表图片持久化存储，并返回一个公开可访问的 URL，而不是在响应中直接返回图片数据（如 Base64）。这对于需要分享图表或在网页中嵌入图表的场景非常有用。

## 核心功能

1.  **配置驱动 (`isMinIOConfigured`, `getMinIOClient`)**:
    *   该模块的行为完全由环境变量驱动。`isMinIOConfigured` 函数通过检查是否存在 `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, 和 `MINIO_ENDPOINT` 这三个关键环境变量来判断 MinIO 功能是否被启用。
    *   `getMinIOClient` 函数是一个内部工厂函数，只有在配置齐全的情况下才会创建并返回一个 `minio` 客户端实例。这种延迟创建和配置检查的模式确保了即使在没有配置 MinIO 的情况下，应用也能正常运行而不会出错。

2.  **文件上传 (`storeBufferToMinIO`)**:
    *   这是该模块最核心的导出函数。它接收一个包含图片数据的 `Buffer`。
    *   **临时文件**: 它首先将 `Buffer` 写入操作系统临时目录（`os.tmpdir()`）下的一个临时文件中。这是因为 `minio` 客户端的 `fPutObject` 方法（用于大文件上传）需要一个文件路径作为源，而不是直接接收 Buffer。
    *   **存储桶检查**: 在上传之前，它会检查目标存储桶（`BUCKET_NAME`）是否存在，如果不存在，则会自动创建。
    *   **上传操作**: 调用 `minioClient.fPutObject` 将临时文件上传到 MinIO，并设置正确的 `Content-Type`。
    *   **URL 构建**: 上传成功后，它会根据环境变量中的 `MINIO_ENDPOINT`, `MINIO_PORT` 等信息，手动拼接出该对象的公开访问 URL。
    *   **清理**: 无论上传成功还是失败，它都会在 `try...catch...finally`（通过 `try...catch` 和 `try...finally` 的组合实现）结构中确保临时文件被删除，避免在服务器上留下垃圾文件。

## 架构意义

*   **功能可选性**: 通过完全依赖环境变量来启用或禁用，MinIO 功能成为了一个可插拔的模块。这使得 `mcp-echarts` 可以在多种环境下部署：在本地或简单环境中，它可以直接返回图片数据；在生产或云环境中，它可以配置为使用对象存储。
*   **关注点分离**: 将所有与对象存储相关的逻辑（认证、连接、上传、URL构建）都隔离在这个文件中，使得其他模块（主要是 `imageHandler.ts`）无需关心这些实现细节。`imageHandler.ts` 只需要调用 `isMinIOConfigured` 和 `storeBufferToMinIO` 即可。
*   **环境适应性**: 允许通过环境变量来配置端点、端口、SSL 等，使得应用能够轻松适应不同的网络和部署环境。

## 与其他模块的交互

*   **`src/utils/imageHandler.ts` (上游)**:
    *   `imageHandler.ts` 是此模块的唯一调用者。它使用 `isMinIOConfigured` 来决定是否执行上传逻辑，并在需要时调用 `storeBufferToMinIO` 来执行上传。

*   **`minio` (NPM 包)**:
    *   这是实现所有功能的底层依赖库。

*   **Node.js 内置模块 (`fs`, `os`, `path`)**:
    *   用于处理临时文件的创建、写入和删除。

## ASCII Art: 上传流程

```
+-----------------------------+
|      imageHandler.ts        |
| if (isMinIOConfigured()) {  |
|   storeBufferToMinIO(...)   |
| }                           |
+--------------+--------------+
               |
               | Calls storeBufferToMinIO(buffer)
               v
+--------------+--------------+
|   storeBufferToMinIO()      |
|   (in minio.ts)             |
+--------------+--------------+
               |
               v
+--------------+--------------+
| const client = getMinIOClient() |
+--------------+--------------+
               |
               v
+--------------+--------------+
| Write buffer to /tmp/temp.png |
+--------------+--------------+
               |
               v
+--------------+--------------+
| client.bucketExists(...)    |
+--------------+--------------+
               |
               v
+--------------+--------------+
| client.fPutObject(...)      |
+--------------+--------------+
               |
               | On Success
               v
+--------------+--------------+
| Build URL from Env Vars     |
| e.g., "http://host:port/..."|
+--------------+--------------+
               |
               v
+--------------+--------------+
| Delete /tmp/temp.png        |
+--------------+--------------+
               |
               v
+--------------+--------------+
| Return URL to imageHandler  |
+-----------------------------+
```
