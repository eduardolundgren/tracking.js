/**
 * tracking.js - Augmented Reality JavaScript Framework.
 * @author Eduardo Lundgren <edu@rdo.io>
 * @version v1.0.0-alpha
 * @link http://trackingjs.com
 * @license BSD
 */
(function(window, undefined) {
  window.tracking = window.tracking || {};

  /**
   * Loops through an array or object.
   * @param {array | object} o Array or object to loops through.
   * @param {function} fn Callback
   * @param {object} opt_context Callback execution scope.
   * @return {object} The array or object that was iterated.
   */
  tracking.forEach = function(o, fn, opt_context) {
    var key;
    if (Array.isArray(o)) {
      o.forEach(function() {
        fn.apply(opt_context, arguments);
      });
    } else {
      for (key in o) {
        if (o.hasOwnProperty(key)) {
          fn.call(opt_context, o[key], key, o);
        }
      }
    }
    return o;
  };

  /**
   * Inherit the prototype methods from one constructor into another.
   *
   * Usage:
   * <pre>
   * function ParentClass(a, b) { }
   * ParentClass.prototype.foo = function(a) { }
   *
   * function ChildClass(a, b, c) {
   *   tracking.base(this, a, b);
   * }
   * tracking.inherits(ChildClass, ParentClass);
   *
   * var child = new ChildClass('a', 'b', 'c');
   * child.foo();
   * </pre>
   *
   * @param {Function} childCtor Child class.
   * @param {Function} parentCtor Parent class.
   */
  tracking.inherits = function(childCtor, parentCtor) {
    function TempCtor() {
    }
    TempCtor.prototype = parentCtor.prototype;
    childCtor.superClass_ = parentCtor.prototype;
    childCtor.prototype = new TempCtor();
    childCtor.prototype.constructor = childCtor;

    /**
     * Calls superclass constructor/method.
     *
     * This function is only available if you use tracking.inherits to express
     * inheritance relationships between classes.
     *
     * @param {!object} me Should always be "this".
     * @param {string} methodName The method name to call. Calling superclass
     *     constructor can be done with the special string 'constructor'.
     * @param {...*} var_args The arguments to pass to superclass
     *     method/constructor.
     * @return {*} The return value of the superclass method/constructor.
     */
    childCtor.base = function(me, methodName) {
      var args = Array.prototype.slice.call(arguments, 2);
      return parentCtor.prototype[methodName].apply(me, args);
    };
  };

  /**
   * Captures the user camera when tracking a video element and set its source
   * to the camera stream.
   * @param {HTMLVideoElement} element Canvas element to track.
   * @param {object} opt_options Optional configuration to the tracker.
   */
  tracking.initUserMedia_ = function(element, opt_options) {
    window.navigator.getUserMedia({
      video: true,
      audio: opt_options.audio
    }, function(stream) {
      try {
        element.src = window.URL.createObjectURL(stream);
      } catch (err) {
        element.src = stream;
      }
    }, function() {
      throw Error('Cannot capture user camera.');
    });
  };

  /**
   * Tests whether the object is a dom node.
   * @param {object} o Object to be tested.
   * @return {boolean} True if the object is a dom node.
   */
  tracking.isNode = function(o) {
    return o.nodeType || this.isWindow(o);
  };

  /**
   * Tests whether the object is the `window` object.
   * @param {object} o Object to be tested.
   * @return {boolean} True if the object is the `window` object.
   */
  tracking.isWindow = function(o) {
    return !!(o && o.alert && o.document);
  };

  /**
   * Extends an object with another object. This operates 'in-place'; it does
   * not create a new Object.
   *
   * Example:
   * var o = {};
   * extend(o, {a: 0, b: 1});
   * o; // {a: 0, b: 1}
   * extend(o, {b: 2, c: 3});
   * o; // {a: 0, b: 2, c: 3}
   *
   * @param {object} target The object to modify. Existing properties will be
   *     overwritten if they are also present in one of the objects in `source`.
   * @param {object} source The object from which values will be copied.
   * @return {object} The extended target object.
   */
  tracking.merge = function(target, source) {
    for (var key in source) {
      target[key] = source[key];
    }
    return target;
  };

  /**
   * Selects a dom node from a CSS3 selector using `document.querySelector`.
   * @param {string} selector
   * @param {object} opt_element The root element for the query. When not
   *     specified `document` is used as root element.
   * @return {HTMLElement} The first dom element that matches to the selector.
   *     If not found, returns `null`.
   */
  tracking.one = function(selector, opt_element) {
    if (this.isNode(selector)) {
      return selector;
    }
    return (opt_element || document).querySelector(selector);
  };

  /**
   * Tracks a canvas, image or video element based on the specified `tracker`
   * instance. This method extract the pixel information of the input element
   * to pass to the `tracker` instance. When tracking a video, the
   * `tracker.track(pixels, width, height)` will be in a
   * `requestAnimationFrame` loop in order to track all video frames.
   *
   * Example:
   * var tracker = new tracking.ColorTracker();
   *
   * tracking.track('#video', tracker);
   * or
   * tracking.track('#video', tracker, { camera: true });
   *
   * tracker.onFound = function(payload) {
   *   // console.log(payload[0].x, payload[0].y)
   * };
   *
   * @param {HTMLElement} element The element to track, canvas, image or
   *     video.
   * @param {tracking.Tracker} tracker The tracker instance used to track the
   *     element.
   * @param {object} opt_options Optional configuration to the tracker.
   */
  tracking.track = function(element, tracker, opt_options) {
    element = tracking.one(element);
    if (!element) {
      throw new Error('Element not found, try a different element or selector.');
    }
    if (!tracker) {
      throw new Error('Tracker not specified, try `tracking.track(element, new tracking.FaceTracker())`.');
    }

    switch (element.nodeName.toLowerCase()) {
      case 'canvas':
        return this.trackCanvas_(element, tracker, opt_options);
      case 'img':
        return this.trackImg_(element, tracker, opt_options);
      case 'video':
        if (opt_options) {
          if (opt_options.camera) {
            this.initUserMedia_(element, opt_options);
          }
        }
        return this.trackVideo_(element, tracker, opt_options);
      default:
        throw new Error('Element not supported, try in a canvas, img, or video.');
    }
  };

  /**
   * Tracks a canvas element based on the specified `tracker` instance. This
   * method extract the pixel information of the input element to pass to the
   * `tracker` instance.
   * @param {HTMLCanvasElement} element Canvas element to track.
   * @param {tracking.Tracker} tracker The tracker instance used to track the
   *     element.
   * @param {object} opt_options Optional configuration to the tracker.
   * @private
   */
  tracking.trackCanvas_ = function(element, tracker) {
    var width = element.width;
    var height = element.height;
    var context = element.getContext('2d');
    var imageData = context.getImageData(0, 0, width, height);
    tracker.track(imageData.data, width, height);
  };

  /**
   * Tracks a image element based on the specified `tracker` instance. This
   * method extract the pixel information of the input element to pass to the
   * `tracker` instance.
   * @param {HTMLImageElement} element Canvas element to track.
   * @param {tracking.Tracker} tracker The tracker instance used to track the
   *     element.
   * @param {object} opt_options Optional configuration to the tracker.
   * @private
   */
  tracking.trackImg_ = function(element, tracker) {
    var width = element.width;
    var height = element.height;
    var canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    tracking.Canvas.loadImage(canvas, element.src, 0, 0, width, height, function() {
      tracking.trackCanvas_(canvas, tracker);
    });
  };

  /**
   * Tracks a video element based on the specified `tracker` instance. This
   * method extract the pixel information of the input element to pass to the
   * `tracker` instance. The `tracker.track(pixels, width, height)` will be in
   * a `requestAnimationFrame` loop in order to track all video frames.
   * @param {HTMLVideoElement} element Canvas element to track.
   * @param {tracking.Tracker} tracker The tracker instance used to track the
   *     element.
   * @param {object} opt_options Optional configuration to the tracker.
   * @private
   */
  tracking.trackVideo_ = function(element, tracker) {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var width;
    var height;

    var resizeCanvas_ = function() {
      width = element.offsetWidth;
      height = element.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };

    resizeCanvas_();

    element.addEventListener('resize', resizeCanvas_);

    var requestFrame_ = function() {
      window.requestAnimationFrame(function() {
        if (element.readyState === element.HAVE_ENOUGH_DATA) {
          // Firefox v~30.0 gets confused with the video readyState firing an
          // erroneous HAVE_ENOUGH_DATA just before HAVE_CURRENT_DATA state,
          // hence keep trying to read it until resolved.
          try {
            context.drawImage(element, 0, 0, width, height);
          } catch(err) {}
          tracking.trackCanvas_(canvas, tracker);
        }
        requestFrame_();
      });
    };
    requestFrame_();
  };

  // Browser polyfills
  //===================

  if (!window.URL) {
    window.URL = window.URL || window.webkitURL || window.msURL || window.oURL;
  }

  if (!navigator.getUserMedia) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia || navigator.msGetUserMedia;
  }
}(window));

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
    var descriptors = new Int32Array(keypoints.length * (this.N >> 5));
    var descriptorWord = 0;
    var offsets = this.getRandomOffsets_(width);
    var position = 0;

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

(function() {
  /**
   * Canvas utility.
   * @static
   * @constructor
   */
  tracking.Canvas = {};

  /**
   * Loads an image source into the canvas.
   * @param {HTMLCanvasElement} canvas The canvas dom element.
   * @param {string} src The image source.
   * @param {number} x The canvas horizontal coordinate to load the image.
   * @param {number} y The canvas vertical coordinate to load the image.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {function} opt_callback Callback that fires when the image is loaded
   *     into the canvas.
   * @static
   */
  tracking.Canvas.loadImage = function(canvas, src, x, y, width, height, opt_callback) {
    var instance = this;
    var img = new window.Image();

    img.onload = function() {
      var context = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;
      context.drawImage(img, x, y, width, height);
      if (opt_callback) {
        opt_callback.call(instance);
      }
      img = null;
    };
    img.src = src;
  };
}());

