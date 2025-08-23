// eslint.config.js
const globals = require("globals");
const js = require("@eslint/js");

const env = process.env.NODE_ENV || "development";
const isProd = env === "production";

module.exports = [
    js.configs.recommended,
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
        },
        rules: {
            "no-unused-vars": isProd ? "error" : "warn",
            "no-console": isProd ? "error" : "off",
        },
    },
    {
        files: ["eslint.config.js"],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
    {
        files: [
            "server.js",
            "config/**/*.js",
            "controllers/**/*.js",
            "middlewares/**/*.js",
            "routes/**/*.js",
            "helpers/**/*.js"   // ✅ Add helpers
        ],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
    {
        files: ["Public/Assets/js/**/*.js"],
        languageOptions: {
            globals: {
                ...globals.browser,
                Cropper: "readonly", // ✅ declare Cropper
                form: "readonly"     // ✅ declare form
            },
        },
    }
];