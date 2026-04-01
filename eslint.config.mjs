import { defineConfig } from "eslint/config";

export default defineConfig({
  languageOptions: {
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    globals: {
      window: "readonly",
      document: "readonly",
      NodeJS: "readonly",
      require: "readonly",
      process: "readonly",
      module: "readonly",
      __dirname: "readonly",
      __filename: "readonly",
    },
  },
  ignores: [
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "check_users.js",
    "delete_admins.js",
    "scripts/**",
  ],
  rules: {
    "no-unused-vars": "warn",
  },
});