(function() {
  /**
   * EPnp utility.
   * @static
   * @constructor
   */
  tracking.EPnP = function () {
  };

  tracking.EPnP.prototype.initPoints = function(objectPoints, imagePoints) {
    var instance = this,
        numberOfCorrespondences = instance.numberOfCorrespondences,
        pws = instance.pws,
        us = instance.us;

    for(var i = 0; i < numberOfCorrespondences; i++)
    {
      pws[3 * i    ] = objectPoints[i].x;
      pws[3 * i + 1] = objectPoints[i].y;
      pws[3 * i + 2] = objectPoints[i].z;

      us[2 * i    ] = imagePoints[i].x*instance.fu + instance.uc;
      us[2 * i + 1] = imagePoints[i].y*instance.fv + instance.vc;
    }
  };

  tracking.EPnP.prototype.initCameraParameters = function(cameraMatrix) {
    var instance = this;

    instance.uc = cameraMatrix[0*3 + 2];
    instance.vc = cameraMatrix[1*3 + 2];
    instance.fu = cameraMatrix[0*3 + 0];
    instance.fv = cameraMatrix[1*3 + 1];
  };

  tracking.EPnP.prototype.init = function(objectPoints, imagePoints, cameraMatrix) {
    var instance = this,
        numberOfCorrespondences = objectPoints.length;

    instance.initCameraParameters(cameraMatrix);

    instance.numberOfCorrespondences = numberOfCorrespondences;
    instance.pws = new Float64Array(3*numberOfCorrespondences);
    instance.us = new Float64Array(2*numberOfCorrespondences);

    instance.initPoints(objectPoints, imagePoints);

    instance.alphas = new Float64Array(4*numberOfCorrespondences);
    instance.pcs = new Float64Array(3*numberOfCorrespondences);

    instance.max_nr = 0;
  };

  // Decompose a m x n matrix using SVD
  tracking.EPnP.prototype.svd = function(A, m, n, W, U, V) {
    var matrix = [], i, j;

    for (i = 0; i < m; i++) {
      matrix.push([]);
      for (j = 0; j < n; j++) {
        matrix[i].push(A[i*n+j]);
      }
    }
    
    var output = numeric.svd(matrix),
        w = output.S,
        u = output.U,
        v = output.V;

    if (W) {
      for (i = 0; i < w.length; i++) {
        W[i] = w[i];
      }
    }

    if (U) {
      for (i = 0; i < m; i++) {
        for (j = 0; j < m; j++) {
          U[i*m + j] = u[i][j];
        }
      }
    }

    if (V) {
      for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
          V[i*n + j] = v[i][j];
        }
      }
    }
  };

  tracking.EPnP.prototype.invertSquare = function(src, n, dst) {
    var matrix = [], i, j;

    for (i = 0; i < n; i++) {
      matrix.push([]);
      for (j = 0; j < n; j++) {
        matrix[i].push(src[i*n+j]);
      }
    }

    matrix = numeric.inv(matrix);

    for (i = 0; i < n; i++) {
      for (j = 0; j < n; j++) {
        dst[i*n + j] = matrix[i][j];
      }
    }
  };

  tracking.EPnP.prototype.transpose = function(A, m, n, dst) {
    var i, j;
    for (i = 0; i < m; i++) {
      for (j = 0; j < n; j++) {
        dst[j*m+i] = A[i*n+j];
      }
    }
  };

  tracking.EPnP.prototype.multiply = function(A, B, m, n, o, dst) {
    var i, j, k;

    for (i = 0; i < m; i++) {
      for (j = 0; j < o; j++) {
        dst[i*o + j] = 0;
        for (k = 0; k < n; k++) {
          dst[i*o + j] += A[i*n+k]*B[k*o+j];
        }
      }
    }
  };

  tracking.EPnP.prototype.transposeSquare = function(A, n) {
    var i, j, temp;

    for (i = 1; i < n; i++) {
      for (j = 0; j < i; j++) {
        temp = A[i*n+j];
        A[i*n+j] = A[j*n+i];
        A[j*n+i] = temp;
      }
    }
  };

  // Calculates the product of a m x n matrix and its transposition.
  tracking.EPnP.prototype.mulTransposed = function(src, m, n, dst, order) {
    var i, j, k;
    if(order) {
      // dst = srct x src
      for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
          dst[i*n + j] = 0;
          for (k = 0; k < m; k++) {
            dst[i*n + j] += src[k*n+i]*src[k*n+j];
          }
        }
      }
    }
    else {
      // dst = src x srct
      for (i = 0; i < m; i++) {
        for (j = 0; j < m; j++) {
          dst[i*n + j] = 0;
          for (k = 0; k < n; k++) {
            dst[i*n + j] += src[i*n+k]*src[j*n+k]; 
          }
        }
      }
    }
  };

  // Solves a linear system Ax = b
  tracking.EPnP.prototype.solveLinearSystem = function(A, m, n, b, dst) {
    var leftSide = [], 
        rightSide = [],
        i, j;

    var At = new Float64Array(n * m),
        AtA = new Float64Array(n * n),
        Atb = new Float64Array(n);

    this.transpose(A, m, n, At);
    this.multiply(At, A, n, m, n, AtA);
    this.multiply(At, b, n, m, 1, Atb);

    //var vars = ['a', 'b', 'c', 'd', 'e', 'f'];
    for (i = 0; i < n; i++) {
      leftSide.push([]);
      for (j = 0; j < n; j++) {
        leftSide[i].push(AtA[i*n+j]);
      }
      rightSide.push(Atb[i]);
    }

    /*
    for (i = 0; i < m; i++) {
      leftSide.push([]);
      for (j = 0; j < n; j++) {
        leftSide[i].push(A[i*n+j]);
      }
      rightSide.push(b[i]);
    }*/
    
   
   // console.log('A', JSON.stringify(leftSide));
   // console.log('b', JSON.stringify(rightSide));

    var output = numeric.solve(leftSide, rightSide);

    for (i = 0; i < n; i++) {
      dst[i] = output[i];
    }

    /*/ <DEBUG>

    var temp = new Float64Array(m);
    console.log('Ax');
    this.multiply(A, dst, m, n, 1, temp);
    console.log(temp);
    console.log('b');
    console.log(b);


    temp = new Float64Array(n);
    console.log('AtAx');
    this.multiply(AtA, dst, n, n, 1, temp);
    console.log(temp);
    console.log('Atb');
    console.log(Atb);

    var inv = new Float64Array(n*n);
    var temp2 = numeric.inv(leftSide);
    for (i = 0; i < n; i++) {
      for (j= 0; j < n; j++) {
        inv[i*n+j] = temp2[i][j];
      }
    }
    var temp3 = new Float64Array(m);
    this.multiply(inv, Atb, n, n, 1, temp);
    this.multiply(A, temp, m, n, 1, temp3);
    console.log(' temp3');
    console.log(temp3);
    // </DEBUG> //*/
  };

  tracking.EPnP.prototype.chooseControlPoints = function() {
    var instance = this,
        cws = new Float64Array(4*3),
        numberOfCorrespondences = instance.numberOfCorrespondences,
        pws = instance.pws,
        i,
        j;

    instance.cws = cws;

    // Take C0 as the reference points centroid:
    cws[0] = cws[1] = cws[2] = 0;

    for(i = 0; i < numberOfCorrespondences; i++) {
      for(j = 0; j < 3; j++) {
        cws[0*3 + j] += pws[3*i + j];
      }
    }

    for(j = 0; j < 3; j++){
      cws[0*3 + j] /= numberOfCorrespondences;
    }

    // Take C1, C2, and C3 from PCA on the reference points:
    var PW0 = new Float64Array(numberOfCorrespondences*3),
        PW0tPW0 = new Float64Array(3 * 3),
        DC = new Float64Array(3),
        UCt = new Float64Array(3 * 3);

    for(i = 0; i < numberOfCorrespondences; i++) {
      for(j = 0; j < 3; j++) {
        PW0[3 * i + j] = pws[3 * i + j] - cws[0 * 3 + j];
      }
    }

    instance.mulTransposed(PW0, numberOfCorrespondences, 3, PW0tPW0, 1);

    instance.svd(PW0tPW0, 3, 3, DC, UCt, 0);
    instance.transposeSquare(UCt, 3);

    for(i = 1; i < 4; i++) {
      var k = Math.sqrt(DC[i - 1] / numberOfCorrespondences);
      for(j = 0; j < 3; j++) {
        cws[i*3 + j] = cws[0*3 + j] + k * UCt[3 * (i - 1) + j];
      }
    }
  };

  tracking.EPnP.prototype.computeBarycentricCoordinates = function() {
    var instance = this,
        alphas = instance.alphas,
        cc = new Float64Array(3*3),
        ccInv = new Float64Array(3*3),
        cws = instance.cws,
        i,
        j,
        pws = instance.pws;

      for(i = 0; i < 3; i++) {
        for(j = 1; j < 4; j++) {
          cc[3 * i + j - 1] = cws[j * 3 + i] - cws[0 * 3 + i];
        }
      }

      instance.invertSquare(cc, 3, ccInv);

      for(i = 0; i < instance.numberOfCorrespondences; i++) {
        var pi = 3 * i,
            a = 4 * i;

        for(j = 0; j < 3; j++) {
          alphas[a + 1 + j] =
            ccInv[3 * j    ] * (pws[pi + 0] - cws[0]) +
            ccInv[3 * j + 1] * (pws[pi + 1] - cws[1]) +
            ccInv[3 * j + 2] * (pws[pi + 2] - cws[2]);
        }
        alphas[a + 0] = 1.0 - alphas[a + 1] - alphas[a + 2] - alphas[a + 3];
      }
    };

    tracking.EPnP.prototype.fillM = function(M, row, as, offset, u, v) {
      var instance = this,
          fu = instance.fu,
          fv = instance.fv,
          uc = instance.uc,
          vc = instance.vc,
          m1 = row * 12,
          m2 = m1 + 12;

      for(var i = 0; i < 4; i++) {
        M[m1 + 3 * i    ] = as[offset + i] * fu;
        M[m1 + 3 * i + 1] = 0.0;
        M[m1 + 3 * i + 2] = as[offset + i] * (uc - u);

        M[m2 + 3 * i    ] = 0.0;
        M[m2 + 3 * i + 1] = as[offset + i] * fv;
        M[m2 + 3 * i + 2] = as[offset + i] * (vc - v);
      }
    };

    tracking.EPnP.prototype.computeCCS = function(betas, ut) {
      var instance = this,
          ccs = new Float64Array(4 * 3),
          i,
          j,
          k;

      instance.ccs = ccs;

      for(i = 0; i < 4; i++) {
        ccs[i*3] = ccs[i*3 + 1] = ccs[i*3 + 2] = 0.0;
      }

      for(i = 0; i < 4; i++) {
        var v = 12 * (11 - i);
        for(j = 0; j < 4; j++){
          for(k = 0; k < 3; k++){
            ccs[j*3 + k] += betas[i] * ut[v + 3 * j + k];
          }
        }
      }
    };

    tracking.EPnP.prototype.computePCS = function() {
      var instance = this,
          alphas = instance.alphas,
          ccs = instance.ccs,
          pcs = new Float64Array(instance.numberOfCorrespondences*3),
          i,
          j;

      instance.pcs = pcs;

      for(i = 0; i < instance.numberOfCorrespondences; i++) {
        var a = 4 * i,
            pc = 3 * i;

        for(j = 0; j < 3; j++){
          pcs[pc + j] = alphas[a + 0] * ccs[0 * 3 + j] + 
                        alphas[a + 1] * ccs[1 * 3 + j] + 
                        alphas[a + 2] * ccs[2 * 3 + j] + 
                        alphas[a + 3] * ccs[3 * 3 + j];
        }
      }
    };

    tracking.EPnP.prototype.computePose = function(R, t) {
      var instance = this,
          numberOfCorrespondences = instance.numberOfCorrespondences,
          i,
          alphas = instance.alphas,
          us = instance.us;

      instance.chooseControlPoints();
      instance.computeBarycentricCoordinates();

      var M = new Float64Array(2 * numberOfCorrespondences * 12);

      for(i = 0; i < numberOfCorrespondences; i++) {
        instance.fillM(M, 2 * i, alphas, 4 * i, us[2 * i], us[2 * i + 1]);
      }

      var MtM = new Float64Array(12*12),
          D = new Float64Array(12),
          Ut = new Float64Array(12*12);

      instance.mulTransposed(M, 2*numberOfCorrespondences, 12, MtM, 1);

      instance.svd(MtM, 12, 12, D, Ut, 0);
      instance.transposeSquare(Ut, 12);

      var L_6x10 = new Float64Array(6 * 10),
          Rho = new Float64Array(6);

      instance.computeL6x10(Ut, L_6x10);
      instance.computeRho(Rho);

      var Betas = [new Float64Array(4), new Float64Array(4), new Float64Array(4), new Float64Array(4)],
          repErrors = new Float64Array(4),
          Rs = [new Float64Array(3*3), new Float64Array(3*3), new Float64Array(3*3), new Float64Array(3*3)],
          ts = [new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3)];

      instance.findBetasApprox1(L_6x10, Rho, Betas[1]);
      instance.gaussNewton(L_6x10, Rho, Betas[1]);
      repErrors[1] = instance.computeRAndT(Ut, Betas[1], Rs[1], ts[1]);

      instance.findBetasApprox2(L_6x10, Rho, Betas[2]);
      instance.gaussNewton(L_6x10, Rho, Betas[2]);
      repErrors[2] = instance.computeRAndT(Ut, Betas[2], Rs[2], ts[2]);

      instance.findBetasApprox3(L_6x10, Rho, Betas[3]);
      instance.gaussNewton(L_6x10, Rho, Betas[3]);
      repErrors[3] = instance.computeRAndT(Ut, Betas[3], Rs[3], ts[3]);

      var N = 1;
      if (repErrors[2] < repErrors[1]){
        N = 2;
      }
      if (repErrors[3] < repErrors[N]){
        N = 3;
      }

      instance.copyRAndT(Rs[N], ts[N], R, t);
    };

    tracking.EPnP.prototype.copyRAndT = function(Rsrc, Tsrc, Rdst, Tdst) {
      var i, j;

      for (i = 0; i < 3; i++) {
        for (j = 0; j < 3; j++) {
          Rdst[3*i + j] = Rsrc[3*i + j];
        }
        Tdst[i] = Tsrc[i];
      }
    };

    tracking.EPnP.prototype.dist2 = function(p1, p1offset, p2, p2offset) {
      return (p1[p1offset+0] - p2[p2offset+0]) * (p1[p1offset+0] - p2[p2offset+0]) +
             (p1[p1offset+1] - p2[p2offset+1]) * (p1[p1offset+1] - p2[p2offset+1]) +
             (p1[p1offset+2] - p2[p2offset+2]) * (p1[p1offset+2] - p2[p2offset+2]);
    };

    tracking.EPnP.prototype.dot = function(v1, v1offset, v2, v2offset) {
      return v1[v1offset+0] * v2[v2offset+0] + 
             v1[v1offset+1] * v2[v2offset+1] + 
             v1[v1offset+2] * v2[v2offset+2];
    };

    tracking.EPnP.prototype.estimateRAndT = function(R, t) {
      var instance = this,
          numberOfCorrespondences = instance.numberOfCorrespondences,
          pc0 = new Float64Array(3),
          pcs = instance.pcs,
          pw0 = new Float64Array(3),
          pws = instance.pws,
          i,
          j,
          pc,
          pw;

      pc0[0] = pc0[1] = pc0[2] = 0.0;
      pw0[0] = pw0[1] = pw0[2] = 0.0;

      for(i = 0; i < numberOfCorrespondences; i++) {
        pc = 3 * i;
        pw = 3 * i;

        for(j = 0; j < 3; j++) {
          pc0[j] += pcs[pc + j];
          pw0[j] += pws[pw + j];
        }
      }
      for(j = 0; j < 3; j++) {
        pc0[j] /= numberOfCorrespondences;
        pw0[j] /= numberOfCorrespondences;
      }

      var ABt = new Float64Array(3 * 3), 
          ABt_D = new Float64Array(3), 
          ABt_U = new Float64Array(3 * 3), 
          ABt_V = new Float64Array(3 * 3);

      for (i = 0; i < 9; i++) {
        ABt[i] = 0;
      }

      for(i = 0; i < numberOfCorrespondences; i++) {
        pc = 3 * i;
        pw = 3 * i;

        for(j = 0; j < 3; j++) {
          ABt[3 * j    ] += (pcs[pc + j] - pc0[j]) * (pws[pw + 0] - pw0[0]);
          ABt[3 * j + 1] += (pcs[pc + j] - pc0[j]) * (pws[pw + 1] - pw0[1]);
          ABt[3 * j + 2] += (pcs[pc + j] - pc0[j]) * (pws[pw + 2] - pw0[2]);
        }
      }

      instance.svd(ABt, 3, 3, ABt_D, ABt_U, ABt_V);

      for(i = 0; i < 3; i++) {
        for(j = 0; j < 3; j++) {
          R[i*3 + j] = instance.dot(ABt_U, 3 * i, ABt_V, 3 * j);
        }
      }

      var det =
        R[0*3+ 0] * R[1*3+ 1] * R[2*3+ 2] + R[0*3+ 1] * R[1*3+ 2] * R[2*3+ 0] + R[0*3+ 2] * R[1*3+ 0] * R[2*3+ 1] -
        R[0*3+ 2] * R[1*3+ 1] * R[2*3+ 0] - R[0*3+ 1] * R[1*3+ 0] * R[2*3+ 2] - R[0*3+ 0] * R[1*3+ 2] * R[2*3+ 1];

      if (det < 0) {
        R[2*3+ 0] = -R[2*3+ 0];
        R[2*3+ 1] = -R[2*3+ 1];
        R[2*3+ 2] = -R[2*3+ 2];
      }

      t[0] = pc0[0] - instance.dot(R, 0*3, pw0, 0);
      t[1] = pc0[1] - instance.dot(R, 1*3, pw0, 0);
      t[2] = pc0[2] - instance.dot(R, 2*3, pw0, 0);
    };

    tracking.EPnP.prototype.solveForSign = function() {
      var instance = this,
          pcs = instance.pcs,
          ccs = instance.ccs,
          i, 
          j;

      if (pcs[2] < 0.0) {
        for(i = 0; i < 4; i++) {
          for(j = 0; j < 3; j++) {
            ccs[i*3 + j] = -ccs[i*3 + j];
          }
        }

        for(i = 0; i < instance.numberOfCorrespondences; i++) {
          pcs[3 * i    ] = -pcs[3 * i];
          pcs[3 * i + 1] = -pcs[3 * i + 1];
          pcs[3 * i + 2] = -pcs[3 * i + 2];
        }
      }
    };

    tracking.EPnP.prototype.computeRAndT = function(ut, betas, R, t) {
      var instance = this;
      
      instance.computeCCS(betas, ut);
      instance.computePCS();

      instance.solveForSign();

      instance.estimateRAndT(R, t);

      return instance.reprojectionError(R, t);
    };

    tracking.EPnP.prototype.reprojectionError = function(R, t) {
      var instance = this,
          pws = instance.pws,
          dot = instance.dot,
          us = instance.us,
          uc = instance.uc,
          vc = instance.vc,
          fu = instance.fu,
          fv = instance.fv,
          sum2 = 0.0,
          i;

      for(i = 0; i < instance.numberOfCorrespondences; i++) {
        var pw = 3 * i,
            Xc = dot(R, 0*3, pws, pw) + t[0],
            Yc = dot(R, 1*3, pws, pw) + t[1],
            inv_Zc = 1.0 / (dot(R, 2*3, pws, pw) + t[2]),
            ue = uc + fu * Xc * inv_Zc,
            ve = vc + fv * Yc * inv_Zc,
            u = us[2 * i], v = us[2 * i + 1];

        sum2 += Math.sqrt( (u - ue) * (u - ue) + (v - ve) * (v - ve) );
      }

      return sum2 / instance.numberOfCorrespondences;
    };

    // betas10        = [B11 B12 B22 B13 B23 B33 B14 B24 B34 B44]
    // betas_approx_1 = [B11 B12     B13         B14]
    tracking.EPnP.prototype.findBetasApprox1 = function(L_6x10, Rho, betas) {
      var L_6x4 = new Float64Array(6 * 4),
          B4 = new Float64Array(4),
          i;

      for(i = 0; i < 6; i++) {
        L_6x4[i*4 + 0] = L_6x10[i*10 + 0];
        L_6x4[i*4 + 1] = L_6x10[i*10 + 1];
        L_6x4[i*4 + 2] = L_6x10[i*10 + 3];
        L_6x4[i*4 + 3] = L_6x10[i*10 + 6];
      }

      this.solveLinearSystem(L_6x4, 6, 4, Rho, B4);

      if (B4[0] < 0) {
        betas[0] = Math.sqrt(-B4[0]);
        betas[1] = -B4[1] / betas[0];
        betas[2] = -B4[2] / betas[0];
        betas[3] = -B4[3] / betas[0];
      } else {
        betas[0] = Math.sqrt(B4[0]);
        betas[1] = B4[1] / betas[0];
        betas[2] = B4[2] / betas[0];
        betas[3] = B4[3] / betas[0];
      }
    };

    // betas10        = [B11 B12 B22 B13 B23 B33 B14 B24 B34 B44]
    // betas_approx_2 = [B11 B12 B22                            ]
    tracking.EPnP.prototype.findBetasApprox2 = function(L_6x10, Rho, betas) {
      var L_6x3 = new Float64Array(6 * 3), 
          B3 = new Float64Array(3),
          i;

      for(i = 0; i < 6; i++) {
        L_6x3[i*3 + 0] = L_6x10[i*10 + 0];
        L_6x3[i*3 + 1] = L_6x10[i*10 + 1];
        L_6x3[i*3 + 2] = L_6x10[i*10 + 2];
      }

      this.solveLinearSystem(L_6x3, 6, 3, Rho, B3);

      if (B3[0] < 0) {
        betas[0] = Math.sqrt(-B3[0]);
        betas[1] = (B3[2] < 0) ? Math.sqrt(-B3[2]) : 0.0;
      } else {
        betas[0] = Math.sqrt(B3[0]);
        betas[1] = (B3[2] > 0) ? Math.sqrt(B3[2]) : 0.0;
      }

      if (B3[1] < 0) {
        betas[0] = -betas[0];
      }

      betas[2] = 0.0;
      betas[3] = 0.0;
    };

    // betas10        = [B11 B12 B22 B13 B23 B33 B14 B24 B34 B44]
    // betas_approx_3 = [B11 B12 B22 B13 B23                    ]
    tracking.EPnP.prototype.findBetasApprox3 = function(L_6x10, Rho, betas) {
      var L_6x5 = new Float64Array(6 * 5), 
          B5 = new Float64Array(5),
          i;

      for(i = 0; i < 6; i++) {
        L_6x5[i*5 + 0] = L_6x10[i*10 + 0];
        L_6x5[i*5 + 1] = L_6x10[i*10 + 1];
        L_6x5[i*5 + 2] = L_6x10[i*10 + 2];
        L_6x5[i*5 + 3] = L_6x10[i*10 + 3];
        L_6x5[i*5 + 4] = L_6x10[i*10 + 4];
      }

      this.solveLinearSystem(L_6x5, 6, 5, Rho, B5);

      if (B5[0] < 0) {
        betas[0] = Math.sqrt(-B5[0]);
        betas[1] = (B5[2] < 0) ? Math.sqrt(-B5[2]) : 0.0;
      } else {
        betas[0] = Math.sqrt(B5[0]);
        betas[1] = (B5[2] > 0) ? Math.sqrt(B5[2]) : 0.0;
      }
      if (B5[1] < 0) {
        betas[0] = -betas[0];
      }
      betas[2] = B5[3] / betas[0];
      betas[3] = 0.0;
    };

    tracking.EPnP.prototype.computeL6x10 = function(ut, l_6x10) {
      var instance = this,
          v = new Uint8ClampedArray (4),
          i,
          j;

      v[0] = 12 * 11;
      v[1] = 12 * 10;
      v[2] = 12 *  9;
      v[3] = 12 *  8;

      var dv = [new Float64Array(6*3), new Float64Array(6*3), new Float64Array(6*3), new Float64Array(6*3)];

      for(i = 0; i < 4; i++) {
        var a = 0, b = 1;
        for(j = 0; j < 6; j++) {
          dv[i][j*3 + 0] = ut[v[i] + 3 * a    ] - ut[v[i] + 3 * b    ];
          dv[i][j*3 + 1] = ut[v[i] + 3 * a + 1] - ut[v[i] + 3 * b + 1];
          dv[i][j*3 + 2] = ut[v[i] + 3 * a + 2] - ut[v[i] + 3 * b + 2];

          b++;
          if (b > 3) {
            a++;
            b = a + 1;
          }
        }
      }

      for(i = 0; i < 6; i++) {
        l_6x10[10*i + 0] =       instance.dot(dv[0], i*3, dv[0], i*3);
        l_6x10[10*i + 1] = 2.0 * instance.dot(dv[0], i*3, dv[1], i*3);
        l_6x10[10*i + 2] =       instance.dot(dv[1], i*3, dv[1], i*3);
        l_6x10[10*i + 3] = 2.0 * instance.dot(dv[0], i*3, dv[2], i*3);
        l_6x10[10*i + 4] = 2.0 * instance.dot(dv[1], i*3, dv[2], i*3);
        l_6x10[10*i + 5] =       instance.dot(dv[2], i*3, dv[2], i*3);
        l_6x10[10*i + 6] = 2.0 * instance.dot(dv[0], i*3, dv[3], i*3);
        l_6x10[10*i + 7] = 2.0 * instance.dot(dv[1], i*3, dv[3], i*3);
        l_6x10[10*i + 8] = 2.0 * instance.dot(dv[2], i*3, dv[3], i*3);
        l_6x10[10*i + 9] =       instance.dot(dv[3], i*3, dv[3], i*3);
      }
    };

    tracking.EPnP.prototype.computeRho = function(rho) {
      var instance = this,
          cws = instance.cws;

      rho[0] = instance.dist2(cws, 0*3, cws, 1*3);
      rho[1] = instance.dist2(cws, 0*3, cws, 2*3);
      rho[2] = instance.dist2(cws, 0*3, cws, 3*3);
      rho[3] = instance.dist2(cws, 1*3, cws, 2*3);
      rho[4] = instance.dist2(cws, 1*3, cws, 3*3);
      rho[5] = instance.dist2(cws, 2*3, cws, 3*3);
    };

    tracking.EPnP.prototype.computeAAndBGaussNewton = function(l_6x10, Rho, betas, A, b) {
      var i;
      for(i = 0; i < 6; i++) {
        var rowL = l_6x10.subarray(i * 10),
            rowA = A.subarray(i * 4);

        rowA[0] = 2 * rowL[0] * betas[0] +     rowL[1] * betas[1] +     rowL[3] * betas[2] +     rowL[6] * betas[3];
        rowA[1] =     rowL[1] * betas[0] + 2 * rowL[2] * betas[1] +     rowL[4] * betas[2] +     rowL[7] * betas[3];
        rowA[2] =     rowL[3] * betas[0] +     rowL[4] * betas[1] + 2 * rowL[5] * betas[2] +     rowL[8] * betas[3];
        rowA[3] =     rowL[6] * betas[0] +     rowL[7] * betas[1] +     rowL[8] * betas[2] + 2 * rowL[9] * betas[3];

        b[i*1 + 0] = Rho[i]-
          (
            rowL[0] * betas[0] * betas[0] +
            rowL[1] * betas[0] * betas[1] +
            rowL[2] * betas[1] * betas[1] +
            rowL[3] * betas[0] * betas[2] +
            rowL[4] * betas[1] * betas[2] +
            rowL[5] * betas[2] * betas[2] +
            rowL[6] * betas[0] * betas[3] +
            rowL[7] * betas[1] * betas[3] +
            rowL[8] * betas[2] * betas[3] +
            rowL[9] * betas[3] * betas[3]
          );
      }
    };

    tracking.EPnP.prototype.gaussNewton = function(L_6x10, Rho, betas) {
      var iterations_number = 5, 
          A = new Float64Array(6*4), 
          B = new Float64Array(6), 
          X = new Float64Array(4);

      for(var k = 0; k < iterations_number; k++)
      {
        this.computeAAndBGaussNewton(L_6x10, Rho, betas, A, B);
        this.qr_solve(A, 6, 4, B, X);
        for(var i = 0; i < 4; i++) {
          betas[i] += X[i];
        }
      }
    };

    tracking.EPnP.prototype.qr_solve = function(A, m, n, b, X) {
      var instance = this,
          nr = m,
          nc = n,
          i,
          j,
          k,
          ppAij,
          sum, 
          tau;

      if (instance.max_nr < nr)
      {
        instance.max_nr = nr;
        instance.A1 = new Float64Array(nr);
        instance.A2 = new Float64Array(nr);
      }

      var A1 = instance.A1,
          A2 = instance.A2;

      var pA = A, 
          ppAkk = pA;
      for(k = 0; k < nc; k++)
      {
        var ppAik1 = ppAkk,
            eta = Math.abs(ppAik1[0]);
        for(i = k + 1; i < nr; i++)
        {
          var elt = Math.abs(ppAik1[0]);
          if (eta < elt) {
            eta = elt;
          }
          ppAik1 = ppAik1.subarray(nc);
        }
        if (eta === 0)
        {
          A1[k] = A2[k] = 0.0;
          //cerr << "God damnit, A is singular, this shouldn't happen." << endl;
          return;
        }
        else
        {
          var ppAik2 = ppAkk, 
              sum2 = 0.0, 
              inv_eta = 1.0 / eta;
          for(i = k; i < nr; i++)
          {
            ppAik2[0] *= inv_eta;
            sum2 += ppAik2[0] * ppAik2[0];
            ppAik2 = ppAik2.subarray(nc);
          }
          var sigma = Math.sqrt(sum2);
          if (ppAkk[0] < 0) {
            sigma = -sigma;
          }
          ppAkk[0] += sigma;
          A1[k] = sigma * ppAkk[0];
          A2[k] = -eta * sigma;
          for(j = k + 1; j < nc; j++)
          {
            var ppAik = ppAkk;
            sum = 0;
            for(i = k; i < nr; i++)
            {
              sum += ppAik[0] * ppAik[j - k];
              ppAik = ppAik.subarray(nc);
            }
            tau = sum / A1[k];
            ppAik = ppAkk;
            for(i = k; i < nr; i++)
            {
              ppAik[j - k] -= tau * ppAik[0];
              ppAik = ppAik.subarray(nc);
            }
          }
        }
        ppAkk = ppAkk.subarray(nc + 1);
      }

      // b <- Qt b
      var ppAjj = pA,
          pb = b;
      for(j = 0; j < nc; j++)
      {
        ppAij = ppAjj;
        tau = 0;
        for(i = j; i < nr; i++)
        {
          tau += ppAij[0] * pb[i];
          ppAij = ppAij.subarray(nc);
        }
        tau /= A1[j];
        ppAij = ppAjj;
        for(i = j; i < nr; i++)
        {
          pb[i] -= tau * ppAij[0];
          ppAij = ppAij.subarray(nc);
        }
        ppAjj = ppAjj.subarray(nc + 1);
      }

      // X = R-1 b
      var pX = X;
      pX[nc - 1] = pb[nc - 1] / A2[nc - 1];
      for(i = nc - 2; i >= 0; i--)
      {
        ppAij = pA.subarray(i * nc + (i + 1));
        sum = 0;

        for(j = i + 1; j < nc; j++)
        {
          sum += ppAij[0] * pX[j];
          ppAij = ppAij.subarray(1);
        }
        pX[i] = (pb[i] - sum) / A2[i];
      }
    };

    /*
    void epnp::qr_solve(CvMat * A, CvMat * b, CvMat * X)
{
  const int nr = A->rows;
  const int nc = A->cols;

  if (max_nr != 0 && max_nr < nr)
  {
    delete [] A1;
    delete [] A2;
  }
  if (max_nr < nr)
  {
    max_nr = nr;
    A1 = new double[nr];
    A2 = new double[nr];
  }

  double * pA = A->data.db, * ppAkk = pA;
  for(int k = 0; k < nc; k++)
  {
    double * ppAik1 = ppAkk, eta = fabs(*ppAik1);
    for(int i = k + 1; i < nr; i++)
    {
      double elt = fabs(*ppAik1);
      if (eta < elt) eta = elt;
      ppAik1 += nc;
    }
    if (eta == 0)
    {
      A1[k] = A2[k] = 0.0;
      //cerr << "God damnit, A is singular, this shouldn't happen." << endl;
      return;
    }
    else
    {
      double * ppAik2 = ppAkk, sum2 = 0.0, inv_eta = 1. / eta;
      for(int i = k; i < nr; i++)
      {
        *ppAik2 *= inv_eta;
        sum2 += *ppAik2 * *ppAik2;
        ppAik2 += nc;
      }
      double sigma = sqrt(sum2);
      if (*ppAkk < 0)
      sigma = -sigma;
      *ppAkk += sigma;
      A1[k] = sigma * *ppAkk;
      A2[k] = -eta * sigma;
      for(int j = k + 1; j < nc; j++)
      {
        double * ppAik = ppAkk, sum = 0;
        for(int i = k; i < nr; i++)
        {
          sum += *ppAik * ppAik[j - k];
          ppAik += nc;
        }
        double tau = sum / A1[k];
        ppAik = ppAkk;
        for(int i = k; i < nr; i++)
        {
          ppAik[j - k] -= tau * *ppAik;
          ppAik += nc;
        }
      }
    }
    ppAkk += nc + 1;
  }

  // b <- Qt b
  double * ppAjj = pA, * pb = b->data.db;
  for(int j = 0; j < nc; j++)
  {
    double * ppAij = ppAjj, tau = 0;
    for(int i = j; i < nr; i++)
    {
      tau += *ppAij * pb[i];
      ppAij += nc;
    }
    tau /= A1[j];
    ppAij = ppAjj;
    for(int i = j; i < nr; i++)
    {
      pb[i] -= tau * *ppAij;
      ppAij += nc;
    }
    ppAjj += nc + 1;
  }

  // X = R-1 b
  double * pX = X->data.db;
  pX[nc - 1] = pb[nc - 1] / A2[nc - 1];
  for(int i = nc - 2; i >= 0; i--)
  {
    double * ppAij = pA + i * nc + (i + 1), sum = 0;

    for(int j = i + 1; j < nc; j++)
    {
      sum += *ppAij * pX[j];
      ppAij++;
    }
    pX[i] = (pb[i] - sum) / A2[i];
  }
}
     */

    tracking.EPnP.solve = function(objectPoints, imagePoints, cameraMatrix) {
      var R = new Float64Array(3 * 3),
          t = new Float64Array(3),
          EPnP = new tracking.EPnP();

      EPnP.init(objectPoints, imagePoints, cameraMatrix);
      EPnP.computePose(R, t);

      // <DEBUG>
      var s = '';
      for (var i = 0; i < 3; i++) {
        s += '[';
        for (var j = 0; j < 3; j++) {
          s += '\t' + R[i*3+j];
        }
        s += ']\n';
      }
      console.log('R:\n',s);
      console.log('t:', t);
      // </DEBUG> //*/
    };

}());
(function() {
  /*
   * ViolaJones utility.
   * @static
   * @constructor
   */
  tracking.ViolaJones = {};

  /**
   * Holds the minimum area of intersection that defines when a rectangle is
   * from the same group. Often when a face is matched multiple rectangles are
   * classified as possible rectangles to represent the face, when they
   * intersects they are grouped as one face.
   * @type {number}
   * @default 0.5
   * @static
   */
  tracking.ViolaJones.REGIONS_OVERLAP = 0.5;

  /**
   * Detects through the HAAR cascade data rectangles matches.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {number} initialScale The initial scale to start the block
   *     scaling.
   * @param {number} scaleFactor The scale factor to scale the feature block.
   * @param {number} stepSize The block step size.
   * @param {number} edgesDensity Percentage density edges inside the
   *     classifier block. Value from [0.0, 1.0], defaults to 0.2. If specified
   *     edge detection will be applied to the image to prune dead areas of the
   *     image, this can improve significantly performance.
   * @param {number} data The HAAR cascade data.
   * @return {array} Found rectangles.
   * @static
   */
  tracking.ViolaJones.detect = function(pixels, width, height, initialScale, scaleFactor, stepSize, edgesDensity, data) {
    var total = 0;
    var rects = [];
    var integralImage = new Int32Array(width * height);
    var integralImageSquare = new Int32Array(width * height);
    var tiltedIntegralImage = new Int32Array(width * height);

    var integralImageSobel;
    if (edgesDensity > 0) {
      integralImageSobel = new Int32Array(width * height);
    }

    tracking.Image.computeIntegralImage(pixels, width, height, integralImage, integralImageSquare, tiltedIntegralImage, integralImageSobel);

    var minWidth = data[0];
    var minHeight = data[1];
    var scale = initialScale * scaleFactor;
    var blockWidth = (scale * minWidth) | 0;
    var blockHeight = (scale * minHeight) | 0;

    while (blockWidth < width && blockHeight < height) {
      var step = (scale * stepSize + 0.5) | 0;
      for (var i = 0; i < (height - blockHeight); i += step) {
        for (var j = 0; j < (width - blockWidth); j += step) {

          if (edgesDensity > 0) {
            if (this.isTriviallyExcluded(edgesDensity, integralImageSobel, i, j, width, blockWidth, blockHeight)) {
              continue;
            }
          }

          if (this.evalStages_(data, integralImage, integralImageSquare, tiltedIntegralImage, i, j, width, blockWidth, blockHeight, scale)) {
            rects[total++] = {
              width: blockWidth,
              height: blockHeight,
              x: j,
              y: i
            };
          }
        }
      }

      scale *= scaleFactor;
      blockWidth = (scale * minWidth) | 0;
      blockHeight = (scale * minHeight) | 0;
    }
    return this.mergeRectangles_(rects);
  };

  /**
   * Fast check to test whether the edges density inside the block is greater
   * than a threshold, if true it tests the stages. This can improve
   * significantly performance.
   * @param {number} edgesDensity Percentage density edges inside the
   *     classifier block.
   * @param {array} integralImageSobel The integral image of a sobel image.
   * @param {number} i Vertical position of the pixel to be evaluated.
   * @param {number} j Horizontal position of the pixel to be evaluated.
   * @param {number} width The image width.
   * @return {boolean} True whether the block at position i,j can be skipped,
   *     false otherwise.
   * @static
   */
  tracking.ViolaJones.isTriviallyExcluded = function(edgesDensity, integralImageSobel, i, j, width, blockWidth, blockHeight) {
    var wbA = i * width + j;
    var wbB = wbA + blockWidth;
    var wbD = wbA + blockHeight * width;
    var wbC = wbD + blockWidth;
    var blockEdgesDensity = (integralImageSobel[wbA] - integralImageSobel[wbB] - integralImageSobel[wbD] + integralImageSobel[wbC]) / (blockWidth * blockHeight * 255);
    if (blockEdgesDensity < edgesDensity) {
      return true;
    }
    return false;
  };

  /**
   * Evaluates if the block size on i,j position is a valid HAAR cascade
   * stage.
   * @param {number} data The HAAR cascade data.
   * @param {number} i Vertical position of the pixel to be evaluated.
   * @param {number} j Horizontal position of the pixel to be evaluated.
   * @param {number} width The image width.
   * @param {number} blockSize The block size.
   * @param {number} scale The scale factor of the block size and its original
   *     size.
   * @param {number} inverseArea The inverse area of the block size.
   * @return {boolean} Whether the region passes all the stage tests.
   * @private
   * @static
   */
  tracking.ViolaJones.evalStages_ = function(data, integralImage, integralImageSquare, tiltedIntegralImage, i, j, width, blockWidth, blockHeight, scale) {
    var inverseArea = 1.0 / (blockWidth * blockHeight);
    var wbA = i * width + j;
    var wbB = wbA + blockWidth;
    var wbD = wbA + blockHeight * width;
    var wbC = wbD + blockWidth;
    var mean = (integralImage[wbA] - integralImage[wbB] - integralImage[wbD] + integralImage[wbC]) * inverseArea;
    var variance = (integralImageSquare[wbA] - integralImageSquare[wbB] - integralImageSquare[wbD] + integralImageSquare[wbC]) * inverseArea - mean * mean;

    var standardDeviation = 1;
    if (variance > 0) {
      standardDeviation = Math.sqrt(variance);
    }

    var length = data.length;

    for (var w = 2; w < length; ) {
      var stageSum = 0;
      var stageThreshold = data[w++];
      var nodeLength = data[w++];

      while (nodeLength--) {
        var rectsSum = 0;
        var tilted = data[w++];
        var rectsLength = data[w++];

        for (var r = 0; r < rectsLength; r++) {
          var rectLeft = (j + data[w++] * scale + 0.5) | 0;
          var rectTop = (i + data[w++] * scale + 0.5) | 0;
          var rectWidth = (data[w++] * scale + 0.5) | 0;
          var rectHeight = (data[w++] * scale + 0.5) | 0;
          var rectWeight = data[w++];

          var w1;
          var w2;
          var w3;
          var w4;
          if (tilted) {
            // RectSum(r) = RSAT(x-h+w, y+w+h-1) + RSAT(x, y-1) - RSAT(x-h, y+h-1) - RSAT(x+w, y+w-1)
            w1 = (rectLeft - rectHeight + rectWidth) + (rectTop + rectWidth + rectHeight - 1) * width;
            w2 = rectLeft + (rectTop - 1) * width;
            w3 = (rectLeft - rectHeight) + (rectTop + rectHeight - 1) * width;
            w4 = (rectLeft + rectWidth) + (rectTop + rectWidth - 1) * width;
            rectsSum += (tiltedIntegralImage[w1] + tiltedIntegralImage[w2] - tiltedIntegralImage[w3] - tiltedIntegralImage[w4]) * rectWeight;
          } else {
            // RectSum(r) = SAT(x-1, y-1) + SAT(x+w-1, y+h-1) - SAT(x-1, y+h-1) - SAT(x+w-1, y-1)
            w1 = rectTop * width + rectLeft;
            w2 = w1 + rectWidth;
            w3 = w1 + rectHeight * width;
            w4 = w3 + rectWidth;
            rectsSum += (integralImage[w1] - integralImage[w2] - integralImage[w3] + integralImage[w4]) * rectWeight;
            // TODO: Review the code below to analyze performance when using it instead.
            // w1 = (rectLeft - 1) + (rectTop - 1) * width;
            // w2 = (rectLeft + rectWidth - 1) + (rectTop + rectHeight - 1) * width;
            // w3 = (rectLeft - 1) + (rectTop + rectHeight - 1) * width;
            // w4 = (rectLeft + rectWidth - 1) + (rectTop - 1) * width;
            // rectsSum += (integralImage[w1] + integralImage[w2] - integralImage[w3] - integralImage[w4]) * rectWeight;
          }
        }

        var nodeThreshold = data[w++];
        var nodeLeft = data[w++];
        var nodeRight = data[w++];

        if (rectsSum * inverseArea < nodeThreshold * standardDeviation) {
          stageSum += nodeLeft;
        } else {
          stageSum += nodeRight;
        }
      }

      if (stageSum < stageThreshold) {
        return false;
      }
    }
    return true;
  };

  /**
   * Postprocess the detected sub-windows in order to combine overlapping
   * detections into a single detection.
   * @param {array} rects
   * @return {array}
   * @private
   * @static
   */
  tracking.ViolaJones.mergeRectangles_ = function(rects) {
    var disjointSet = new tracking.DisjointSet(rects.length);

    for (var i = 0; i < rects.length; i++) {
      var r1 = rects[i];
      for (var j = 0; j < rects.length; j++) {
        var r2 = rects[j];
        if (tracking.Math.intersectRect(r1.x, r1.y, r1.x + r1.width, r1.y + r1.height, r2.x, r2.y, r2.x + r2.width, r2.y + r2.height)) {
          var x1 = Math.max(r1.x, r2.x);
          var y1 = Math.max(r1.y, r2.y);
          var x2 = Math.min(r1.x + r1.width, r2.x + r2.width);
          var y2 = Math.min(r1.y + r1.height, r2.y + r2.height);
          var overlap = (x1 - x2) * (y1 - y2);
          var area1 = (r1.width * r1.height);
          var area2 = (r2.width * r2.height);

          if ((overlap / (area1 * (area1 / area2)) >= this.REGIONS_OVERLAP) &&
            (overlap / (area2 * (area1 / area2)) >= this.REGIONS_OVERLAP)) {
            disjointSet.union(i, j);
          }
        }
      }
    }

    var map = {};
    for (var k = 0; k < disjointSet.length; k++) {
      var rep = disjointSet.find(k);
      if (!map[rep]) {
        map[rep] = {
          total: 1,
          width: rects[k].width,
          height: rects[k].height,
          x: rects[k].x,
          y: rects[k].y
        };
        continue;
      }
      map[rep].total++;
      map[rep].width += rects[k].width;
      map[rep].height += rects[k].height;
      map[rep].x += rects[k].x;
      map[rep].y += rects[k].y;
    }

    var result = [];
    Object.keys(map).forEach(function(key) {
      var rect = map[key];
      result.push({
        total: rect.total,
        width: (rect.width / rect.total + 0.5) | 0,
        height: (rect.height / rect.total + 0.5) | 0,
        x: (rect.x / rect.total + 0.5) | 0,
        y: (rect.y / rect.total + 0.5) | 0
      });
    });

    return result;
  };

}());

