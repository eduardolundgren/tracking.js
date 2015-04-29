(function() {
  /**
   * Matrix utility.
   * @static
   * @constructor
   */
  tracking.Matrix = {};

  /**
   * Loops the array organized as major-row order and executes `fn` callback
   * for each iteration. The `fn` callback receives the following parameters:
   * `(r,g,b,a,index,i,j)`, where `r,g,b,a` represents the pixel color with
   * alpha channel, `index` represents the position in the major-row order
   * array and `i,j` the respective indexes positions in two dimensions.
   * @param {array} pixels The pixels in a linear [r,g,b,a,...] array to loop
   *     through.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {function} fn The callback function for each pixel.
   * @param {number} opt_jump Optional jump for the iteration, by default it
   *     is 1, hence loops all the pixels of the array.
   * @static
   */
  tracking.Matrix.forEach = function(pixels, width, height, fn, opt_jump) {
    opt_jump = opt_jump || 1;
    for (var i = 0; i < height; i += opt_jump) {
      for (var j = 0; j < width; j += opt_jump) {
        var w = i * width * 4 + j * 4;
        fn.call(this, pixels[w], pixels[w + 1], pixels[w + 2], pixels[w + 3], w, i, j);
      }
    }
  };

}());
