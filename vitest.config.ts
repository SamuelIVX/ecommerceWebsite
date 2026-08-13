/**
 * Vitest config — jsdom, Testing Library setup, `@` → `src` alias, UTC TZ.
 */
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        environment: "jsdom",
        setupFiles: ["./vitest.setup.ts"],
        include: ["**/*.test.ts", "**/*.test.tsx"],
        globals: true,
        css: false,
        env: {
            TZ: "UTC",
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    css: {
        postcss: {},
    },
});
