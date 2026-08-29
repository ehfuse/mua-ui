import * as esbuild from "esbuild";
import { dtsPlugin } from "esbuild-plugin-d.ts";

// peer 전부 external — 소비처 번들과 중복 방지(chatbot-ui/taskbox 와 동일 워크플로).
const baseConfig = {
    entryPoints: ["src/index.ts"],
    bundle: true,
    minify: true,
    sourcemap: true,
    external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react-router-dom",
        "@mui/material",
        "@mui/material/*",
        "@mui/icons-material",
        "@mui/icons-material/*",
        "@emotion/react",
        "@emotion/styled",
        "dompurify",
        "entity-client",
        "@ehfuse/forma",
        "@ehfuse/alerts",
        "@ehfuse/editor",
        "@ehfuse/editor/*",
        "@ehfuse/mui-form-controls",
        "@ehfuse/mui-form-dialog",
        "@ehfuse/mui-dashboard-layout",
        "@ehfuse/mui-virtual-data-table",
        "@ehfuse/file-viewer",
        "@ehfuse/taskbox",
        "@ehfuse/taskbox/*",
        "@ehfuse/overlay-scrollbar",
        "@ehfuse/file-viewer/*",
    ],
    plugins: [dtsPlugin()],
};

await esbuild.build({ ...baseConfig, format: "esm", outfile: "dist/index.esm.js" });
await esbuild.build({ ...baseConfig, format: "cjs", outfile: "dist/index.js" });

console.log("✅ Build completed successfully!");
