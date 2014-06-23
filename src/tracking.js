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
      throw new Error('Tracker not specified, try `tracking.track(element, new FaceTracker())`.');
    }

    switch(element.nodeName.toLowerCase()) {
      case 'canvas':
        return this.trackCanvas_(element, tracker, opt_options);
      case 'img':
        return this.trackImg_(element, tracker, opt_options);
      case 'video':
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
}(window));
