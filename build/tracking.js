/**
 * tracking.js - Augmented Reality JavaScript Framework.
 * @author Eduardo Lundgren <edu@rdo.io>
 * @version v0.0.1
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
    var width = element.offsetWidth;
    var height = element.offsetHeight;

    canvas.width = width;
    canvas.height = height;

    window.requestAnimationFrame(function() {
      if (element.readyState === element.HAVE_ENOUGH_DATA) {
        context.drawImage(element, 0, 0, width, height);
        tracking.trackCanvas_(canvas, tracker);
      }
      tracking.trackVideo_(element, tracker);
    });
  };

  // Browser polyfills
  //===================

  if (!window.self.Int8Array) {
    window.self.Int8Array = Array;
  }

  if (!window.self.Uint8Array) {
    window.self.Uint8Array = Array;
  }

  if (!window.self.Uint8ClampedArray) {
    window.self.Uint8ClampedArray = Array;
  }

  if (!window.self.Uint16Array) {
    window.self.Uint16Array = Array;
  }

  if (!window.self.Int32Array) {
    window.self.Int32Array = Array;
  }

  if (!window.self.Uint32Array) {
    window.self.Uint32Array = Array;
  }

  if (!window.self.Float32Array) {
    window.self.Float32Array = Array;
  }

  if (!window.self.Float64Array) {
    window.self.Float64Array = Array;
  }

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
  tracking.EPnP = {};

  tracking.EPnP.solve = function(objectPoints, imagePoints, cameraMatrix) {};
}());

(function() {
  /*
   * FAST intends for "Features from Accelerated Segment Test". This method
   * performs a point segment test corner detection. The segment test criterion
   * operates by considering a circle of sixteen pixels around the corner
   * candidate p. The detector classifies p as a corner if there exists a set of n
   * contiguous pixelsin the circle which are all brighter than the intensity of
   * the candidate pixel Ip plus a threshold t, or all darker than Ip − t.
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
   *
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
    var circleOffsets = this.getCircleOffsets_(width),
      circlePixels = new Int32Array(16),
      corners = [];

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
    var brighter,
      circlePixel,
      darker;

    if (this.isTriviallyExcluded(circlePixels, p, threshold)) {
      return false;
    }

    for (var x = 0; x < 16; x++) {
      darker = true;
      brighter = true;

      for (var y = 0; y < 9; y++) {
        circlePixel = circlePixels[(x + y) & 15];

        if (!this.isBrighter(p, circlePixel, threshold)) {
          brighter = false;
        }

        if (!this.isDarker(p, circlePixel, threshold)) {
          darker = false;
        }
      }
    }

    return brighter || darker;
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
    var dx = x1 - x0,
      dy = y1 - y0;

    return Math.sqrt(dx * dx + dy * dy);
  };

  /**
   * Calculates the Hamming distance between two binary strings of equal
   * length is the number of positions at which the corresponding symbols are
   * different. In another way, it measures the minimum number of
   * substitutions required to change one string into the other, or the
   * minimum number of errors that could have transformed one string into the
   * other.
   *
   * Example:
   * Binary string between   Hamming distance
   *  1011101 and 1001001           2
   *
   * @param {Array.<number>} desc1 Array of numbers necessary to store the
   *     binary string, e.g. for 128 bits this array requires at least 4
   *     positions.
   * @param {Array.<number>} desc3 Array of numbers necessary to store the
   *     binary string, e.g. for 128 bits this array requires at least 4
   *     positions.
   * @return {number} The hamming distance.
   */
  tracking.Math.hammingDistance = function(desc1, desc2) {
    var dist = 0, v, length;

    for (v = 0, length = desc1.length; v < length; v++) {
      dist += this.hammingWeight(desc1[v] ^ desc2[v]);
    }

    return dist;
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
}());

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
   * Loops the pixels array modifying each pixel based on `fn` transformation
   * function.
   * @param {array} pixels The pixels in a linear [r,g,b,a,...] array to loop
   *     through.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {function} fn The transformation function.
   * @return {array} The transformed pixels.
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

