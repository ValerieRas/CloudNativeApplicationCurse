import js from "@eslint/js";
import globals from "globals";

export default [
  // 1. Use the recommended ESLint rules
  js.configs.recommended,

  {
    // 2. Define your files and language options
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      // 3. This replaces the old "env" key
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // Add your custom rules here
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
];