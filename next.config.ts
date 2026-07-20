import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: currentDirectory,
  },
};

export default nextConfig;
