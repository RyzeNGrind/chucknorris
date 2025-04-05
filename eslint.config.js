// ESLint configuration for ChuckNorris MCP server
export default [
  {
    ignores: ["node_modules/**", "dist/**"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Node.js globals
        process: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        // Browser globals that may be used in Node
        URL: "readonly",
        AbortController: "readonly",
        // Allow require for CommonJS
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "semi": ["error", "always"],
      "quotes": ["error", "single"],
      "indent": ["error", 2],
      "comma-dangle": ["error", "never"],
      "no-console": "off",
      "max-len": ["warn", { "code": 120 }],
    },
  },
]; 