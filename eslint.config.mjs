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
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".data/**",
    "coverage/**",
    "playwright-report/**",
    // Unreachable / unfinished WIP that is parked out of the production build.
    "components/admin-poll-management.tsx",
    "components/poll-approval-actions.tsx",
    "components/admin-news.tsx",
    "lib/news-service.ts",
    "lib/poll-duplicate.ts",
    "lib/poll-provider-types.ts",
    "lib/poll-validation.ts",
    "lib/audit-log.ts",
    "app/api/admin/news/**",
    "app/api/admin/vyang-baan/**",
    "app/api/cron/news/publish/**",
    "app/api/cron/polls/**",
    "app/news/[slug]/**",
    "tests/unit/news-management.test.ts",
    "tests/unit/migration-007.test.ts",
    "tests/unit/migration-008.test.ts",
    "tests/e2e/deployment.spec.ts",
  ]),
]);