(function() {
  /*
   * FAST intends for "Features from Accelerated Segment Test". This method
   * performs a point segment test corner detection. The segment test
   * criterion operates by considering a circle of sixteen pixels around the
   * corner candidate p. The detector classifies p as a corner if there exists
   * a set of n contiguous pixelsin the circle which are all brighter than the
   * intensity of the candidate pixel Ip plus a threshold t, or all darker
   * than Ip − t.
   *
   *       15 00 01
   *    14          02
   * 13                03
   * 12       []       04
   * 11                05
   *    10          06
   *       09 08 07
   *
   * For more reference:
   * http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.60.3991&rep=rep1&type=pdf
   * @static
   * @constructor
   */
  tracking.Fast = {};

  /**
   * Holds the threshold to determine whether the tested pixel is brighter or
   * darker than the corner candidate p.
   * @type {number}
   * @default 40
   * @static
   */
  tracking.Fast.FAST_THRESHOLD = 40;

  /**
   * Caches coordinates values of the circle surounding the pixel candidate p.
   * @type {Object.<number, Int32Array>}
   * @private
   * @static
   */
  tracking.Fast.circles_ = {};

  /**
   * Finds corners coordinates on the graysacaled image.
   * @param {array} The grayscale pixels in a linear [p1,p2,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @return {array} Array containing the coordinates of all found corners,
   *     e.g. [x0,y0,x1,y1,...], where P(x0,y0) represents a corner coordinate.
   */
  tracking.Fast.findCorners = function(pixels, width, height) {
    var circleOffsets = this.getCircleOffsets_(width);
    var circlePixels = new Int32Array(16);
    var corners = [];

    // When looping through the image pixels, skips the first three lines from
    // the image boundaries to constrain the surrounding circle inside the image
    // area.
    for (var i = 3; i < height - 3; i++) {
      for (var j = 3; j < width - 3; j++) {
        var w = i * width + j;
        var p = pixels[w];

        // Loops the circle offsets to read the pixel value for the sixteen
        // surrounding pixels.
        for (var k = 0; k < 16; k++) {
          circlePixels[k] = pixels[w + circleOffsets[k]];
        }

        if (this.isCorner(p, circlePixels, this.FAST_THRESHOLD)) {
          // The pixel p is classified as a corner, as optimization increment j
          // by the circle radius 3 to skip the neighbor pixels inside the
          // surrounding circle. This can be removed without compromising the
          // result.
          corners.push(j, i);
          j += 3;
        }
      }
    }

    return corners;
  };

  /**
   * Checks if the circle pixel is brigther than the candidate pixel p by
   * a threshold.
   * @param {number} circlePixel The circle pixel value.
   * @param {number} p The value of the candidate pixel p.
   * @param {number} threshold
   * @return {Boolean}
   */
  tracking.Fast.isBrighter = function(circlePixel, p, threshold) {
    return circlePixel - p > threshold;
  };

  tracking.Fast.isCorner = function(p, circlePixels, threshold) {
    if (this.isTriviallyExcluded(circlePixels, p, threshold)) {
      return false;
    }

    for (var x = 0; x < 16; x++) {
      var darker = true;
      var brighter = true;

      for (var y = 0; y < 9; y++) {
        var circlePixel = circlePixels[(x + y) & 15];

        if (!this.isBrighter(p, circlePixel, threshold)) {
          brighter = false;
          if (darker === false) {
            break;
          }
        }

        if (!this.isDarker(p, circlePixel, threshold)) {
          darker = false;
          if (brighter === false) {
            break;
          }
        }
      }

      if (brighter || darker) {
        return true;
      }
    }

    return false;
  };

  /**
   * Checks if the circle pixel is darker than the candidate pixel p by
   * a threshold.
   * @param {number} circlePixel The circle pixel value.
   * @param {number} p The value of the candidate pixel p.
   * @param {number} threshold
   * @return {Boolean}
   */
  tracking.Fast.isDarker = function(circlePixel, p, threshold) {
    return p - circlePixel > threshold;
  };

  /**
   * Fast check to test if the candidate pixel is a trivially excluded value.
   * In order to be a corner, the candidate pixel value should be darker or
   * brigther than 9-12 surrouding pixels, when at least three of the top,
   * bottom, left and right pixels are brither or darker it can be
   * automatically excluded improving the performance.
   * @param {number} circlePixel The circle pixel value.
   * @param {number} p The value of the candidate pixel p.
   * @param {number} threshold
   * @return {Boolean}
   */
  tracking.Fast.isTriviallyExcluded = function(circlePixels, p, threshold) {
    var count = 0;
    var circleBottom = circlePixels[8];
    var circleLeft = circlePixels[12];
    var circleRight = circlePixels[4];
    var circleTop = circlePixels[0];

    if (this.isBrighter(circleTop, p, threshold)) {
      count++;
    }
    if (this.isBrighter(circleRight, p, threshold)) {
      count++;
    }
    if (this.isBrighter(circleBottom, p, threshold)) {
      count++;
    }
    if (this.isBrighter(circleLeft, p, threshold)) {
      count++;
    }

    if (count < 3) {
      count = 0;
      if (this.isDarker(circleTop, p, threshold)) {
        count++;
      }
      if (this.isDarker(circleRight, p, threshold)) {
        count++;
      }
      if (this.isDarker(circleBottom, p, threshold)) {
        count++;
      }
      if (this.isDarker(circleLeft, p, threshold)) {
        count++;
      }
      if (count < 3) {
        return true;
      }
    }

    return false;
  };

  /**
   * Gets the sixteen offset values of the circle surrounding pixel.
   * @param {number} width The image width.
   * @return {array} Array with the sixteen offset values of the circle
   *     surrounding pixel.
   */
  tracking.Fast.getCircleOffsets_ = function(width) {
    if (this.circles_[width]) {
      return this.circles_[width];
    }

    var circle = new Int32Array(16);

    circle[0] = -width - width - width;
    circle[1] = circle[0] + 1;
    circle[2] = circle[1] + width + 1;
    circle[3] = circle[2] + width + 1;
    circle[4] = circle[3] + width;
    circle[5] = circle[4] + width;
    circle[6] = circle[5] + width - 1;
    circle[7] = circle[6] + width - 1;
    circle[8] = circle[7] - 1;
    circle[9] = circle[8] - 1;
    circle[10] = circle[9] - width - 1;
    circle[11] = circle[10] - width - 1;
    circle[12] = circle[11] - width;
    circle[13] = circle[12] - width;
    circle[14] = circle[13] - width + 1;
    circle[15] = circle[14] - width + 1;

    this.circles_[width] = circle;
    return circle;
  };
}());

