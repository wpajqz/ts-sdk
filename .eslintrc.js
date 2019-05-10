module.exports = {
    "parser": "@typescript-eslint/parser",
    "plugins": ["@typescript-eslint"],
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": [
      "plugin:@typescript-eslint/recommended",
      "prettier",
      "prettier/@typescript-eslint"
    ],
    "rules": {}
};
