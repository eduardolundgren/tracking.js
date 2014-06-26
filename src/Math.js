(function() {
  /**
   * Math utility.
   * @static
   * @constructor
   */
  tracking.Math = {};

  /**
   * Euclidean distance between two points P(x0, y0) and P(x1, y1).
   * @param {number} x0 Horizontal coordinate of P0.
   * @param {number} y0 Vertical coordinate of P0.
   * @param {number} x1 Horizontal coordinate of P1.
   * @param {number} y1 Vertical coordinate of P1.
   * @return {number} The euclidean distance.
   */
  tracking.Math.distance = function(x0, y0, x1, y1) {
    var dx = x1 - x0,
      dy = y1 - y0;

    return Math.sqrt(dx * dx + dy * dy);
  };

  /**
   * Calculates the Hamming distance between two binary strings of equal
   * length is the number of positions at which the corresponding symbols are
   * different. In another way, it measures the minimum number of
   * substitutions required to change one string into the other, or the
   * minimum number of errors that could have transformed one string into the
   * other.
   *
   * Example:
   * Binary string between   Hamming distance
   *  1011101 and 1001001           2
   *
   * @param {Array.<number>} desc1 Array of numbers necessary to store the
   *     binary string, e.g. for 128 bits this array requires at least 4
   *     positions.
   * @param {Array.<number>} desc3 Array of numbers necessary to store the
   *     binary string, e.g. for 128 bits this array requires at least 4
   *     positions.
   * @return {number} The hamming distance.
   */
  tracking.Math.hammingDistance = function(desc1, desc2) {
    var dist = 0, v, length;

    for (v = 0, length = desc1.length; v < length; v++) {
      dist += this.hammingWeight(desc1[v] ^ desc2[v]);
    }

    return dist;
  };

  /**
   * Calculates the Hamming weight of a string, which is the number of symbols that are
   * different from the zero-symbol of the alphabet used. It is thus
   * equivalent to the Hamming distance from the all-zero string of the same
   * length. For the most typical case, a string of bits, this is the number
   * of 1's in the string.
   *
   * Example:
   *  Binary string     Hamming weight
   *   11101                 4
   *   11101010              5
   *
   * @param {number} i Number that holds the binary string to extract the hamming weight.
   * @return {number} The hamming weight.
   */
  tracking.Math.hammingWeight = function(i) {
    i = i - ((i >> 1) & 0x55555555);
    i = (i & 0x33333333) + ((i >> 2) & 0x33333333);

    return ((i + (i >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
  };
}());