(function() {
  /**
   * Image utility.
   * @static
   * @constructor
   */
  tracking.Image = {};

  /**
   * Computes the integral image for summed, squared, rotated and sobel pixels.
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
   * @param {array} opt_tiltedIntegralImage Empty array of size `width *
   *     height` to be filled with the rotated integral image values. If not
   *     specified compute sum values will be skipped.
   * @param {array} opt_integralImageSobel Empty array of size `width *
   *     height` to be filled with the integral image of sobel values. If not
   *     specified compute sobel filtering will be skipped.
   * @static
   */
  tracking.Image.computeIntegralImage = function(pixels, width, height, opt_integralImage, opt_integralImageSquare, opt_tiltedIntegralImage, opt_integralImageSobel) {
    if (arguments.length < 4) {
      throw new Error('You should specify at least one output array in the order: sum, square, tilted, sobel.');
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
          this.computePixelValueSAT_(opt_integralImage, width, i, j, pixel);
        }
        if (opt_integralImageSquare) {
          this.computePixelValueSAT_(opt_integralImageSquare, width, i, j, pixel * pixel);
        }
        if (opt_tiltedIntegralImage) {
          var w1 = w - width * 4;
          var pixelAbove = ~~(pixels[w1] * 0.299 + pixels[w1 + 1] * 0.587 + pixels[w1 + 2] * 0.114);
          this.computePixelValueRSAT_(opt_tiltedIntegralImage, width, i, j, pixel, pixelAbove || 0);
        }
        if (opt_integralImageSobel) {
          this.computePixelValueSAT_(opt_integralImageSobel, width, i, j, pixelsSobel[w]);
        }
      }
    }
  };

  /**
   * Helper method to compute the rotated summed area table (RSAT) by the
   * formula:
   *
   * RSAT(x, y) = RSAT(x-1, y-1) + RSAT(x+1, y-1) - RSAT(x, y-2) + I(x, y) + I(x, y-1)
   *
   * @param {number} width The image width.
   * @param {array} RSAT Empty array of size `width * height` to be filled with
   *     the integral image values. If not specified compute sum values will be
   *     skipped.
   * @param {number} i Vertical position of the pixel to be evaluated.
   * @param {number} j Horizontal position of the pixel to be evaluated.
   * @param {number} pixel Pixel value to be added to the integral image.
   * @static
   * @private
   */
  tracking.Image.computePixelValueRSAT_ = function(RSAT, width, i, j, pixel, pixelAbove) {
    var w = i * width + j;
    RSAT[w] = (RSAT[w - width - 1] || 0) + (RSAT[w - width + 1] || 0) - (RSAT[w - width - width] || 0) + pixel + pixelAbove;
  };

  /**
   * Helper method to compute the summed area table (SAT) by the formula:
   *
   * SAT(x, y) = SAT(x, y-1) + SAT(x-1, y) + I(x, y) - SAT(x-1, y-1)
   *
   * @param {number} width The image width.
   * @param {array} SAT Empty array of size `width * height` to be filled with
   *     the integral image values. If not specified compute sum values will be
   *     skipped.
   * @param {number} i Vertical position of the pixel to be evaluated.
   * @param {number} j Horizontal position of the pixel to be evaluated.
   * @param {number} pixel Pixel value to be added to the integral image.
   * @static
   * @private
   */
  tracking.Image.computePixelValueSAT_ = function(SAT, width, i, j, pixel) {
    var w = i * width + j;
    SAT[w] = (SAT[w - width] || 0) + (SAT[w - 1] || 0) + pixel - (SAT[w - width - 1] || 0);
  };

  /**
   * Converts a color from a colorspace based on an RGB color model to a
   * grayscale representation of its luminance. The coefficients represent the
   * measured intensity perception of typical trichromat humans, in
   * particular, human vision is most sensitive to green and least sensitive
   * to blue.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {Uint8ClampedArray} The grayscale pixels in a linear [p,p,p,a,...]
   *     array.
   * @static
   */
  tracking.Image.grayscale = function(pixels, width, height) {
    var gray = new Uint8ClampedArray(width * height * 4);
    var p = 0;
    var w = 0;
    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        var value = pixels[w] * 0.299 + pixels[w + 1] * 0.587 + pixels[w + 2] * 0.114;
        gray[p++] = value;
        gray[p++] = value;
        gray[p++] = value;
        gray[p++] = pixels[w + 3];
        w += 4;
      }
    }
    return gray;
  };

  /**
   * Fast horizontal separable convolution. A point spread function (PSF) is
   * said to be separable if it can be broken into two one-dimensional
   * signals: a vertical and a horizontal projection. The convolution is
   * performed by sliding the kernel over the image, generally starting at the
   * top left corner, so as to move the kernel through all the positions where
   * the kernel fits entirely within the boundaries of the image. Adpated from
   * https://github.com/kig/canvasfilters.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {array} weightsVector The weighting vector, e.g [-1,0,1].
   * @param {number} opaque
   * @return {array} The convoluted pixels in a linear [r,g,b,a,...] array.
   */
  tracking.Image.horizontalConvolve = function(pixels, width, height, weightsVector, opaque) {
    var side = weightsVector.length;
    var halfSide = Math.floor(side / 2);
    var output = new Float32Array(width * height * 4);
    var alphaFac = opaque ? 1 : 0;

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var sy = y;
        var sx = x;
        var offset = (y * width + x) * 4;
        var r = 0;
        var g = 0;
        var b = 0;
        var a = 0;
        for (var cx = 0; cx < side; cx++) {
          var scy = sy;
          var scx = Math.min(width - 1, Math.max(0, sx + cx - halfSide));
          var poffset = (scy * width + scx) * 4;
          var wt = weightsVector[cx];
          r += pixels[poffset] * wt;
          g += pixels[poffset + 1] * wt;
          b += pixels[poffset + 2] * wt;
          a += pixels[poffset + 3] * wt;
        }
        output[offset] = r;
        output[offset + 1] = g;
        output[offset + 2] = b;
        output[offset + 3] = a + alphaFac * (255 - a);
      }
    }
    return output;
  };

  /**
   * Fast vertical separable convolution. A point spread function (PSF) is
   * said to be separable if it can be broken into two one-dimensional
   * signals: a vertical and a horizontal projection. The convolution is
   * performed by sliding the kernel over the image, generally starting at the
   * top left corner, so as to move the kernel through all the positions where
   * the kernel fits entirely within the boundaries of the image. Adpated from
   * https://github.com/kig/canvasfilters.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {array} weightsVector The weighting vector, e.g [-1,0,1].
   * @param {number} opaque
   * @return {array} The convoluted pixels in a linear [r,g,b,a,...] array.
   */
  tracking.Image.verticalConvolve = function(pixels, width, height, weightsVector, opaque) {
    var side = weightsVector.length;
    var halfSide = Math.floor(side / 2);
    var output = new Float32Array(width * height * 4);
    var alphaFac = opaque ? 1 : 0;

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var sy = y;
        var sx = x;
        var offset = (y * width + x) * 4;
        var r = 0;
        var g = 0;
        var b = 0;
        var a = 0;
        for (var cy = 0; cy < side; cy++) {
          var scy = Math.min(height - 1, Math.max(0, sy + cy - halfSide));
          var scx = sx;
          var poffset = (scy * width + scx) * 4;
          var wt = weightsVector[cy];
          r += pixels[poffset] * wt;
          g += pixels[poffset + 1] * wt;
          b += pixels[poffset + 2] * wt;
          a += pixels[poffset + 3] * wt;
        }
        output[offset] = r;
        output[offset + 1] = g;
        output[offset + 2] = b;
        output[offset + 3] = a + alphaFac * (255 - a);
      }
    }
    return output;
  };

  /**
   * Fast separable convolution. A point spread function (PSF) is said to be
   * separable if it can be broken into two one-dimensional signals: a
   * vertical and a horizontal projection. The convolution is performed by
   * sliding the kernel over the image, generally starting at the top left
   * corner, so as to move the kernel through all the positions where the
   * kernel fits entirely within the boundaries of the image. Adpated from
   * https://github.com/kig/canvasfilters.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {array} horizWeights The horizontal weighting vector, e.g [-1,0,1].
   * @param {array} vertWeights The vertical vector, e.g [-1,0,1].
   * @param {number} opaque
   * @return {array} The convoluted pixels in a linear [r,g,b,a,...] array.
   */
  tracking.Image.separableConvolve = function(pixels, width, height, horizWeights, vertWeights, opaque) {
    var vertical = this.verticalConvolve(pixels, width, height, vertWeights, opaque);
    return this.horizontalConvolve(vertical, width, height, horizWeights, opaque);
  };

  /**
   * Compute image edges using Sobel operator. Computes the vertical and
   * horizontal gradients of the image and combines the computed images to
   * find edges in the image. The way we implement the Sobel filter here is by
   * first grayscaling the image, then taking the horizontal and vertical
   * gradients and finally combining the gradient images to make up the final
   * image. Adpated from https://github.com/kig/canvasfilters.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @return {array} The edge pixels in a linear [r,g,b,a,...] array.
   */
  tracking.Image.sobel = function(pixels, width, height) {
    pixels = this.grayscale(pixels, width, height);
    var output = new Float32Array(width * height * 4);
    var sobelSignVector = new Float32Array([-1, 0, 1]);
    var sobelScaleVector = new Float32Array([1, 2, 1]);
    var vertical = this.separableConvolve(pixels, width, height, sobelSignVector, sobelScaleVector);
    var horizontal = this.separableConvolve(pixels, width, height, sobelScaleVector, sobelSignVector);

    for (var i = 0; i < output.length; i += 4) {
      var v = vertical[i];
      var h = horizontal[i];
      var p = Math.sqrt(h * h + v * v);
      output[i] = p;
      output[i + 1] = p;
      output[i + 2] = p;
      output[i + 3] = 255;
    }

    return output;
  };

}());

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
    var dx = x1 - x0;
    var dy = y1 - y0;

    return Math.sqrt(dx * dx + dy * dy);
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

  /**
   * Generates a random number between [a, b] interval.
   * @param {number} a
   * @param {number} b
   * @return {number}
   */
  tracking.Math.uniformRandom = function(a, b) {
    return a + Math.random() * (b - a);
  };

  /**
   * Tests if a rectangle intersects with another.
   *
   *  x0y0 --------       x2y2 --------
   *      |       |           |       |
   *      -------- x1y1       -------- x3y3
   *
   * @param {number} x0 Horizontal coordinate of P0.
   * @param {number} y0 Vertical coordinate of P0.
   * @param {number} x1 Horizontal coordinate of P1.
   * @param {number} y1 Vertical coordinate of P1.
   * @param {number} x2 Horizontal coordinate of P2.
   * @param {number} y2 Vertical coordinate of P2.
   * @param {number} x3 Horizontal coordinate of P3.
   * @param {number} y3 Vertical coordinate of P3.
   * @return {boolean}
   */
  tracking.Math.intersectRect = function(x0, y0, x1, y1, x2, y2, x3, y3) {
    return !(x2 > x1 || x3 < x0 || y2 > y1 || y3 < y0);
  };

}());

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

