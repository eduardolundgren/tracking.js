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
  tracking.ViolaJones.BOUNDING_REGIONS_OVERLAP = 0.5;

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
    var integralImage = integralImages[0];
    var integralImageSquare = integralImages[1];

    var blockSize = this.BLOCK_SIZE;
    var blockSizeInverse = 1.0 / this.BLOCK_SIZE;
    var maxBlockSize = Math.min(width, height);
    var position = 0;
    var payload = [];

    for (; blockSize <= maxBlockSize; blockSize = ~~(blockSize * this.BLOCK_SCALE)) {
      var scale = blockSize * blockSizeInverse;
      var inverseArea = 1.0 / (blockSize * blockSize);

      var i = 0;
      var j = 0;
      var xmax = (height - blockSize);
      var ymax = (width - blockSize);

      for (var x = 0.0; x < xmax; x += this.BLOCK_JUMP) {
        i = ~~x;
        for (var y = 0.0; y < ymax; y += this.BLOCK_JUMP) {
          j = ~~y;
          if (this.evalStages_(data, integralImage, integralImageSquare, i, j, width, blockSize, scale, inverseArea)) {
            payload[position++] = {
              size: blockSize,
              x: j,
              y: i
            };
          }
        }
      }
    }
    return tracking.ViolaJones.mergeRectangles(payload);
  };

  /**
   * Evaluates if the block size on i,j position is a valid HAAR cascade
   * stage.
   * @param {number} data The HAAR cascade data.
   * @param {Array.<number>} integralImage Summed area table of an image
   *     computed by `tracking.Matrix.computeIntergralImage`.
   * @param {Array.<number>} integralImageSquare Summed squared area table of
   *     an image computed by `tracking.Matrix.computeIntergralImage`.
   * @param {number} i Vertical position of the pixel to be evaluated.
   * @param {number} j Horizontal position of the pixel to be evaluated.
   * @param {number} width The image width.
   * @param {number} blockSize The block size.
   * @param {number} scale The scale factor of the block size and its original
   *     size.
   * @param {number} inverseArea The inverse area of the block size.
   * @return {boolean} Whether the region passes all the stage tests.
   */
  tracking.ViolaJones.evalStages_ = function(data, integralImage, integralImageSquare, i, j, width, blockSize, scale, inverseArea) {
    var wb1 = i * width + j;
    var wb2 = i * width + (j + blockSize);
    var wb3 = (i + blockSize) * width + j;
    var wb4 = (i + blockSize) * width + (j + blockSize);

    var total = integralImage[wb1] - integralImage[wb2] - integralImage[wb3] + integralImage[wb4];
    var totalSquare = integralImageSquare[wb1] - integralImageSquare[wb2] - integralImageSquare[wb3] + integralImageSquare[wb4];

    var mean = total * inverseArea;
    var variance = totalSquare * inverseArea - mean * mean;
    if (variance > 1) {
      variance = Math.sqrt(variance);
    } else {
      variance = 1;
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
          var rectLeft = j + ~~(data[w++] * scale);
          var rectTop = i + ~~(data[w++] * scale);
          var rectWidth = ~~(data[w++] * scale);
          var rectHeight = ~~(data[w++] * scale);
          var rectWeight = data[w++];
          var recRight = rectLeft + rectWidth;
          var recBottom = rectTop + rectHeight;
          var w1 = rectTop * width + rectLeft;
          var w2 = rectTop * width + recRight;
          var w3 = recBottom * width + rectLeft;
          var w4 = recBottom * width + recRight;
          rectsSum += (integralImage[w1] - integralImage[w2] - integralImage[w3] + integralImage[w4]) * rectWeight;
        }

        var nodeThreshold = data[w++];
        var nodeLeft = data[w++];
        var nodeRight = data[w++];

        if (rectsSum * inverseArea < nodeThreshold * variance) {
          stageSum += nodeLeft;
        } else {
          stageSum += nodeRight;
        }
      }

      if (stageSum <= stageThreshold) {
        return false;
      }
    }
    return true;
  };

  /**
   * Postprocess the detected sub-windows in order to combine overlapping.
   * detections into a single detection.
   * @param {array} rects
   * @return {array}
   */
  tracking.ViolaJones.mergeRectangles = function(rects) {
    var rectsLen = rects.length;
    var hasGroup = new Uint32Array(rectsLen);
    var rect;
    var rectsMap = {};

    for (var i = 0; i < rectsLen; i++) {
      if (hasGroup[i]) {
        continue;
      }

      var rect1 = rects[i];

      hasGroup[i] = true;
      rectsMap[i] = {
        count: 1,
        rect: rect1
      };

      var x1 = rect1.x;
      var y1 = rect1.y;
      var blockSize1 = rect1.size;
      var x2 = x1 + blockSize1;
      var y2 = y1 + blockSize1;

      for (var j = i + 1; j < rectsLen; j++) {
        if (hasGroup[j]) {
          continue;
        }

        var rect2 = rects[j];

        if (i === j) {
          continue;
        }

        var x3 = rect2.x;
        var y3 = rect2.y;
        var blockSize2 = rect2.size;
        var x4 = x3 + blockSize2;
        var y4 = y3 + blockSize2;

        if (tracking.Math.intersectRect(x1, y1, x2, y2, x3, y3, x4, y4)) {
          var px1 = Math.max(x1, x3);
          var py1 = Math.max(y1, y3);
          var px2 = Math.min(x2, x4);
          var py2 = Math.min(y2, y4);
          var pArea = (px1 - px2) * (py1 - py2);

          if ((pArea / (blockSize1 * blockSize1) >= this.BOUNDING_REGIONS_OVERLAP) &&
            (pArea / (blockSize2 * blockSize2) >= this.BOUNDING_REGIONS_OVERLAP)) {

            rect = rectsMap[i];
            hasGroup[j] = true;
            rect.count++;
            if (blockSize2 < blockSize1) {
              rect.rect = rect2;
            }
          }
        }
      }
    }

    var faces = [];
    for (i in rectsMap) {
      rect = rectsMap[i];
      if (rect.count > 1) {
        faces.push(rect.rect);
      }
    }

    return faces;
  };

}());
