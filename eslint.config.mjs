import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      /*
       * The template renders provider imagery (iNaturalist, Macaulay Library,
       * Xeno-canto) straight from public CDNs as plain <img> elements, exactly
       * as the platform does. Routing them through next/image would require
       * remotePatterns for every provider and would proxy scientist-hosted
       * media through the MRI app, which the providers' terms do not ask for.
       */
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
