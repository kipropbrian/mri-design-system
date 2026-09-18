import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The design system lives inside the platform repository, so two lockfiles
 * exist. Pinning the Turbopack root keeps Next from walking up to the platform
 * app and compiling the wrong tree.
 */
const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
