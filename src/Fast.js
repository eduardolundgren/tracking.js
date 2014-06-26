(function() {
  /*
   * FAST intends for "Features from Accelerated Segment Test". This method
   * performs a point segment test corner detection. The segment test criterion
   * operates by considering a circle of sixteen pixels around the corner
   * candidate p. The detector classifies p as a corner if there exists a set of n
   * contiguous pixelsin the circle which are all brighter than the intensity of
   * the candidate pixel Ip plus a threshold t, or all darker than Ip − t.
   *
   *       15 00 01
   *    14          02
   * 13                03
   * 12       []       04
   * 11                05
   *    10          06
   *       09 08 07
   *
   * For more reference:
   * http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.60.3991&rep=rep1&type=pdf
   *
   * @static
   * @constructor
   */
  tracking.Fast = {};

  tracking.Fast.FAST_THRESHOLD = 10;

  tracking.Fast.circles_ = {};

  tracking.Fast.findCorners = function(pixels, width, height) {
    var baseCircle = this.getCircle_(width),
      circle = new Uint32Array(16),
      corners = [],
      grayScale = new Uint8ClampedArray(width * height),
      i,
      j,
      k,
      p,
      position = 0,
      w = 0;

    for (i = 0; i < height; i++) {
      for (j = 0; j < width; j++) {
        grayScale[position++] = pixels[w]*0.299 + pixels[w + 1]*0.587 + pixels[w + 2]*0.114;
        w += 4;
      }
    }

    for (i = 3; i < height - 3; i++) {
      for (j = 3; j < width - 3; j++) {
        w = i*width + j;
        p = grayScale[w];

        for (k = 0; k < 16; k++) {
          circle[k] = grayScale[baseCircle[k] + w];
        }

        if (this.isCorner(circle, p, 10)) {
          corners.push(j, i);
          j+=3;
        }
      }
    }

    return corners;
  };

  tracking.Fast.isCorner = function(circle, p, threshold) {
    var brighter,
      circlePoint,
      darker;

    if (this.isTriviallyExcluded(circle, p, threshold)) {
      return false;
    }

    for (var x = 0; x < 16; x++) {
      darker = true;
      brighter = true;

      for (var y = 0; y < 9; y++) {
        circlePoint = circle[(x + y) & 15];

        if (!this.isBrighter(circlePoint, p, threshold)) {
          brighter = false;
        }

        if (!this.isDarker(circlePoint, p, threshold)) {
          darker = false;
        }
      }
    }

    return brighter || darker;
  };

  tracking.Fast.isTriviallyExcluded = function(circle, p, threshold) {
    var count = 0;
    var circleTop = circle[0];
    var circleRight = circle[4];
    var circleBottom = circle[8];
    var circleLeft = circle[12];

    if (this.isBrighter(circleTop, p, threshold)) {
      count++;
    }
    if (this.isBrighter(circleRight, p, threshold)) {
      count++;
    }
    if (this.isBrighter(circleBottom, p, threshold)) {
      count++;
    }
    if (this.isBrighter(circleLeft, p, threshold)) {
      count++;
    }

    if (count < 3) {
      count = 0;
      if (this.isDarker(circleTop, p, threshold)) {
        count++;
      }
      if (this.isDarker(circleRight, p, threshold)) {
        count++;
      }
      if (this.isDarker(circleBottom, p, threshold)) {
        count++;
      }
      if (this.isDarker(circleLeft, p, threshold)) {
        count++;
      }

      if (count < 3) {
        return true;
      }
    }

    return false;
  };

  tracking.Fast.isBrighter = function(circlePoint, p, threshold) {
    return circlePoint > p + threshold;
  };

  tracking.Fast.isDarker = function(circlePoint, p, threshold) {
    return circlePoint < p - threshold;
  };

  tracking.Fast.getCircle_ = function(width) {
    if (this.circles_[width]) {
      return this.circles_[width];
    }

    var circle = new Int32Array(16);

    circle[0] = -width - width - width;
    circle[1] = circle[0] + 1;
    circle[2] = circle[1] + width + 1;
    circle[3] = circle[2] + width + 1;
    circle[4] = circle[3] + width;
    circle[5] = circle[4] + width;
    circle[6] = circle[5] + width - 1;
    circle[7] = circle[6] + width - 1;
    circle[8] = circle[7] - 1;
    circle[9] = circle[8] - 1;
    circle[10] = circle[9] - width - 1;
    circle[11] = circle[10] - width - 1;
    circle[12] = circle[11] - width;
    circle[13] = circle[12] - width;
    circle[14] = circle[13] - width + 1;
    circle[15] = circle[14] - width + 1;

    this.circles_[width] = circle;
    return circle;
  };
}());
