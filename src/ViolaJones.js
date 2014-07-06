(function() {
  /*
   * ViolaJones utility.
   * @static
   * @constructor
   */
  tracking.ViolaJones = {};

  /**
   * Holds the minimum area of intersection that defines when a rectangle is
   * from the same group. Often when a face is matched multiple rectangles are
   * classified as possible rectangles to represent the face, when they
   * intersects they are grouped as one face.
   * @type {number}
   * @default 0.5
   * @static
   */
  tracking.ViolaJones.REGIONS_OVERLAP = 0.5;

  /**
   * Holds the block size.
   * @type {number}
   * @default 20
   * @static
   */
  tracking.ViolaJones.BLOCK_SIZE = 20;

  /**
   * Holds the block jump size.
   * @type {number}
   * @default 2
   * @static
   */
  tracking.ViolaJones.BLOCK_JUMP = 2;

  /**
   * Holds the block scale factor.
   * @type {number}
   * @default 1.25
   * @static
   */
  tracking.ViolaJones.BLOCK_SCALE = 1.25;

  /**
   * Detects through the HAAR cascade data rectangles matches.
   * @param {array} The grayscale pixels in a linear [p1,p2,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {number} data The HAAR cascade data.
   * @return {array} Found rectangles.
   */
  tracking.ViolaJones.detect = function(pixels, width, height, data) {
    var integralImages = tracking.Matrix.computeIntergralImage(pixels, width, height);
    var blockSize = this.BLOCK_SIZE;
    var blockSizeInverse = 1.0 / this.BLOCK_SIZE;
    var maxBlockSize = Math.min(width, height);
    var position = 0;
    var payload = [];

    for (; blockSize <= maxBlockSize; blockSize = (blockSize * this.BLOCK_SCALE + 0.5) | 0) {
      var inverseArea = 1.0 / (blockSize * blockSize);
      var scale = blockSize * blockSizeInverse;

      var xmax = (height - blockSize);
      var ymax = (width - blockSize);
      var jump = (this.BLOCK_JUMP * scale + 0.5) | 0;

      for (var i = 0; i < xmax; i += jump) {
        for (var j = 0; j < ymax; j += jump) {
          if (this.evalStages_(data, integralImages, i, j, width, blockSize, scale, inverseArea)) {
            payload[position++] = {
              size: blockSize,
              x: j,
              y: i
            };
          }
        }
      }
    }
    return this.mergeRectangles_(payload);
  };

  /**
   * Evaluates if the block size on i,j position is a valid HAAR cascade
   * stage.
   * @param {number} data The HAAR cascade data.
   * @param {Array.<Array.<number>>} integralImages Array containing in the
   *     first position the integral image and in the second position the integral
   *     image squared.
   * @param {number} i Vertical position of the pixel to be evaluated.
   * @param {number} j Horizontal position of the pixel to be evaluated.
   * @param {number} width The image width.
   * @param {number} blockSize The block size.
   * @param {number} scale The scale factor of the block size and its original
   *     size.
   * @param {number} inverseArea The inverse area of the block size.
   * @return {boolean} Whether the region passes all the stage tests.
   * @private
   */
  tracking.ViolaJones.evalStages_ = function(data, integralImages, i, j, width, blockSize, scale, inverseArea) {
    var integralImage = integralImages[0];
    var integralImageSquare = integralImages[1];
    var wb1 = i * width + j;
    var wb2 = i * width + (j + blockSize);
    var wb3 = (i + blockSize) * width + j;
    var wb4 = (i + blockSize) * width + (j + blockSize);

    var total = integralImage[wb1] - integralImage[wb2] - integralImage[wb3] + integralImage[wb4];
    var totalSquare = integralImageSquare[wb1] - integralImageSquare[wb2] - integralImageSquare[wb3] + integralImageSquare[wb4];

    var mean = total * inverseArea;
    var variance = totalSquare * inverseArea - mean * mean;

    var standardDeviation = 1;
    if (variance > 0) {
      standardDeviation = Math.sqrt(variance);
    }

    var length = data.length;

    for (var w = 0; w < length; ) {
      var stageSum = 0;
      var stageThreshold = data[w++];
      var nodeLength = data[w++];

      while (nodeLength--) {
        var rectsSum = 0;
        var rectsLength = data[w++];

        for (var r = 0; r < rectsLength; r++) {
          var rectLeft = (j + data[w++] * scale + 0.5) | 0;
          var rectTop = (i + data[w++] * scale + 0.5) | 0;
          var rectWidth = (data[w++] * scale + 0.5) | 0;
          var rectHeight = (data[w++] * scale + 0.5) | 0;
          var rectWeight = data[w++];
          var wA = rectTop*width + rectLeft;
          var wB = wA + rectWidth;
          var wD = wA + rectHeight*width;
          var wC = wD + rectWidth;
          rectsSum += (integralImage[wA] - integralImage[wB] - integralImage[wD] + integralImage[wC]) * rectWeight;
        }

        var nodeThreshold = data[w++];
        var nodeLeft = data[w++];
        var nodeRight = data[w++];

        if (rectsSum * inverseArea < nodeThreshold * standardDeviation) {
          stageSum += nodeLeft;
        } else {
          stageSum += nodeRight;
        }
      }

      if (stageSum < stageThreshold) {
        return false;
      }
    }
    return true;
  };

  /**
   * Postprocess the detected sub-windows in order to combine overlapping
   * detections into a single detection.
   * @param {array} rects
   * @return {array}
   * @private
   */
  tracking.ViolaJones.mergeRectangles_ = function(rects) {
    var disjointSet = new tracking.DisjointSet(rects.length);

    for (var i = 0; i < rects.length; i++) {
      var r1 = rects[i];
      for (var j = 0; j < rects.length; j++) {
        var r2 = rects[j];
        if (tracking.Math.intersectRect(r1.x, r1.y, r1.x + r1.size, r1.y + r1.size, r2.x, r2.y, r2.x + r2.size, r2.y + r2.size)) {
          var x1 = Math.max(r1.x, r2.x);
          var y1 = Math.max(r1.y, r2.y);
          var x2 = Math.min(r1.x + r1.size, r2.x + r2.size);
          var y2 = Math.min(r1.y + r1.size, r2.y + r2.size);
          var overlap = (x1 - x2) * (y1 - y2);
          var area1 = (r1.size * r1.size);
          var area2 = (r2.size * r2.size);

          if ((overlap / (area1 * (area1 / area2)) >= this.REGIONS_OVERLAP) &&
            (overlap / (area2 * (area1 / area2)) >= this.REGIONS_OVERLAP)) {
            disjointSet.union(i, j);
          }
        }
      }
    }

    var map = {};
    for (var k = 0; k < disjointSet.length; k++) {
      var rep = disjointSet.find(k);
      if (!map[rep]) {
        map[rep] = {
          count: 1,
          size: rects[k].size,
          x: rects[k].x,
          y: rects[k].y
        };
        continue;
      }
      map[rep].count++;
      map[rep].size += rects[k].size;
      map[rep].x += rects[k].x;
      map[rep].y += rects[k].y;
    }

    var result = [];
    Object.keys(map).forEach(function(key) {
      var rect = map[key];
      result.push({
        size: rect.size / rect.count,
        x: rect.x / rect.count,
        y: rect.y / rect.count
      });
    });

    return result;
  };

}());
