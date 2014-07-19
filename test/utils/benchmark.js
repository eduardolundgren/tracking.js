var fs = require('fs');
var PNG = require('png-js');

var BENCHMARK_FILENAME = 'benchmark.json';
var PATH_PERF_TESTS = 'test/perf';
var PATH_BENCHMARK_FILE = 'test/assets/' + BENCHMARK_FILENAME;
var TEST_TIMES_RUN = 5;
var TIME_THRESHOLD = 30;

var Benchmark = {
  /**
   * Calls the setUp function for all performance tests.
   * @param {function} done Function to be called when the set up is done.
   */
  setUpAll: function(done) {
    readTestFiles(function(files) {
      Benchmark.files = files;

      runAllSetUps(done);
    });
  },

  /**
   * Runs all the performance tests.
   * @param {function} callback Function to be called when all tests finish running.
   */
  runAll: function(callback) {
    var results;

    getBenchmarkContents(function(benchmark) {
      results = runAllTests(benchmark);
      fs.writeFile(PATH_BENCHMARK_FILE, JSON.stringify(benchmark), function() {
        callback(results);
      });
    });
  },

  /**
   * Creates a failure message for the given results.
   * @param {array} results An array with the results of the performance tests.
   */
  createFailureMessage: function(results) {
    var message = '';

    for(var i = 0; i < results.length; i++) {
      if (results[i].failedTests.length > 0) {
        message += '\n' + results[i].failedTests.length + ' failures for ' + results[i].filename + ':';
        for (var j = 0; j < results[i].failedTests.length; j++) {
          message += '\n\t' + results[i].failedTests[j];
        }
      }
    }

    return message;
  }
};

/**
 * Gets the contents of the benchmark json file.
 * @param {function} callback Function to be called with the contents.
 */
function getBenchmarkContents(callback){
  fs.exists(PATH_BENCHMARK_FILE, function (exists) {
    if (exists) {
      fs.readFile(PATH_BENCHMARK_FILE, 'utf8', function(error, data) {
        callback(JSON.parse(data));
      });
    } else {
      callback({});
    }
  });
}

/**
 * Reads all performance test files.
 * @param {function} callback Function to be called when all tests are read.
 */
function readTestFiles(callback) {
  fs.readdir(PATH_PERF_TESTS, function(error, files_list) {
    var files = [];

    for (var i = 0; i < files_list.length; i++) {
      var filename = files_list[i];

      if (filename.match('.*.js$')) {
        files.push({
          filename: filename,
          test: require('../../' + PATH_PERF_TESTS + '/' + filename)
        });
      }
    }

    callback(files);
  });
}

/**
 * Runs the setUp function for each performance test.
 * @param {function} callback Function to be called when all set ups are done.
 */
function runAllSetUps(callback) {
  Benchmark.totalDone = 0;

  for (var i = 0; i < Benchmark.files.length; i++) {
    test = Benchmark.files[i].test;

    if (test.setUp) {
      test.setUp(function() {
        setUpDone(callback);
      });
    } else {
      setUpDone(callback);
    }
  }
}

/**
 * Runs all the performance tests.
 * @param {object} benchmark Information about duration of previous test runs.
 */
function runAllTests(benchmark) {
  var allResults = [];
  var benchmarkTime;
  var benchmarkTimes;
  var currentResults;
  var duration;
  var filename;
  var passed = true;
  var test;

  for (var i = 0; i < Benchmark.files.length; i++) {
    filename = Benchmark.files[i].filename;
    test = Benchmark.files[i].test;

    if (!benchmark[filename]) {
      benchmark[filename] = {};
    }

    currentResults = {
      filename: filename,
      failedTests: [],
      passedTests: []
    };

    for (var key in test) {
      if (test.hasOwnProperty(key) && (typeof test[key] === 'function') && key !== 'setUp') {
        duration = runTest(test[key]);
        benchmarkTimes = benchmark[filename][key];

        if (benchmarkTimes && benchmarkTimes.length) {
          benchmarkTime = benchmarkTimes[benchmarkTimes.length - 1];

          if (duration > benchmarkTime + TIME_THRESHOLD) {
            currentResults.failedTests.push(key);
            passed = false;
          }
          else {
            currentResults.passedTests.push(key);
            benchmark[filename][key].push(duration);
          }
        }
        else {
          currentResults.passedTests.push(key);
          benchmark[filename][key] = [duration];
        }
      }
    }

    allResults.push(currentResults);
  }

  return {
    passed: passed,
    resultDetails: allResults
  };
}

/**
 * Runs a single test.
 * @param {object} test The test to be run.
 */
function runTest(test) {
  var timeBefore;
  var timeTotal = 0;

  for (var i = 0; i < TEST_TIMES_RUN; i++) {
    timeBefore = new Date().getTime();
    test();
    timeTotal += new Date().getTime() - timeBefore;
  }

  return timeTotal / TEST_TIMES_RUN;
}

/**
 * Increments the number of setUp functions that are done, and invokes the callback when all
 * have been finished.
 * @param {function} callback The function to be called when the last setUp function is done
 */
function setUpDone(callback) {
  Benchmark.totalDone++;

  if (Benchmark.totalDone === Benchmark.files.length) {
    callback();
  }
}

module.exports = Benchmark;
