import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/dist/**",
      "**/node_modules/**",
      "**/*.min.js",
      "**/playwright-report/**",
      "**/test-results/**"
    ],
  },
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/presentation/contexts/echo-provider.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
