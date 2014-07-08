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
   * Computes the integral image, the integral image squared and the integral
   * image for sobel for the input pixels. The pixels are converted to
   * grayscale before compute integral image.
   * @param {array} pixels The pixels in a linear [r,g,b,a,...] array to loop
   *     through.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {array} opt_integralImage Empty array of size `width * height` to
   *     be filled with the integral image values. If not specified compute sum
   *     values will be skipped.
   * @param {array} opt_integralImageSquare Empty array of size `width *
   *     height` to be filled with the integral image squared values. If not
   *     specified compute squared values will be skipped.
   * @param {array} opt_integralImageSobel Empty array of size `width *
   *     height` to be filled with the integral image of sobel values. If not
   *     specified compute sobel filtering will be skipped.
   * @static
   */
  tracking.Matrix.computeIntergralImage = function(pixels, width, height, opt_integralImage, opt_integralImageSquare, opt_integralImageSobel) {
    if (arguments.length < 4) {
      throw new Error('You should specify at least one output array in the order: sum, square, sobel.');
    }
    var pixelsSobel;
    if (opt_integralImageSobel) {
      pixelsSobel = tracking.Image.sobel(pixels, width, height);
    }
    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        var w = i * width * 4 + j * 4;
        var pixel = ~~(pixels[w] * 0.299 + pixels[w + 1] * 0.587 + pixels[w + 2] * 0.114);
        if (opt_integralImage) {
          this.integralImageSum_(pixels, width, opt_integralImage, i, j, pixel);
        }
        if (opt_integralImageSquare) {
          this.integralImageSquare_(pixels, width, opt_integralImageSquare, i, j, pixel);
        }
        if (opt_integralImageSobel) {
          this.integralImageSquare_(pixels, width, opt_integralImageSobel, i, j, pixelsSobel[w]);
        }
      }
    }
  };

  /**
   * Helper method to compute the integral image squared.
   * @param {array} pixels The pixels in a linear [r,g,b,a,...] array to loop
   *     through.
   * @param {number} width The image width.
   * @param {array} integralImage Empty array of size `width * height` to
   *     be filled with the integral image values. If not specified compute sum
   *     values will be skipped.
   * @param {number} i Vertical position of the pixel to be evaluated.
   * @param {number} j Horizontal position of the pixel to be evaluated.
   * @param {number} pixel Pixel value to be added to the integral image.
   * @static
   * @private
   */
  tracking.Matrix.integralImageSquare_ = function(pixels, width, integralImageSquare, i, j, pixel) {
    var value = 0;
    if (i === 0 && j === 0) {
      value = pixel * pixel;
    } else if (i === 0) {
      value = pixel * pixel + integralImageSquare[i * width + (j - 1)];
    } else if (j === 0) {
      value = pixel * pixel + integralImageSquare[(i - 1) * width + j];
    } else {
      value = pixel * pixel + integralImageSquare[i * width + (j - 1)] + integralImageSquare[(i - 1) * width + j] - integralImageSquare[(i - 1) * width + (j - 1)];
    }
    integralImageSquare[i * width + j] = value;
  };

  /**
   * Helper method to compute the integral image sum.
   * @param {array} pixels The pixels in a linear [r,g,b,a,...] array to loop
   *     through.
   * @param {number} width The image width.
   * @param {array} integralImage Empty array of size `width * height` to
   *     be filled with the integral image values. If not specified compute sum
   *     values will be skipped.
   * @param {number} i Vertical position of the pixel to be evaluated.
   * @param {number} j Horizontal position of the pixel to be evaluated.
   * @param {number} pixel Pixel value to be added to the integral image.
   * @static
   * @private
   */
  tracking.Matrix.integralImageSum_ = function(pixels, width, integralImage, i, j, pixel) {
    var value = 0;
    if (i === 0 && j === 0) {
      value = pixel;
    } else if (i === 0) {
      value = pixel + integralImage[i * width + (j - 1)];
    } else if (j === 0) {
      value = pixel + integralImage[(i - 1) * width + j];
    } else {
      value = pixel + integralImage[i * width + (j - 1)] + integralImage[(i - 1) * width + j] - integralImage[(i - 1) * width + (j - 1)];
    }
    integralImage[i * width + j] = value;
  };

}());
