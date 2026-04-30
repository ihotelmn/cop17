import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// We expanded lint coverage to all of src/. The codebase has accumulated
// many `any` casts and unused-var warnings that aren't launch blockers.
// For now we keep them as WARNINGS (surface them in CI log without failing
// the build). New code should avoid them; the long tail of existing usages
// will be cleaned up incrementally.
const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
            "@typescript-eslint/no-empty-object-type": "warn",
            "react-hooks/set-state-in-effect": "warn",
            "react-hooks/exhaustive-deps": "warn",
            "react/no-unescaped-entities": "warn",
        },
    },
    globalIgnores([
        // Default ignores of eslint-config-next:
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
        // Audit + data files — not production code.
        "scripts/out/**",
        "scripts/data/**",
        "scripts/historical/**",
    ]),
]);

export default eslintConfig;