(function() {
  /**
   * DisjointSet utility with path compression. Some applications involve
   * grouping n distinct objects into a collection of disjoint sets. Two
   * important operations are then finding which set a given object belongs to
   * and uniting the two sets. A disjoint set data structure maintains a
   * collection S={ S1 , S2 ,..., Sk } of disjoint dynamic sets. Each set is
   * identified by a representative, which usually is a member in the set.
   * @static
   * @constructor
   */
  tracking.DisjointSet = function(length) {
    if (length === undefined) {
      throw new Error('DisjointSet length not specified.');
    }
    this.length = length;
    this.parent = new Uint32Array(length);
    for (var i = 0; i < length; i++) {
      this.parent[i] = i;
    }
  };

  /**
   * Holds the length of the internal set.
   * @type {number}
   */
  tracking.DisjointSet.prototype.length = null;

  /**
   * Holds the set containing the representative values.
   * @type {Array.<number>}
   */
  tracking.DisjointSet.prototype.parent = null;

  /**
   * Finds a pointer to the representative of the set containing i.
   * @param {number} i
   * @return {number} The representative set of i.
   */
  tracking.DisjointSet.prototype.find = function(i) {
    if (this.parent[i] === i) {
      return i;
    } else {
      return (this.parent[i] = this.find(this.parent[i]));
    }
  };

  /**
   * Unites two dynamic sets containing objects i and j, say Si and Sj, into
   * a new set that Si ∪ Sj, assuming that Si ∩ Sj = ∅;
   * @param {number} i
   * @param {number} j
   */
  tracking.DisjointSet.prototype.union = function(i, j) {
    var iRepresentative = this.find(i);
    var jRepresentative = this.find(j);
    this.parent[iRepresentative] = jRepresentative;
  };

}());

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
(function() {
  /**
   * Tracker utility.
   * @constructor
   */
  tracking.Tracker = function() {};

  /**
   * Fires when the tracker founds a target into the video frame.
   * @param {Video} video The `Video` instance being tracked.
   * @param {object} payload The payload of the tracker, e.g. this can be an
   *     array of x, y coodinates of the target element, or an array of
   *     rectangles, specifically, any relevant information that worth exposing to
   * the implementer.
   */
  tracking.Tracker.prototype.onFound = function() {};

  /**
   * Fires when the tracker doesn't found a target into the video frame. Be
   * aware of how to use this method since for most of the processed frames
   * nothing is found, hence this can potentially be called much often than
   * you would expect.
   * @param {Video} video The `Video` instance being tracked.
   * @param {object} payload The payload of the tracker.
   */
  tracking.Tracker.prototype.onNotFound = function() {};

  /**
   * Tracks the pixels on the array. This method is called for each video
   * frame in order to decide whether `onFound` or `onNotFound` callback will
   * be fired.
   * @param {Uint8ClampedArray} pixels The pixels data to track.
   * @param {number} width The pixels canvas width.
   * @param {number} height The pixels canvas height.
   */
  tracking.Tracker.prototype.track = function() {};
}());