(function() {
  /**
   * Tracker utility.
   * @constructor
   */
  tracking.Tracker = function() {};

  /**
   * Specifies the tracker type.
   * @type {string}
   */
  tracking.Tracker.prototype.type = null;

  /**
   * Gets the tracker type.
   * @return {string}
   */
  tracking.Tracker.prototype.getType = function() {
    return this.type;
  };

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
   * Sets the tracker type.
   * @param {string} type
   */
  tracking.Tracker.prototype.setType = function(type) {
    this.type = type;
  };

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
   * ColorTracker utility.
   * @constructor
   * @extends {tracking.Tracker}
   */
  tracking.ColorTracker = function() {
    tracking.ColorTracker.base(this, 'constructor');

    this.setType('color');
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

// (function() {
//   tracking.type.HUMAN = {

//     NAME: 'HUMAN',

//     data: {},

//     defaults: {
//       blockSize: 20,

//       blockJump: 2,

//       blockScale: 1.25,

//       data: 'frontal_face',

//       minNeighborArea: 0.5
//     },

//     evalStage_: function(stage, integralImage, integralImageSquare, i, j, width, height, blockSize) {
//       var instance = this,
//         defaults = instance.defaults,
//         stageThreshold = stage[1],
//         tree = stage[2],
//         treeLen = tree.length,
//         t,

//         stageSum = 0,
//         inverseArea = 1.0 / (blockSize * blockSize),
//         scale = blockSize / defaults.blockSize,

//         total,
//         totalSquare,
//         mean,
//         variance,
//         wb1 = i * width + j,
//         wb2 = i * width + (j + blockSize),
//         wb3 = (i + blockSize) * width + j,
//         wb4 = (i + blockSize) * width + (j + blockSize);

//       total = integralImage[wb1] - integralImage[wb2] - integralImage[wb3] + integralImage[wb4];
//       totalSquare = integralImageSquare[wb1] - integralImageSquare[wb2] - integralImageSquare[wb3] + integralImageSquare[wb4];
//       mean = total * inverseArea;
//       variance = totalSquare * inverseArea - mean * mean;

//       if (variance > 1) {
//         variance = Math.sqrt(variance);
//       } else {
//         variance = 1;
//       }

//       for (t = 0; t < treeLen; t++) {
//         var node = tree[t],
//           nodeLen = node.length,

//           nodeThreshold = node[nodeLen - 3],
//           left = node[nodeLen - 2],
//           right = node[nodeLen - 1],

//           rectsSum = 0,
//           rectsLen = (nodeLen - 3) / 5,
//           r,
//           x1, y1, x2, y2, rectWidth, rectHeight, rectWeight, w1, w2, w3, w4;

//         for (r = 0; r < rectsLen; r++) {
//           x1 = j + ~~(node[r * 5] * scale);
//           y1 = i + ~~(node[r * 5 + 1] * scale);
//           rectWidth = ~~(node[r * 5 + 2] * scale);
//           rectHeight = ~~(node[r * 5 + 3] * scale);
//           rectWeight = node[r * 5 + 4];

//           x2 = x1 + rectWidth;
//           y2 = y1 + rectHeight;

//           w1 = y1 * width + x1;
//           w2 = y1 * width + x2;
//           w3 = y2 * width + x1;
//           w4 = y2 * width + x2;

//           rectsSum += (integralImage[w1] - integralImage[w2] - integralImage[w3] + integralImage[w4]) * rectWeight;
//         }

//         if (rectsSum * inverseArea < nodeThreshold * variance) {
//           stageSum += left;
//         } else {
//           stageSum += right;
//         }
//       }

//       return (stageSum > stageThreshold);
//     },

//     merge_: function(rects) {
//       var instance = this,
//         defaults = instance.defaults,
//         minNeighborArea = defaults.minNeighborArea,
//         rectsLen = rects.length,
//         i,
//         j,
//         x1,
//         y1,
//         blockSize1,
//         x2,
//         y2,
//         x3,
//         y3,
//         x4,
//         y4,
//         blockSize2,
//         px1,
//         py1,
//         px2,
//         py2,
//         pArea,
//         rect1,
//         rect2,
//         hasGroup = new Uint32Array(rectsLen),
//         face,
//         facesMap = {};

//       for (i = 0; i < rectsLen; i++) {
//         if (hasGroup[i]) {
//           continue;
//         }

//         rect1 = rects[i];

//         hasGroup[i] = 1;
//         facesMap[i] = {
//           count: 0,
//           rect: rect1
//         };

//         x1 = rect1.x;
//         y1 = rect1.y;
//         blockSize1 = rect1.size;
//         x2 = x1 + blockSize1;
//         y2 = y1 + blockSize1;

//         for (j = i + 1; j < rectsLen; j++) {
//           if (hasGroup[j]) {
//             continue;
//           }

//           rect2 = rects[j];

//           if (i === j) {
//             continue;
//           }

//           x3 = rect2.x;
//           y3 = rect2.y;
//           blockSize2 = rect2.size;
//           x4 = x3 + blockSize2;
//           y4 = y3 + blockSize2;

//           px1 = Math.max(x1, x3);
//           py1 = Math.max(y1, y3);
//           px2 = Math.min(x2, x4);
//           py2 = Math.min(y2, y4);
//           pArea = (px1 - px2) * (py1 - py2);

//           if ((pArea / (blockSize1 * blockSize1) >= minNeighborArea) &&
//             (pArea / (blockSize2 * blockSize2) >= minNeighborArea)) {

//             face = facesMap[i];
//             hasGroup[j] = 1;
//             face.count++;
//             if (blockSize2 < blockSize1) {
//               face.rect = rect2;
//             }
//           }
//         }
//       }

//       var faces = [];
//       for (i in facesMap) {
//         face = facesMap[i];
//         if (face.count > 0) {
//           faces.push(face.rect);
//         }
//       }

//       return faces;
//     },

//     track: function(trackerGroup, video) {
//       var instance = this,
//         // Human tracking finds multiple targets, doesn't need to support
//         // multiple track listeners, force to use only the first configuration.
//         config = trackerGroup[0],
//         defaults = instance.defaults,
//         imageData = video.getVideoCanvasImageData(),
//         canvas = video.canvas,
//         height = canvas.get('height'),
//         width = canvas.get('width'),
//         integralImage = new Uint32Array(width * height),
//         integralImageSquare = new Uint32Array(width * height),

//         imageLen = 0,

//         stages = instance.data[config.data || defaults.data],
//         stagesLen = stages.length,
//         s,
//         pixel,
//         pixelSum = 0,
//         pixelSumSquare = 0;

//       canvas.forEach(imageData, function(r, g, b, a, w, i, j) {
//         pixel = ~~(r * 0.299 + b * 0.587 + g * 0.114);

//         if (i === 0 && j === 0) {
//           pixelSum = pixel;
//           pixelSumSquare = pixel * pixel;
//         } else if (i === 0) {
//           pixelSum = pixel + integralImage[i * width + (j - 1)];
//           pixelSumSquare = pixel * pixel + integralImageSquare[i * width + (j - 1)];
//         } else if (j === 0) {
//           pixelSum = pixel + integralImage[(i - 1) * width + j];
//           pixelSumSquare = pixel * pixel + integralImageSquare[(i - 1) * width + j];
//         } else {
//           pixelSum = pixel + integralImage[i * width + (j - 1)] + integralImage[(i - 1) * width + j] - integralImage[(i - 1) * width + (j - 1)];
//           pixelSumSquare = pixel * pixel + integralImageSquare[i * width + (j - 1)] + integralImageSquare[(i - 1) * width + j] - integralImageSquare[(i - 1) * width + (j - 1)];
//         }

//         integralImage[imageLen] = pixelSum;
//         integralImageSquare[imageLen] = pixelSumSquare;
//         imageLen++;
//       });

//       var i,
//         j,
//         blockJump = defaults.blockJump,
//         blockScale = defaults.blockScale,
//         blockSize = defaults.blockSize,
//         maxBlockSize = Math.min(width, height),
//         rectIndex = 0,
//         rects = [];

//       for (; blockSize <= maxBlockSize; blockSize = ~~(blockSize * blockScale)) {
//         for (i = 0; i < (height - blockSize); i += blockJump) {
//           for (j = 0; j < (width - blockSize); j += blockJump) {
//             var pass = true;

//             for (s = 0; s < stagesLen; s++) {
//               var stage = stages[s];

//               pass = instance.evalStage_(stage, integralImage, integralImageSquare, i, j, width, height, blockSize);

//               if (!pass) {
//                 break;
//               }
//             }

//             if (pass) {
//               rects[rectIndex++] = {
//                 size: blockSize,
//                 x: j,
//                 y: i
//               };

//               // canvas.context.strokeStyle = "rgb(255,0,0)";
//               // canvas.context.strokeRect(j, i, blockSize, blockSize);
//             }
//           }
//         }
//       }

//       if (config.onFound) {
//         config.onFound.call(video, instance.merge_(rects, video));
//       }
//     }
//   };
// }());
