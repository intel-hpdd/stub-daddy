'use strict';

if (process.env.RUNNER === 'CI') {
  var krustyJasmineReporter = require('krusty-jasmine-reporter');

  var junitReporter = new krustyJasmineReporter.KrustyJasmineJUnitReporter({
    specTimer: new jasmine.Timer(),
    JUnitReportSavePath: process.env.SAVE_PATH || './',
    JUnitReportFilePrefix: process.env.FILE_PREFIX || 'stub-daddy-results',
    JUnitReportSuiteName: 'Stub Daddy Reports',
    JUnitReportPackageName: 'Stub Daddy Reports'
  });

  jasmine.getEnv().addReporter(junitReporter);
}