(function() {
  /**
   * HAARTracker utility.
   * @constructor
   * @extends {tracking.Tracker}
   */
  tracking.HAARTracker = function() {
    tracking.HAARTracker.base(this, 'constructor');
  };

  tracking.inherits(tracking.HAARTracker, tracking.Tracker);

  /**
   * Holds the HAAR cascade data converted from OpenCV training.
   * @type {array}
   * @static
   */
  tracking.HAARTracker.data = {};

  /**
   * Specifies the tracker HAAR data for the instance.
   * @type {array}
   */
  tracking.HAARTracker.prototype.data = null;

  /**
   * Specifies the edges density of a block in order to decide whether to skip
   * it or not.
   * @default 0.2
   * @type {number}
   */
  tracking.HAARTracker.prototype.edgesDensity = 0.2;

  /**
   * Specifies the initial scale to start the feature block scaling.
   * @default 1.0
   * @type {number}
   */
  tracking.HAARTracker.prototype.initialScale = 1.0;

  /**
   * Specifies the scale factor to scale the feature block.
   * @default 1.25
   * @type {number}
   */
  tracking.HAARTracker.prototype.scaleFactor = 1.25;

  /**
   * Specifies the block step size.
   * @default 1.5
   * @type {number}
   */
  tracking.HAARTracker.prototype.stepSize = 1.5;

  /**
   * Gets the tracker HAAR data.
   * @return {string}
   */
  tracking.HAARTracker.prototype.getData = function() {
    return this.data;
  };

  /**
   * Gets the edges density value.
   * @return {number}
   */
  tracking.HAARTracker.prototype.getEdgesDensity = function() {
    return this.edgesDensity;
  };

  /**
   * Gets the initial scale to start the feature block scaling.
   * @return {number}
   */
  tracking.HAARTracker.prototype.getInitialScale = function() {
    return this.initialScale;
  };

  /**
   * Gets the scale factor to scale the feature block.
   * @return {number}
   */
  tracking.HAARTracker.prototype.getScaleFactor = function() {
    return this.scaleFactor;
  };

  /**
   * Gets the block step size.
   * @return {number}
   */
  tracking.HAARTracker.prototype.getStepSize = function() {
    return this.stepSize;
  };

  /**
   * Tracks the `Video` frames. This method is called for each video frame in
   * order to decide whether `onFound` or `onNotFound` callback will be fired.
   * @param {Uint8ClampedArray} pixels The pixels data to track.
   * @param {number} width The pixels canvas width.
   * @param {number} height The pixels canvas height.
   */
  tracking.HAARTracker.prototype.track = function(pixels, width, height) {
    var data = this.getData();
    if (!data) {
      throw new Error('HAAR cascade data not set.');
    }
    var payload = tracking.ViolaJones.detect(pixels, width, height, this.getInitialScale(), this.getScaleFactor(), this.getStepSize(), this.getEdgesDensity(), data);
    if (payload.length) {
      if (this.onFound) {
        this.onFound.call(this, payload);
      }
    } else {
      if (this.onNotFound) {
        this.onNotFound.call(this, payload);
      }
    }
  };

  /**
   * Sets the tracker HAAR data.
   * @param {array} data
   */
  tracking.HAARTracker.prototype.setData = function(data) {
    this.data = data;
  };

  /**
   * Sets the edges density.
   * @param {number} edgesDensity
   */
  tracking.HAARTracker.prototype.setEdgesDensity = function(edgesDensity) {
    this.edgesDensity = edgesDensity;
  };

  /**
   * Sets the initial scale to start the block scaling.
   * @param {number} initialScale
   */
  tracking.HAARTracker.prototype.setInitialScale = function(initialScale) {
    this.initialScale = initialScale;
  };

  /**
   * Sets the scale factor to scale the feature block.
   * @param {number} scaleFactor
   */
  tracking.HAARTracker.prototype.setScaleFactor = function(scaleFactor) {
    this.scaleFactor = scaleFactor;
  };

  /**
   * Sets the block step size.
   * @param {number} stepSize
   */
  tracking.HAARTracker.prototype.setStepSize = function(stepSize) {
    this.stepSize = stepSize;
  };

}());

