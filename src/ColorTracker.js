(function() {
  /**
   * ColorTracker utility.
   * @constructor
   * @extends {tracking.Tracker}
   */
  tracking.ColorTracker = function() {
    this.setType('color');
    this.setColors(['magenta']);
  };

  tracking.inherits(tracking.ColorTracker, tracking.Tracker);

  /**
   * Holds the minimum number of found pixels to represent a blob.
   * @type {number}
   */
  tracking.ColorTracker.MIN_PIXELS = 30;

  /**
   * Holds the known colors.
   * @type {Object.<string, function>}
   * @private
   * @static
   */
  tracking.ColorTracker.knownColors_ = {};

  /**
   * Registers a color as known color.
   * @param {string} name The color name.
   * @param {function} fn The color function to test if the passed (r,g,b) is the
   *     desired color.
   * @static
   */
  tracking.ColorTracker.registerColor = function(name, fn) {
    tracking.ColorTracker.knownColors_[name] = fn;
  };

  /**
   * Gets the known color function that is able to test whether an (r,g,b) is
   * the desired color.
   * @param {string} name The color name.
   * @return {function} The known color test function.
   * @static
   */
  tracking.ColorTracker.getColor = function(name) {
    return tracking.ColorTracker.knownColors_[name];
  };

  /**
   * Holds the colors to be tracked by the `ColorTracker` instance.
   * @default ['magenta']
   * @type {Array.<string>}
   */
  tracking.ColorTracker.prototype.colors = null;

  /**
   * Calculates the central coordinate from the cloud points. The cloud points
   * is all points that are from the desired color.
   * @param {Array.<number>} cloud Major row order array containing all the
   *     points from the desired color, e.g. [x1, y1, c2, y2, ...].
   * @param {number} total Total numbers of pixels of the desired color.
   * @return {object} Object contaning the x, y and estimated z coordinate of
   *     the blog extracted from the cloud points.
   * @private
   */
  tracking.ColorTracker.prototype.calculateCentralCoordinate_ = function(cloud, total) {
    var dx = 0;
    var dy = 0;
    var maxx = -1;
    var maxy = -1;
    var minx = Infinity;
    var miny = Infinity;
    var totalInliers = 0;

    for (var c = 0; c < total; c += 2) {
      var x = cloud[c];
      var y = cloud[c + 1];

      if (x > -1 && y > -1) {
        dx += x;
        dy += y;
        totalInliers++;

        if (x < minx) {
          minx = x;
        }
        if (x > maxx) {
          maxx = x;
        }
        if (y < miny) {
          miny = y;
        }
        if (y > maxy) {
          maxy = y;
        }
      }
    }
    if (totalInliers === 0) {
      return null;
    }
    return {
      x: dx / totalInliers,
      y: dy / totalInliers,
      z: 60 - ((maxx - minx) + (maxy - miny)) / 2
    };
  };

  /**
   * Flags the cloud points with -1 when the pixel of the desired color is far
   * by `tracking.ColorTracker.MIN_PIXELS` of the area with a bigger density
   * of pixels of the desired color. This helps to reduce outliers from the
   * tracking.
   * @param {Array.<number>} cloud Major row order array containing all the
   *     points from the desired color, e.g. [x1, y1, c2, y2, ...].
   * @param {number} total Total numbers of pixels of the desired color.
   * @private
   */
  tracking.ColorTracker.prototype.flagOutliers_ = function(cloud, total) {
    for (var m = 0; m < total; m += 2) {
      var dist = 0;
      for (var n = 2; n < total; n += 2) {
        dist += tracking.Math.distance(cloud[m], cloud[m + 1], cloud[n], cloud[n + 1]);
      }
      if (dist/total >= tracking.ColorTracker.MIN_PIXELS) {
        cloud[m] = -1;
        cloud[m + 1] = -1;
        total[m]--;
      }
    }
  };

  /**
   * Gets the colors being tracked by the `ColorTracker` instance.
   * @return {Array.<string>}
   */
  tracking.ColorTracker.prototype.getColors = function() {
    return this.colors;
  };

  /**
   * Sets the colors to be tracked by the `ColorTracker` instance.
   * @param {Array.<string>} colors
   */
  tracking.ColorTracker.prototype.setColors = function(colors) {
    this.colors = colors;
  };

  /**
   * Tracks the `Video` frames. This method is called for each video frame in
   * order to decide whether `onFound` or `onNotFound` callback will be fired.
   * @param {Uint8ClampedArray} pixels The pixels data to track.
   * @param {number} width The pixels canvas width.
   * @param {number} height The pixels canvas height.
   */
  tracking.ColorTracker.prototype.track = function(pixels, width, height) {
    var instance = this,
      color,
      colorFn,
      colorIndex,
      colors = this.getColors(),
      cloud = [],
      payload = [],
      total = [];

    tracking.Matrix.forEach(pixels, width, height, function(r, g, b, a, w, i, j) {
      for (colorIndex = -1; color = colors[++colorIndex];) {
        if (!cloud[colorIndex]) {
          total[colorIndex] = 0;
          cloud[colorIndex] = [];
        }

        colorFn = tracking.ColorTracker.knownColors_[color];

        if (colorFn && colorFn.call(instance, r, g, b, a, w, i, j)) {
          total[colorIndex] += 2;
          cloud[colorIndex].push(j, i);
        }
      }
    });

    for (colorIndex = -1; color = colors[++colorIndex];) {
      if (total[colorIndex] < tracking.ColorTracker.MIN_PIXELS) {
        continue;
      }

      instance.flagOutliers_(cloud[colorIndex], total[colorIndex]);

      var data = instance.calculateCentralCoordinate_(cloud[colorIndex], total[colorIndex]);
      if (data) {
        data.color = colors[colorIndex];
        data.pixels = cloud[colorIndex];
        payload.push(data);
      }
    }

    if (payload.length) {
      if (instance.onFound) {
        instance.onFound.call(instance, payload);
      }
    }
    else {
      if (instance.onNotFound) {
        instance.onNotFound.call(instance, payload);
      }
    }
  };

  // Default colors
  //===================

  tracking.ColorTracker.registerColor('cyan', function(r, g, b) {
    var thresholdGreen = 50,
      thresholdBlue = 70,
      dx = r - 0,
      dy = g - 255,
      dz = b - 255;

    if ((g - r) >= thresholdGreen && (b - r) >= thresholdBlue) {
      return true;
    }
    return Math.sqrt(dx * dx + dy * dy + dz * dz) < 80;
  });

  tracking.ColorTracker.registerColor('magenta', function(r, g, b) {
    var threshold = 50,
      dx = r - 255,
      dy = g - 0,
      dz = b - 255;

    if ((r - g) >= threshold && (b - g) >= threshold) {
      return true;
    }
    return Math.sqrt(dx * dx + dy * dy + dz * dz) < 140;
  });

  tracking.ColorTracker.registerColor('yellow', function(r, g, b) {
    var threshold = 50,
      dx = r - 255,
      dy = g - 255,
      dz = b - 0;

    if ((r - g) >= threshold && (b - g) >= threshold) {
      return true;
    }
    return Math.sqrt(dx * dx + dy * dy + dz * dz) < 100;
  });

}());
