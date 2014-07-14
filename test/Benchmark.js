var Benchmark = require('./utils/benchmark.js');

module.exports = {
  setUp: function(done) {
    Benchmark.setUpAll(done);
  },

  testBenchmark: function(test) {
    Benchmark.runAll(function(results) {
      test.ok(results.passed, Benchmark.createFailureMessage(results.resultDetails));
      test.done();
    });
  }
};
