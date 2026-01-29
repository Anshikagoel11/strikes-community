import js from "@eslint/js";
import turbo from "eslint-plugin-turbo";
import onlyWarn from "eslint-plugin-only-warn";
import tseslint from "typescript-eslint";

export const config = [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            turbo,
            "only-warn": onlyWarn,
        },
        rules: {
            "turbo/no-undeclared-env-vars": "warn",
        },
        ignores: ["dist/**", "node_modules/**", ".turbo/**"],
    },
];
