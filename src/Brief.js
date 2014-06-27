(function() {
  /**
   * Brief intends for "Binary Robust Independent Elementary Features".This
   * method generates a binary string for each keypoint found by an extractor
   * method.
   * @static
   * @constructor
   */
  tracking.Brief = {};

  /**
   * The set of binary tests is defined by the nd (x,y)-location pairs
   * uniquely chosen during the initialization. Values could vary between N =
   * 128,256,512. N=128 yield good compromises between speed, storage
   * efficiency, and recognition rate.
   * @type {number}
   */
  tracking.Brief.N = 128;

  /**
   * Caches coordinates values of (x,y)-location pairs uniquely chosen during
   * the initialization.
   * @type {Object.<number, Int32Array>}
   * @private
   * @static
   */
  tracking.Brief.randomOffsets_ = {};

  /**
   * Generates a brinary string for each found keypoints extracted using an
   * extractor method.
   * @param {array} The grayscale pixels in a linear [p1,p2,...] array.
   * @param {number} width The image width.
   * @param {array} keypoints
   * @return {Int32Array} Returns an array where for each four sequence int
   *     values represent the descriptor binary string (128 bits) necessary
   *     to describe the corner, e.g. [0,0,0,0, 0,0,0,0, ...].
   */
  tracking.Brief.getDescriptors = function(pixels, width, keypoints) {
    // Optimizing divide by four operation using binary shift
    // (this.N >> 5) === this.N/4.
    var descriptors = new Int32Array(keypoints.length * (this.N >> 5)),
      descriptorWord = 0,
      offsets = this.getRandomOffsets_(width),
      position = 0;

    for (var i = 0; i < keypoints.length; i += 2) {
      var w = width * keypoints[i + 1] + keypoints[i];

      for (var j = 0, n = this.N; j < n; j++) {
        if (pixels[offsets[j + j] + w] < pixels[offsets[j + j + 1] + w]) {
          // TODO: Add comment.
          descriptorWord |= 1 << (j & 31);
        }

        // TODO: Add comment.
        if (!((j + 1) & 31)) {
          descriptors[position++] = descriptorWord;
          descriptorWord = 0;
        }
      }
    }

    return descriptors;
  };

  /**
   * Matches sets of features {mi} and {m′j} extracted from two images taken
   * from similar, and often successive, viewpoints. A classical procedure
   * runs as follows. For each point {mi} in the first image, search in a
   * region of the second image around location {mi} for point {m′j}. The
   * search is based on the similarity of the local image windows, also known
   * as kernel windows, centered on the points, which strongly characterizes
   * the points when the images are sufficiently close. Once each keypoint is
   * described with its binary string, they need to be compared with the
   * closest matching point. Distance metric is critical to the performance of
   * in- trusion detection systems. Thus using binary strings reduces the size
   * of the descriptor and provides an interesting data structure that is fast
   * to operate whose similarity can be measured by the Hamming distance.
   * @param {array} keypoints1
   * @param {array} descriptors1
   * @param {array} keypoints2
   * @param {array} descriptors2
   * @return {Int32Array} Returns an array where the index is the corner1
   *     index coordinate, and the value is the corresponding match index of
   *     corner2, e.g. keypoints1=[x0,y0,x1,y1,...] and
   *     keypoints2=[x'0,y'0,x'1,y'1,...], if x0 matches x'1 and x1 matches x'0,
   *     the return array would be [3,0].
   */
  tracking.Brief.match = function(keypoints1, descriptors1, keypoints2, descriptors2) {
    var len1 = keypoints1.length >> 1;
    var len2 = keypoints2.length >> 1;
    var matches = new Int32Array(len1);

    for (var i = 0; i < len1; i++) {
      var min = Infinity;
      var minj = 0;
      for (var j = 0; j < len2; j++) {
        var dist = 0;
        // Optimizing divide by four operation using binary shift
        // (this.N >> 5) === this.N/4.
        for (var k = 0, n = this.N >> 5; k < n; k++) {
          dist += tracking.Math.hammingWeight(descriptors1[i * n + k] ^ descriptors2[j * n + k]);
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

  /**
   * Gets the coordinates values of (x,y)-location pairs uniquely chosen
   * during the initialization.
   * @param {number} width The image width.
   * @return {array} Array with the random offset values.
   */
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
