(function() {
  /**
   * Brief utility.
   * @static
   * @constructor
   */
  tracking.Brief = {};

  tracking.Brief.N = 128;

  tracking.Brief.randomOffsets_ = {};

  tracking.Brief.getDescriptors = function(grayScale, width, corners) {
    var descriptors = new Int32Array(corners.length * (this.N >> 5)),
      descriptorWord = 0,
      offsets = this.getRandomOffsets_(width),
      position = 0;

    for (var i = 0; i < corners.length; i += 2) {
      var w = width*corners[i + 1] + corners[i];

      for (var j = 0, n = this.N; j < n; j ++) {
        if (grayScale[offsets[j + j] + w] < grayScale[offsets[j + j + 1] + w]) {
          descriptorWord |= 1 << (j & 31);
        }

        if (!((j + 1) & 31)) {
          descriptors[position++] = descriptorWord;
          descriptorWord = 0;
        }
      }
    }

    return descriptors;
  };

  tracking.Brief.match = function(corners1, descriptors1, corners2, descriptors2) {
    var len1 = corners1.length >> 1;
    var len2 = corners2.length >> 1;
    var matches = new Int32Array(len1);

    for (var i = 0; i < len1; i++) {
      var min = Infinity;
      var minj = 0;
      for (var j = 0; j < len2; j++) {
        var dist = 0;
        for (var k = 0, n = this.N >> 5; k < n; k++) {
          dist += tracking.Math.hammingWeight(descriptors1[i*n + k] ^ descriptors2[j*n + k]);
        }
        if (dist < min) {
          min = dist;
          minj = j;
        }
      }
      matches[i] = minj;
    }

    return matches;
  };

  tracking.Brief.getRandomOffsets_ = function(width) {
    if (this.randomOffsets_[width]) {
      return this.randomOffsets_[width];
    }

    var offsets = new Int32Array(2 * this.N),
      position = 0;

    for (var i = 0; i < this.N; i++) {
      offsets[position++] = tracking.Math.uniformRandom(-15, 16) * width + tracking.Math.uniformRandom(-15, 16);
      offsets[position++] = tracking.Math.uniformRandom(-15, 16) * width + tracking.Math.uniformRandom(-15, 16);
    }

    this.randomOffsets_[width] = offsets;
    return this.randomOffsets_[width];
  };
}());
