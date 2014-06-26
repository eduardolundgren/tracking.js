(function() {
  /**
   * Matrix utility.
   * @static
   * @constructor
   */
  tracking.Matrix = {};

  /**
   * Loops the array organized as major-row order and executes `fn` callback for
   * each iteration. The `fn` callback receives the following parameters:
   * `(r,g,b,a,index,i,j)`, where `r,g,b,a` represents the pixel color with
   * alpha channel, `index` represents the position in the major-row order array
   * and `i,j` the respective indexes positions in two dimentions.
   * @param {Uint8ClampedArray} pixels The pixels to loop through.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {function} fn The callback function for each pixel.
   * @param {number} opt_jump Optional jump for the iteration, by default it is
   *     1, hence loops all the pixels of the array.
   * @static
   */
  tracking.Matrix.forEach = function(pixels, width, height, fn, opt_jump) {
    var jump = opt_jump || 1,
      i = 0,
      j = 0,
      w;

    for (i = 0; i < height; i += jump) {
      for (j = 0; j < width; j += jump) {
        w = i * width * 4 + j * 4;
        fn.call(this, pixels[w], pixels[w + 1], pixels[w + 2], pixels[w + 3], w, i, j);
      }
    }
  };

  /**
   * Loops the pixels array modifying each pixel based on `fn` transformation
   * function.
   * @param {Uint8ClampedArray} pixels The pixels to transform.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {function} fn The transformation function.
   * @return {Uint8ClampedArray} The transformed pixels.
   * @static
   */
  tracking.Matrix.transform = function(pixels, width, height, fn) {
    tracking.Matrix.forEach(pixels, width, height, function(r, g, b, a, w) {
      var pixel = fn.apply(null, arguments);
      pixels[w] = pixel[0];
      pixels[w + 1] = pixel[1];
      pixels[w + 2] = pixel[2];
      pixels[w + 3] = pixel[3];
    });
    return pixels;
  };
}());
