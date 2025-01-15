import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ESM 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 自定义插件:在开发模式下强制使用 template.html
const forceTemplateHtml = () => ({
  name: "force-template-html",
  configureServer(server) {
    return () => {
      server.middlewares.use((req, res, next) => {
        // 如果请求根路径或 index.html,重定向到 template.html
        if (req.url === "/" || req.url === "/index.html") {
          req.url = "/template.html";
        }
        next();
      });
    };
  },
});

export default defineConfig({
  plugins: [forceTemplateHtml(), react(), viteSingleFile()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"), // '@' 映射到 src 目录
    },
  },
  server: {
    open: "/template.html",
    port: 3000, // 设置默认端口为 3000
  },
  build: {
    rollupOptions: {
      input: resolve(__dirname, "template.html"), // 使用绝对路径明确指定入口
    },
  },
});
