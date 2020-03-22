// Karma configuration

const express = require("express");
const path = require("path");

const router = express.Router();
global["router"] = router;

function mockIdpRouterFactory(config) {
  return router;
}

module.exports = function (config) {
  config.set({
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["jasmine"],

    // list of files / patterns to load in the browser
    files: ["src/**/*.ts"],

    // list of files / patterns to exclude
    exclude: [],

    webpack: {
      // karma watches the test entry points
      // (you don't need to specify the entry option)
      // webpack watches dependencies
      // webpack configuration
      mode: "development",
      devtool: "inline-source-map",
      module: {
        rules: [
          {
            test: /\.ts$/,
            use: "ts-loader",
            exclude: /node_modules/,
          },
          // See https://tomasalabes.me/blog/typescript/tests/code-coverage/webpack/2018/09/24/ts-code-coverage.html
          {
            test: /\.ts$/,
            enforce: "post", // needed if you're using Babel
            include: path.resolve(`src/`), // instrument only sources with Istanbul
            exclude: [/node_modules/, /\.test\.ts$/],
            loader: "istanbul-instrumenter-loader",
            options: {
              esModules: true, // needed if you're using Babel
            },
          },
        ],
      },
      resolve: {
        extensions: [".ts", ".js"],
      },
    },

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      "src/**/*.ts": ["webpack"],
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ["progress", "coverage-istanbul"],

    coverageIstanbulReporter: {
      // lcov is used by WebStorm to show coverage data
      // json is used by codecov for reporting it on Gitlab
      reports: ["lcov", "json"],
      fixWebpackSourcePaths: true,
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ["Chrome"],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: 1,

    // We use an express router to allow tests to provide their own routes
    middleware: ["mockIdpRouter"],
    plugins: [
      "karma-*",
      { "middleware:mockIdpRouter": ["factory", mockIdpRouterFactory] },
    ],
  });
};
