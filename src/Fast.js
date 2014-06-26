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

  tracking.Fast.isCorner = function(p, w, i, j, data, width) {
    var brighter,
      circle,
      darker,
      ip,
      overlap,
      wip,
      x,
      y;

    if (i <= 3 && j <= 3) {
      return false;
    }

    circle = [
      (i - 3) * width + (j),
      (i - 3) * width + (j + 1),
      (i - 2) * width + (j + 2),
      (i - 1) * width + (j + 3),
      (i) * width + (j + 3),
      (i + 1) * width + (j + 3),
      (i + 2) * width + (j + 2),
      (i + 3) * width + (j + 1),
      (i + 3) * width + (j),
      (i + 3) * width + (j - 1),
      (i + 2) * width + (j - 2),
      (i + 1) * width + (j - 3),
      (i) * width + (j - 3),
      (i - 1) * width + (j - 3),
      (i - 2) * width + (j - 2),
      (i - 3) * width + (j - 1)
    ];

    for (x = 0; x < 16; x++) {
      darker = true;
      brighter = true;

      for (y = 0; y < 9; y++) {
        overlap = (x + y) % 16;
        wip = circle[overlap];
        ip = data[wip];

        if ((ip >= (p + tracking.Fast.FAST_THRESHOLD)) === false) {
          brighter = false;
        }

        if ((ip <= (p - tracking.Fast.FAST_THRESHOLD)) === false) {
          darker = false;
        }
      }
    }

    return brighter || darker;
  };
}());
