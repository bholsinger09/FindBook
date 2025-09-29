module.exports = function (config) {
  config.set({
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-safari-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage')
    ],
    browsers: ['Safari'],
    singleRun: true,
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/findbook-app'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcovonly' }
      ],
      check: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80
        }
      }
    }
  });
};