(function() {
  /**
   * ColorTracker utility to track colored blobs in a frrame using color
   * difference evaluation.
   * @constructor
   * @extends {tracking.Tracker}
   */
  tracking.ColorTracker = function() {
    tracking.ColorTracker.base(this, 'constructor');

    this.setColors(['magenta']);
  };

  tracking.inherits(tracking.ColorTracker, tracking.Tracker);

  /**
   * Holds the minimum number of found pixels to represent a blob.
   * @type {number}
   * @default 30
   * @static
   */
  tracking.ColorTracker.MIN_PIXELS = 30;

  /**
   * Holds the known colors.
   * @type {Object.<string, function>}
   * @private
   * @static
   */
  tracking.ColorTracker.knownColors_ = {};

  /**
   * Registers a color as known color.
   * @param {string} name The color name.
   * @param {function} fn The color function to test if the passed (r,g,b) is the
   *     desired color.
   * @static
   */
  tracking.ColorTracker.registerColor = function(name, fn) {
    tracking.ColorTracker.knownColors_[name] = fn;
  };

  /**
   * Gets the known color function that is able to test whether an (r,g,b) is
   * the desired color.
   * @param {string} name The color name.
   * @return {function} The known color test function.
   * @static
   */
  tracking.ColorTracker.getColor = function(name) {
    return tracking.ColorTracker.knownColors_[name];
  };

  /**
   * Holds the colors to be tracked by the `ColorTracker` instance.
   * @default ['magenta']
   * @type {Array.<string>}
   */
  tracking.ColorTracker.prototype.colors = null;

  /**
   * Calculates the central coordinate from the cloud points. The cloud points
   * are all points that matches the desired color.
   * @param {Array.<number>} cloud Major row order array containing all the
   *     points from the desired color, e.g. [x1, y1, c2, y2, ...].
   * @param {number} total Total numbers of pixels of the desired color.
   * @return {object} Object contaning the x, y and estimated z coordinate of
   *     the blog extracted from the cloud points.
   * @private
   */
  tracking.ColorTracker.prototype.calculateCentralCoordinate_ = function(cloud, total) {
    var dx = 0;
    var dy = 0;
    var maxx = -1;
    var maxy = -1;
    var minx = Infinity;
    var miny = Infinity;
    var totalInliers = 0;

    for (var c = 0; c < total; c += 2) {
      var x = cloud[c];
      var y = cloud[c + 1];

      if (x > -1 && y > -1) {
        dx += x;
        dy += y;
        totalInliers++;

        if (x < minx) {
          minx = x;
        }
        if (x > maxx) {
          maxx = x;
        }
        if (y < miny) {
          miny = y;
        }
        if (y > maxy) {
          maxy = y;
        }
      }
    }
    if (totalInliers === 0) {
      return null;
    }
    return {
      x: dx / totalInliers,
      y: dy / totalInliers,
      z: 60 - ((maxx - minx) + (maxy - miny)) / 2
    };
  };

  /**
   * Flags the cloud points with -1 when the pixel of the desired color is far
   * by `tracking.ColorTracker.MIN_PIXELS` of the area with a bigger density
   * of pixels of the desired color. This helps to reduce outliers from the
   * tracking.
   * @param {Array.<number>} cloud Major row order array containing all the
   *     points from the desired color, e.g. [x1, y1, c2, y2, ...].
   * @param {number} total Total numbers of pixels of the desired color.
   * @private
   */
  tracking.ColorTracker.prototype.flagOutliers_ = function(cloud, total) {
    for (var m = 0; m < total; m += 2) {
      var dist = 0;
      for (var n = 2; n < total; n += 2) {
        dist += tracking.Math.distance(cloud[m], cloud[m + 1], cloud[n], cloud[n + 1]);
      }
      if (dist/total >= tracking.ColorTracker.MIN_PIXELS) {
        cloud[m] = -1;
        cloud[m + 1] = -1;
        total[m]--;
      }
    }
  };

  /**
   * Gets the colors being tracked by the `ColorTracker` instance.
   * @return {Array.<string>}
   */
  tracking.ColorTracker.prototype.getColors = function() {
    return this.colors;
  };

  /**
   * Sets the colors to be tracked by the `ColorTracker` instance.
   * @param {Array.<string>} colors
   */
  tracking.ColorTracker.prototype.setColors = function(colors) {
    this.colors = colors;
  };

  /**
   * Tracks the `Video` frames. This method is called for each video frame in
   * order to decide whether `onFound` or `onNotFound` callback will be fired.
   * @param {Uint8ClampedArray} pixels The pixels data to track.
   * @param {number} width The pixels canvas width.
   * @param {number} height The pixels canvas height.
   */
  tracking.ColorTracker.prototype.track = function(pixels, width, height) {
    var instance = this,
      color,
      colorFn,
      colorIndex,
      colors = this.getColors(),
      cloud = [],
      payload = [],
      total = [];

    tracking.Matrix.forEach(pixels, width, height, function(r, g, b, a, w, i, j) {
      for (colorIndex = -1; color = colors[++colorIndex];) {
        if (!cloud[colorIndex]) {
          total[colorIndex] = 0;
          cloud[colorIndex] = [];
        }

        colorFn = tracking.ColorTracker.knownColors_[color];

        if (colorFn && colorFn.call(instance, r, g, b, a, w, i, j)) {
          total[colorIndex] += 2;
          cloud[colorIndex].push(j, i);
        }
      }
    });

    for (colorIndex = -1; color = colors[++colorIndex];) {
      if (total[colorIndex] < tracking.ColorTracker.MIN_PIXELS) {
        continue;
      }

      instance.flagOutliers_(cloud[colorIndex], total[colorIndex]);

      var data = instance.calculateCentralCoordinate_(cloud[colorIndex], total[colorIndex]);
      if (data) {
        data.color = colors[colorIndex];
        data.pixels = cloud[colorIndex];
        payload.push(data);
      }
    }

    if (payload.length) {
      if (instance.onFound) {
        instance.onFound.call(instance, payload);
      }
    }
    else {
      if (instance.onNotFound) {
        instance.onNotFound.call(instance, payload);
      }
    }
  };

  // Default colors
  //===================

  tracking.ColorTracker.registerColor('cyan', function(r, g, b) {
    var thresholdGreen = 50,
      thresholdBlue = 70,
      dx = r - 0,
      dy = g - 255,
      dz = b - 255;

    if ((g - r) >= thresholdGreen && (b - r) >= thresholdBlue) {
      return true;
    }
    return Math.sqrt(dx * dx + dy * dy + dz * dz) < 80;
  });

  tracking.ColorTracker.registerColor('magenta', function(r, g, b) {
    var threshold = 50,
      dx = r - 255,
      dy = g - 0,
      dz = b - 255;

    if ((r - g) >= threshold && (b - g) >= threshold) {
      return true;
    }
    return Math.sqrt(dx * dx + dy * dy + dz * dz) < 140;
  });

  tracking.ColorTracker.registerColor('yellow', function(r, g, b) {
    var threshold = 50,
      dx = r - 255,
      dy = g - 255,
      dz = b - 0;

    if ((r - g) >= threshold && (b - g) >= threshold) {
      return true;
    }
    return Math.sqrt(dx * dx + dy * dy + dz * dz) < 100;
  });

}());

