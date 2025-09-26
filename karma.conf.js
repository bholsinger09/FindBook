module.exports = function (config) {
  config.set({
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-safari-launcher'),
      require('karma-jasmine-html-reporter')
    ],
    browsers: ['Safari'],
    singleRun: true
  });
};