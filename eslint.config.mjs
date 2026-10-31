import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // These React Compiler lint rules fire on conventional client-side data
      // fetching and localStorage hydration, which this app uses deliberately.
      // They are not enabled as build errors; typecheck, tests and review remain
      // the primary correctness gates.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".data/**", "coverage/**", "playwright-report/**"]),
]);
