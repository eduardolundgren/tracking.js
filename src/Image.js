(function() {
  /**
   * Image utility.
   * @static
   * @constructor
   */
  tracking.Image = {};

  /**
   * Converts a color from a colorspace based on an RGB color model to a
   * grayscale representation of its luminance. The coefficients represent the
   * measured intensity perception of typical trichromat humans, in
   * particular, human vision is most sensitive to green and least sensitive
   * to blue.
   * @param {Uint8ClampedArray} pixels The pixels in a linear [r,g,b,a,...]
   *     array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @return {Uint8ClampedArray} The grayscale pixels in a linear [p1,p2,...]
   *     array, where `pn = rn*0.299 + gn*0.587 + bn*0.114`.
   * @static
   */
  tracking.Image.calculateLumaGrayscale = function(pixels, width, height) {
    var gray = new Uint8ClampedArray(width * height);
    var p = 0;
    var w = 0;
    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        gray[p++] = pixels[w]*0.299 + pixels[w + 1]*0.587 + pixels[w + 2]*0.114;
        w += 4;
      }
    }
    return gray;
  };
}());
