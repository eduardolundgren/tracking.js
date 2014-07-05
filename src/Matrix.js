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
   * array and `i,j` the respective indexes positions in two dimentions.
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
   * Computes the integral image and the integral image squared of the input
   * pixels. The input pixels will be converted to grayscale using the
   * following transformation, `~~(r * 0.299 + b * 0.587 + g * 0.114)`. A
   * summed area table is a data structure and algorithm for quickly and
   * efficiently generating the sum of values in a rectangular subset of a
   * grid. In the image processing domain, it is also known as an integral
   * image.
   * @param {array} pixels The pixels in a linear [r,g,b,a,...] array to loop
   *     through.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @return {Array.<Array.<number>>} Array containing in the first position
   *     the integral image and in the second position the integral image
   *     squared.
   * @static
   */
  tracking.Matrix.computeIntergralImage = function(pixels, width, height) {
    var integralImage = new Int32Array(width * height),
      integralImageSquare = new Int32Array(width * height),
      position = 0,
      pixelSum = 0,
      pixelSumSquare = 0;

    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        var w = i * width * 4 + j * 4;
        var pixel = ~~(pixels[w] * 0.299 + pixels[w+1] * 0.587 + pixels[w+2] * 0.114);

        if (i === 0 && j === 0) {
          pixelSum = pixel;
          pixelSumSquare = pixel * pixel;
        } else if (i === 0) {
          pixelSum = pixel + integralImage[i * width + (j - 1)];
          pixelSumSquare = pixel * pixel + integralImageSquare[i * width + (j - 1)];
        } else if (j === 0) {
          pixelSum = pixel + integralImage[(i - 1) * width + j];
          pixelSumSquare = pixel * pixel + integralImageSquare[(i - 1) * width + j];
        } else {
          pixelSum = pixel + integralImage[i * width + (j - 1)] + integralImage[(i - 1) * width + j] - integralImage[(i - 1) * width + (j - 1)];
          pixelSumSquare = pixel * pixel + integralImageSquare[i * width + (j - 1)] + integralImageSquare[(i - 1) * width + j] - integralImageSquare[(i - 1) * width + (j - 1)];
        }

        integralImage[position] = pixelSum;
        integralImageSquare[position] = pixelSumSquare;
        position++;
      }
    }

    return [
      integralImage,
      integralImageSquare
    ];
  };

}());
