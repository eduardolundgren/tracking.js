(function() {
  /**
   * Matrix utility.
   * @static
   * @constructor
   */
  tracking.Matrix = function (obj) {
    var instance = this,
      matrix = obj.matrix,
      rows = obj.rows,
      cols = obj.cols;
    
    if (matrix) {
      rows = matrix.length;
      cols = matrix[0].length;
    }
    else {
      matrix = new Array(rows);

      for (var i = 0; i < rows; i++) {
        matrix[i] = new Array(cols);
      }
    }
    instance.data = matrix;
    instance._rows = rows;
    instance._cols = cols;
  };

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
    opt_jump = opt_jump || 1;
    for (var i = 0; i < height; i += opt_jump) {
      for (var j = 0; j < width; j += opt_jump) {
        var w = i * width * 4 + j * 4;
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

  tracking.Matrix.prototype.invert3by3 = function () {
    var instance = this,
        data = instance.data,
        result = new tracking.Matrix({rows: 3, cols: 3}),
        resultData = result.data,
        determinant = instance.determinant3by3_();

    resultData[0][0] = (data[1][1] * data[2][2] - (data[2][1] * data[1][2]))/determinant;
    resultData[1][0] = -(data[1][0] * data[2][2] - (data[1][2] * data[2][0]))/determinant;
    resultData[2][0] = (data[1][0] * data[2][1] - (data[1][1] * data[2][0]))/determinant;

    resultData[0][1] = -(data[0][1] * data[2][2] - (data[0][2] * data[2][1]))/determinant;
    resultData[1][1] = (data[0][0] * data[2][2] - (data[0][2] * data[2][0]))/determinant;
    resultData[2][1] = -(data[0][0] * data[2][1] - (data[0][1] * data[2][0]))/determinant;

    resultData[0][2] = (data[0][1] * data[1][2] - (data[0][2] * data[1][1]))/determinant;
    resultData[1][2] = -(data[0][0] * data[1][2] - (data[0][2] * data[1][0]))/determinant;
    resultData[2][2] = (data[0][0] * data[1][1] - (data[0][1] * data[1][0]))/determinant;

    return result;
  };

  tracking.Matrix.prototype.determinant3by3_ = function () {
    var instance = this,
        data = instance.data,
        result;

    result = data[0][0] * data[1][1] * data[2][2];
    result += data[1][0] * data[2][1] * data[0][2];
    result += data[2][0] * data[0][1] * data[1][2];

    result -= data[0][2] * data[1][1] * data[2][0];
    result -= data[1][2] * data[2][1] * data[0][0];
    result -= data[2][2] * data[0][1] * data[1][0];

    return result;
  };

  tracking.Matrix.prototype.multiply = function(matrix) {
    var instance = this,
      thisMatrix = instance.data,
      thisRows = instance._rows,
      thisCols = instance._cols,
      thatMatrix = matrix.data,
      thatCols = matrix._cols,
      result = new tracking.Matrix({rows: thisRows, cols: thatCols}),
      resultMatrix = result.data;

    for (var i = thisRows - 1; i >= 0; i--) {
      for (var j = thatCols - 1; j >= 0; j--) {
        resultMatrix[i][j] = 0;// perguntar a galera sobre criar matriz zeradas
        for (var k = thisCols - 1; k >= 0; k--) {
          resultMatrix[i][j] += thisMatrix[i][k] * thatMatrix[k][j];
        }
      }
    }

    return result;
  };

  tracking.Matrix.prototype.subtract = function(matrix) {
    var instance = this,
      thisMatrix = instance.data,
      thisRows = instance._rows,
      thisCols = instance._cols,
      thatMatrix = matrix.data,
      result = new tracking.Matrix({rows: thisRows, cols: thisCols}),
      resultMatrix = result.data;

    for (var i = thisRows - 1; i >= 0; i--) {
      for (var j = thisCols - 1; j >= 0; j--) {
        resultMatrix[i][j] = thisMatrix[i][j] - thatMatrix[i][j];
      }
    }

    return result;
  };

  tracking.Matrix.prototype.transpose = function () {
    var instance = this,
      thisRows = instance._rows,
      thisCols = instance._cols,
      matrix = instance.data,
      result = new tracking.Matrix({rows: thisCols, cols: thisRows}),
      resultMatrix = result.data;

    for (var i = thisRows - 1; i >= 0; i--) {
      for (var j = thisCols - 1; j >= 0; j--) {
        resultMatrix[j][i] = matrix[i][j];
      }
    }
    return result;
  };

  tracking.Matrix.prototype.rowEchelon = function () {
    var instance = this,
      thisRows = instance._rows,
      thisCols = instance._cols,
      matrix = instance.data;

    for (var i = 0; i < thisRows; i++) {
      for (var j = i + 1; j < thisRows; j++) {
        for (var k = thisCols-1; k >= 0; k--) {
          matrix[j][k] = matrix[j][k] - matrix[i][k]*matrix[j][i]/matrix[i][i];
        }
      }
    }
    return instance;
  };

  tracking.Matrix.prototype.reducedRowEchelon = function() {
    var instance = this,
        rows = instance._rows,
        cols = instance._cols,
        tempRow,
        lead = 0,
        val,
        r,
        i,
        j;

    for (r = 0; r < rows; r++) {
      if (cols <= lead) {
        return instance;
      }
      i = r;
      while (instance.data[i][lead] === 0) {
        i++;
        if (rows === i) {
          i = r;
          lead++;
          if (cols === lead) {
            return instance;
          }
        }
      }

      tempRow = instance.data[i];
      instance.data[i] = instance.data[r];
      instance.data[r] = tempRow;

      val = instance.data[r][lead];
      for (j = 0; j < cols; j++) {
        instance.data[r][j] /= val;
      }

      for (i = 0; i < rows; i++) {
        if (i !== r) {
          val = instance.data[i][lead];
          for ( j = 0; j < cols; j++) {
            instance.data[i][j] -= val * instance.data[r][j];
          }
        }
      }
      lead++;
    }
    return instance;
  };

  tracking.Matrix.prototype.toString = function () {
    var instance = this,
      thisRows = instance._rows,
      thisCols = instance._cols,
      matrix = instance.data,
      result = '';

    for (var i = 0; i < thisRows; i++) {
      result += '[\t';
      for (var j = 0; j < thisCols; j++) {
        result += matrix[i][j] + '\t';
      }
      result += ']\n';
    }
    return result;
  };

}());