(function() {
  /**
   * EyeTracker utility.
   * @constructor
   * @extends {tracking.HAARTracker}
   */
  tracking.EyeTracker = function() {
    tracking.EyeTracker.base(this, 'constructor');

    var data = tracking.HAARTracker.data.eye;
    if (data) {
      this.setData(new Float64Array(data));
    }
  };

  tracking.inherits(tracking.EyeTracker, tracking.HAARTracker);
}());

(function() {
  /**
   * FaceTracker utility.
   * @constructor
   * @extends {tracking.HAARTracker}
   */
  tracking.FaceTracker = function() {
    tracking.FaceTracker.base(this, 'constructor');

    var data = tracking.HAARTracker.data.face;
    if (data) {
      this.setData(new Float64Array(data));
    }
  };

  tracking.inherits(tracking.FaceTracker, tracking.HAARTracker);
}());

(function() {
  /**
   * MouthTracker utility.
   * @constructor
   * @extends {tracking.HAARTracker}
   */
  tracking.MouthTracker = function() {
    tracking.MouthTracker.base(this, 'constructor');

    var data = tracking.HAARTracker.data.mouth;
    if (data) {
      this.setData(new Float64Array(data));
    }
  };

  tracking.inherits(tracking.MouthTracker, tracking.HAARTracker);
}());

(function() {

  tracking.KeypointTracker = function () {
    this.setType('keypoint');
  };

  tracking.inherits(tracking.KeypointTracker, tracking.Tracker);

  tracking.KeypointTracker.prototype.getCameraIntrisicParameters = function () {
    var instance = this;

    if (!instance._cameraIntrisicParameters) {
      instance._cameraIntrisicParameters = new tracking.Matrix({matrix: [[2868.4, 0, 1219.5],[0, 2872.1, 1591.7],[0, 0, 1]]});
    }

    return instance._cameraIntrisicParameters;
  };

  tracking.KeypointTracker.prototype.setCameraIntrisicParameters = function (matrix) {
    if (Array.isArray(matrix)) {
      this._cameraIntrisicParameters = new tracking.Matrix(matrix);
    }
    else {
      this._cameraIntrisicParameters = matrix;
    }
  };

  tracking.KeypointTracker.prototype._extractKeypoints = function () {
      
  };

  tracking.KeypointTracker.prototype._matchKeypoints = function () {
      
  };

  tracking.KeypointTracker.prototype._estimatePose = function () {
      
  };

  tracking.KeypointTracker.prototype.track = function(pixels, width, height) {
    
  };

}());