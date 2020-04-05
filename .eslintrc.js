module.exports = {
  parser: "@typescript-eslint/parser", // Specifies the ESLint parser
  extends: [
    "plugin:@typescript-eslint/recommended", // Uses the recommended rules from the @typescript-eslint/eslint-plugin
  ],
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
  },
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // The relevant specifications use underscores alot and we want to maintain name-parity.
    "@typescript-eslint/camelcase": "off",
    // This is extremely unergonomic to use when mixing it with JSON.parse and undeclared libraries (msCrypto)
    "@typescript-eslint/no-explicit-any": "off",
    // When working with spies, this is a hassle
    "@typescript-eslint/no-non-null-assertion": "off",
    // Not being able to use type inference for return types makes writing arrow-functions with complex Promise-return
    // types a hassle.
    "@typescript-eslint/explicit-function-return-type": "off",
  },
};
