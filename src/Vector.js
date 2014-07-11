(function() {
  /**
   * Vector utility.
   * @static
   * @constructor
   */
  tracking.Vector = function (obj) {
    var instance = this,
      matrix = obj.matrix,
      dimension = obj.dimension;
    if (Array.isArray(obj)) {
      matrix = (new tracking.Matrix({matrix: [obj]})).transpose();
    }
    if (matrix) {
      dimension = matrix._rows;
    }
    else if (dimension) {
      matrix = new tracking.Matrix({rows: dimension, cols: 1});
    }
    instance._matrix = matrix;
    instance._dimension = dimension;
  };

  tracking.Vector.subtract = function(vector1, vector2) {
    return new tracking.Vector({matrix: vector1._matrix.subtract(vector2._matrix)});
  };

  tracking.Vector.prototype.squaredNorm = function() {
    var matrix = this._matrix;

    return matrix.transpose().multiply(matrix).data[0][0];
  };

  tracking.Vector.prototype.norm = function() {
    return Math.sqrt(this.squaredNorm());
  };

  tracking.Vector.prototype.toString = function () {
    return this._matrix.toString();
  };

  tracking.Vector.prototype.multiply = function (k) {
    var data = [],
        dimension = this._dimension;

    for (var i = 0; i < dimension; i++) {
      data.push(this._matrix.data[i][0]*k);
    }

    return new tracking.Vector(data);
  };
}());