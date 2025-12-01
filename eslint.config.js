const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const prettierConfig = require("eslint-config-prettier");
const prettierPlugin = require("eslint-plugin-prettier");

module.exports = tseslint.config(
	// TypeScript & Angular files
	{
		files: ["**/*.ts"],
		ignores: ["**/dist/**"],
		extends: [
			eslint.configs.recommended,
			...tseslint.configs.recommended,
			...tseslint.configs.stylistic,
			...angular.configs.tsRecommended,
			prettierConfig, // toujours en dernier
		],
		plugins: {
			prettier: prettierPlugin,
		},
		processor: angular.processInlineTemplates,
		rules: {
			"prettier/prettier": "error",
			"@typescript-eslint/no-explicit-any": "warn",
			"@angular-eslint/directive-selector": [
				"error",
				{
					type: "attribute",
					prefix: "app",
					style: "camelCase",
				},
			],
			"@angular-eslint/component-selector": [
				"error",
				{
					type: "element",
					prefix: "app",
					style: "kebab-case",
				},
			],
		},
	},

	//
	// HTML templates Angular
	//
	{
		files: ["**/*.html"],
		ignores: ["**/dist/**"],
		extends: [
			...angular.configs.templateRecommended,
			...angular.configs.templateAccessibility,
			prettierConfig,
		],
		rules: {},
	},
);
