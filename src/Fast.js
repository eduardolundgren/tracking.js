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

  tracking.Fast.isCorner = function(p, w, i, j, data, width, height) {};
}());
