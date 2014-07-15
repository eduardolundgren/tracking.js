(function() {
  /**
   * ColorTracker utility to track colored blobs in a frrame using color
   * difference evaluation.
   * @constructor
   * @extends {tracking.Tracker}
   */
  tracking.ColorTracker = function() {
    tracking.ColorTracker.base(this, 'constructor');

    this.setColors(['magenta']);
  };

  tracking.inherits(tracking.ColorTracker, tracking.Tracker);

  /**
   * Holds the minimum number of found pixels to represent a blob.
   * @type {number}
   * @default 30
   * @static
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
   * Caches coordinates values of the neighbours surrounding a pixel.
   * @type {Object.<number, Int32Array>}
   * @private
   * @static
   */
  tracking.ColorTracker.neighbours_ = {};

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
   * are all points that matches the desired color.
   * @param {Array.<number>} cloud Major row order array containing all the
   *     points from the desired color, e.g. [x1, y1, c2, y2, ...].
   * @param {number} total Total numbers of pixels of the desired color.
   * @return {object} Object contaning the x, y and estimated z coordinate of
   *     the blog extracted from the cloud points.
   * @private
   */
  tracking.ColorTracker.prototype.calculateDimensions_ = function(cloud, total) {
    var maxx = -1;
    var maxy = -1;
    var minx = Infinity;
    var miny = Infinity;

    for (var c = 0; c < total; c += 2) {
      var x = cloud[c];
      var y = cloud[c + 1];

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

    return {
      maxx: maxx,
      maxy: maxy,
      minx: minx,
      miny: miny
    };
  };

  /**
   * Gets the colors being tracked by the `ColorTracker` instance.
   * @return {Array.<string>}
   */
  tracking.ColorTracker.prototype.getColors = function() {
    return this.colors;
  };

  /**
   * Gets the eight offset values of the neighbours surrounding a pixel.
   * @param {number} width The image width
   * @return {array} Array with the eight offset values of the neighbours
   *     surrounding a pixel.
   */
  tracking.ColorTracker.prototype.getNeighboursForWidth_ = function(width) {
    if (tracking.ColorTracker.neighbours_[width]) {
      return tracking.ColorTracker.neighbours_[width];
    }

    var neighbours = new Int32Array(8);

    neighbours[0] = -width * 4;
    neighbours[1] = -width * 4 + 4;
    neighbours[2] = 4;
    neighbours[3] = width * 4 + 4;
    neighbours[4] = width * 4;
    neighbours[5] = width * 4 - 4;
    neighbours[6] = -4;
    neighbours[7] = -width * 4 - 4;

    tracking.ColorTracker.neighbours_ = neighbours;

    return neighbours;
  };

  /**
   * Unites groups whose bounding box intersect with each other.
   * @param {Array.<Object>} results
   */
  tracking.ColorTracker.prototype.regroupResults_ = function(results) {
    var newResults = [];
    var going;

    for (var r = 0; r < results.length; r++) {
      going = true;

      for (var s = r + 1; s < results.length; s++) {
        if ((results[r].minx >= results[s].minx && results[r].minx <= results[s].maxx) ||
            (results[r].maxx >= results[s].minx && results[r].maxx <= results[s].maxx)) {
          if ((results[r].miny >= results[s].miny && results[r].miny <= results[s].maxy) ||
            (results[r].maxy >= results[s].miny && results[r].maxy <= results[s].maxy)) {

            going = false;

            results[s].minx = Math.min(results[r].minx, results[s].minx);
            results[s].maxx = Math.max(results[r].maxx, results[s].maxx);
            results[s].miny = Math.min(results[r].miny, results[s].miny);
            results[s].maxy = Math.max(results[r].maxy, results[s].maxy);
            results[s].z = 60 - ((results[s].maxx - results[s].minx) + (results[s].maxy - results[s].miny)) / 2;

            break;
          }
        }
      }

      if (going) {
        newResults.push({
          color: results[r].color,
          height: results[r].maxy - results[r].miny,
          width: results[r].maxx - results[r].minx,
          x: results[r].minx,
          y: results[r].miny
        });
      }
    }

    return newResults;
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
    var colors = this.getColors();
    var payload = [];

    for (var colorIndex = 0; colorIndex < colors.length; colorIndex++) {
      payload.push(this.trackColor_(pixels, width, height, colors[colorIndex]));
    }

    if (payload.length) {
      if (this.onFound) {
        this.onFound.call(this, payload);
      }
    }
    else {
      if (this.onNotFound) {
        this.onNotFound.call(this, payload);
      }
    }
  };

  /**
   * Find the given color in the given matrix of pixels.
   * @param {Uint8ClampedArray} pixels The pixels data to track.
   * @param {number} width The pixels canvas width.
   * @param {number} height The pixels canvas height.
   * @param {string} color The color to be found
   */
  tracking.ColorTracker.prototype.trackColor_ = function(pixels, width, height, color) {
    var colorFn = tracking.ColorTracker.knownColors_[color];
    var currGroup = new Int32Array(pixels.length >> 2);
    var currGroupSize;
    var currI;
    var currJ;
    var currW;
    var marked = new Int8Array(pixels.length);
    var minPixels = tracking.ColorTracker.MIN_PIXELS;
    var neighboursW = this.getNeighboursForWidth_(width);
    var queue = new Int32Array(pixels.length);
    var queuePosition;
    var results = [];
    var w = -4;

    if (!colorFn) {
      return results;
    }

    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        w += 4;

        if (marked[w]) {
          continue;
        }

        currGroupSize = 0;

        queuePosition = -1;
        queue[++queuePosition] = w;
        queue[++queuePosition] = i;
        queue[++queuePosition] = j;

        marked[w] = 1;

        while (queuePosition >= 0) {
          currJ = queue[queuePosition--];
          currI = queue[queuePosition--];
          currW = queue[queuePosition--];

          if (colorFn.call(this, pixels[currW], pixels[currW + 1], pixels[currW + 2], pixels[currW + 3], currW, currI, currJ)) {
            currGroup[currGroupSize++] = currJ;
            currGroup[currGroupSize++] = currI;

            for (var k = 0; k < neighboursW.length; k++) {
              var otherW = currW + neighboursW[k];
              var otherI = currI + neighboursI[k];
              var otherJ = currJ + neighboursJ[k];
              if (!marked[otherW] && otherI >= 0 && otherI < height && otherJ >= 0 && otherJ < width) {
                queue[++queuePosition] = otherW;
                queue[++queuePosition] = otherI;
                queue[++queuePosition] = otherJ;

                marked[otherW] = 1;
              }
            }
          }
        }

        if (currGroupSize >= minPixels) {
          var data = this.calculateDimensions_(currGroup, currGroupSize);
          if (data) {
            data.color = color;
            results.push(data);
          }
        }
      }
    }

    return this.regroupResults_(results);
  }

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
    return dx * dx + dy * dy + dz * dz < 6400;
  });

  tracking.ColorTracker.registerColor('magenta', function(r, g, b) {
    var threshold = 50,
      dx = r - 255,
      dy = g - 0,
      dz = b - 255;

    if ((r - g) >= threshold && (b - g) >= threshold) {
      return true;
    }
    return dx * dx + dy * dy + dz * dz < 19600;
  });

  tracking.ColorTracker.registerColor('yellow', function(r, g, b) {
    var threshold = 50,
      dx = r - 255,
      dy = g - 255,
      dz = b - 0;

    if ((r - b) >= threshold && (g - b) >= threshold) {
      return true;
    }
    return dx * dx + dy * dy + dz * dz < 10000;
  });


  // Caching neighbour i/j offset values.
  //===================

  var neighboursI = new Int32Array(8);
  var neighboursJ = new Int32Array(8);

  neighboursI[0] = -1;
  neighboursI[1] = -1;
  neighboursI[2] = 0;
  neighboursI[3] = 1;
  neighboursI[4] = 1;
  neighboursI[5] = 1;
  neighboursI[6] = 0;
  neighboursI[7] = -1;

  neighboursJ[0] = 0;
  neighboursJ[1] = 1;
  neighboursJ[2] = 1;
  neighboursJ[3] = 1;
  neighboursJ[4] = 0;
  neighboursJ[5] = -1;
  neighboursJ[6] = -1;
  neighboursJ[7] = -1;
}());
