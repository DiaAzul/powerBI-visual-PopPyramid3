// Karma configuration
// Generated on Fri Nov 24 2017 23:08:45 GMT+0000 (GMT Standard Time)

'use strict';

const recursivePathToTests = 'test/**/*.ts'
  , srcRecursivePath = '.tmp/drop/visual.js'
  , srcCssRecursivePath = '.tmp/drop/visual.css'
  , srcOriginalRecursivePath = 'src/**/*.ts'
  , coverageFolder = 'coverage';

const coverage_reporters = [
  { type: 'text-summary' },
];
const reporters = [
  'progress',  
  'coverage',
  'karma-remap-istanbul',
];

module.exports = (config) => {
  const browsers = [];

  if (process.env.TRAVIS) {
    console.log('On Travis sending coveralls');
    browsers.push('ChromeTravisCI');
    reporters.push('coveralls');    
    coverage_reporters.push({ type: 'lcov', dir: 'coverage' });
  } else {
    browsers.push('Chrome');
    console.log('Not on Travis so not sending coveralls');
    coverage_reporters.push({ type: 'html', dir: 'coverage', 'subdir': '.' });
  }

  config.set({
    browsers,
    customLaunchers: {
      ChromeTravisCI: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
    colors: true,
    frameworks: ['jasmine'],
    reporters: reporters,
    singleRun: true,
    files: [
      srcCssRecursivePath,
      srcRecursivePath,
      'node_modules/lodash/lodash.min.js',
      'node_modules/powerbi-visuals-utils-testutils/lib/index.js',
      'node_modules/jquery/dist/jquery.min.js',
      'node_modules/jasmine-jquery/lib/jasmine-jquery.js',
      recursivePathToTests,
      {
        pattern: srcOriginalRecursivePath,
        included: false,
        served: true
      }
    ],
    preprocessors: {
      [recursivePathToTests]: ['typescript'],
      [srcRecursivePath]: ['sourcemap', 'coverage']
    },
    typescriptPreprocessor: {
      options: {
        sourceMap: false,
        target: 'ES5',
        removeComments: false,
        concatenateOutput: false
      }
    },
    coverageReporter: {
      reporters: coverage_reporters,
    },
    remapIstanbulReporter: {
      reports: {
        lcovonly: coverageFolder + '/lcov.info',
        html: coverageFolder,
        'text-summary': null
      }
    }
  });
};
