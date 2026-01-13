import js from "@eslint/js";
import globals from "globals";

export default [
  // 1. GLOBAL IGNORES (This is the most important part)
  {
    ignores: ["dist/**", "build/**", "node_modules/**"],
  },

  js.configs.recommended,

  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": "warn",
      // These rules often trigger errors in third-party or minified code
      "no-prototype-builtins": "off", 
      "no-cond-assign": ["error", "except-parens"],
    },
  },
];