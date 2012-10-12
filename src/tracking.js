(function (window, undefined) {

var document = window.document,
    navigator = window.navigator,

    hasOwn_ = Object.prototype.hasOwnProperty,
    slice_ = Array.prototype.slice;

var tracking = {

    type: {},

    all: function(selector, opt_element) {
        return Array.prototype.slice.call(
                (opt_element || document).querySelectorAll(selector));
    },

    augment: function(C, P) {
        var instance = this;

        // Chaining C and P constructors
        function BuiltClass() {
            P.apply(this, arguments);
            C.apply(this, arguments);
        }

        // TempClass to avoid invoke P constructor twice during BuiltClass.prototype = new TempClass()
        function TempClass() {}
        TempClass.prototype = P.prototype;

        BuiltClass.superclass = P.prototype;
        BuiltClass.prototype = new TempClass();
        BuiltClass.prototype.constructor = BuiltClass;
        tracking.merge(BuiltClass.prototype, C.prototype);

        return BuiltClass;
    },

    bind: function(fn, opt_context, var_args1) {
        var instance = this;

        if (var_args1 !== undefined) {
            var_args1 = slice_.call(arguments, 2);
        }

        return function(var_args2) {
            if (var_args2 !== undefined) {
                var_args2 = slice_.call(arguments);

                if (var_args1 !== undefined) {
                    var_args2 = var_args2.concat(var_args1);
                }
            }

            return fn.apply(opt_context || instance, var_args2 || var_args1);
        };
    },

    forEach: function(o, fn, opt_context) {
        var instance = this, key;

        if (Array.isArray(o)) {
            o.forEach(function() {
                fn.apply(opt_context || this, arguments);
            });
        }
        else {
            for (key in o) {
                if (hasOwn_.call(o, key)) {
                    fn.call(opt_context || o, o[key], key, o);
                }
            }
        }

        return o;
    },

    isNode: function(o) {
        return o.nodeType || this.isWindow(o);
    },

    isString: function(o) {
        return typeof o === 'string';
    },

    isWindow: function(o) {
        return !!(o && o.alert && o.document);
    },

    merge: function(target, o) {
        var instance = this, key;

        for (key in o) {
            if (hasOwn_.call(o, key)) {
                target[key] = o[key];
            }
        }

        return target;
    },

    one: function(selector, opt_element) {
        var instance = this;

        if (instance.isNode(selector)) {
            return selector;
        }

        return (opt_element || document).querySelector(selector);
    }

};

tracking.math = {
    /*
     * Euclidean distance between two points P(x0, y0) and P(x1, y1).
     */
    distance: function(x0, y0, x1, y1) {
        var dx = x1-x0,
            dy = y1-y0;

        return Math.sqrt(dx*dx + dy*dy);
    }
};

// tracking.Attribute

var Attribute = function() {
    var instance = this;

    instance.attrs_ = {};
};

Attribute.prototype = {
    attrs_: null,

    setAttrs: function(attrMap, silent) {
        var instance = this;

        tracking.forEach(attrMap, function(attrValue, attrName) {
            if (silent) {
                instance.attrs_[attrName] = attrValue;
            }
            else {
                instance.set(attrName, attrValue);
            }
        });
    },

    set: function(attrName, attrValue) {
        var instance = this,
            changeFn = instance[attrName + 'Change_'];

        instance.attrs_[attrName] = attrValue;

        if (changeFn) {
            changeFn.call(instance, attrValue, attrName);
        }

        return attrValue;
    },

    get: function(attrName) {
        var instance = this;

        return instance.attrs_[attrName];
    },

    getAttrs: function() {
        var instance = this;

        return instance.attrs_;
    },

    linkAttr: function(attrName, attrTarget, opt_set) {
        var instance = this,
            changeFnName = attrName + 'Change_',
            changeFn = instance[changeFnName];

            instance[changeFnName] = function(val) {
                if (changeFn) {
                    changeFn.apply(this, arguments);
                }
                attrTarget.set(attrName, val);
            };

            if (opt_set) {
                attrTarget.set(attrName, instance.get(attrName));
            }
    }
};

tracking.Attribute = Attribute;

// tracking.DomElement

var DomElement = function(opt_config) {
    var instance = this;

    instance.setAttrs(tracking.merge({
        height: 240,
        visible: true,
        width: 320
    }, opt_config), true);
};

DomElement.prototype = {
    domElement: null,

    heightChange_: function(val) {
        var instance = this;

        instance.domElement.height = val;
    },

    hide: function() {
        var instance = this;

        instance.set('visible', false);

        return instance;
    },

    render: function(opt_selector) {
        var instance = this;

        instance.heightChange_(instance.get('height'));
        instance.visibleChange_(instance.get('visible'));
        instance.widthChange_(instance.get('width'));

        tracking.one(opt_selector || document.body).appendChild(
            instance.domElement);

        return instance;
    },

    show: function() {
        var instance = this;

        instance.set('visible', true);

        return instance;
    },

    visibleChange_: function(val) {
        var instance = this;

        instance.domElement.style.display = val ? 'block' : 'none';
    },

    widthChange_: function(val) {
        var instance = this;

        instance.domElement.width = val;
    }
};

tracking.DomElement = tracking.augment(DomElement, tracking.Attribute);

// tracking.Canvas

var Canvas = function(opt_config) {
    var instance = this;

    instance.createCanvas_();
};

Canvas.prototype = {
    context: null,

    createCanvas_: function() {
        var instance = this,
            domElement = document.createElement('canvas');

        instance.domElement = domElement;
        instance.context = domElement.getContext('2d');
    },

    getImageData: function(opt_x, opt_y, opt_width, opt_height) {
        var instance = this,
            x = opt_x || 0,
            y = opt_y || 0,
            width = opt_width || instance.get('width'),
            height = opt_height || instance.get('height');

        return instance.context.getImageData(x, y, width, height);
    },

    setImageData: function(data, opt_x, opt_y) {
        var instance = this,
            x = opt_x || 0,
            y = opt_y || 0;

        instance.context.putImageData(data, x, y);

        return instance;
    },

    forEach: function(imageData, fn, opt_jump) {
        var instance = this,
            width = imageData.width,
            height = imageData.height,
            data = imageData.data,
            jump = opt_jump || 1,
            i = 0,
            j = 0,
            w;

        for (i = 0; i < height; i+=jump) {
            for (j = 0; j < width; j+=jump) {
                w = i*width*4 + j*4;
                fn.call(instance, data[w], data[w+1], data[w+2], data[w+3], w, i, j, imageData);
            }
        }
    },

    loadImage: function(src, opt_fn, opt_x, opt_y, opt_width, opt_height) {
        var instance = this,
            x = opt_x || 0,
            y = opt_y || 0,
            width = opt_width || instance.get('width'),
            height = opt_height || instance.get('height'),
            context = instance.context;

        if (context) {
            var img = new Image();

            img.onload = function() {
                context.drawImage(img, x, y, width, height);

                if (opt_fn) {
                    opt_fn.call(instance);
                }

                img = null;
            };

            img.src = src;
        }
    },

    toDataURL: function(opt_format) {
        var instance = this;

        return instance.domElement.toDataURL(opt_format || 'image/png');
    },

    transform: function(fn) {
        var instance = this,
            imageData = instance.getImageData(),
            data = imageData.data,
            value;

        instance.forEach(imageData, function(r, g, b, a, w, i, j) {
            var value = fn.apply(instance, arguments);

            data[w] = value[0];
            data[w+1] = value[1];
            data[w+2] = value[2];
            data[w+3] = value[3];
        });

        instance.setImageData(imageData);

        return instance;
    }
};

tracking.Canvas = tracking.augment(Canvas, tracking.DomElement);

// tracking.Video

var Video = function(opt_config) {
    var instance = this;

    instance.setAttrs(tracking.merge({
        autoplay: true,
        controls: true
    }, opt_config), true);

    instance.trackers_ = {};

    instance.createVideo_();
    instance.createCanvas_();
};

Video.prototype = {
    canvas: null,

    trackers_: null,

    createCanvas_: function() {
        var instance = this;

        instance.canvas = new tracking.Canvas();

        instance.linkAttr('height', instance.canvas, true);
        instance.linkAttr('width', instance.canvas, true);
    },

    createVideo_: function() {
        var instance = this,
            autoplay = instance.get('autoplay'),
            domElement = document.createElement('video');

        domElement.autoplay = autoplay;
        domElement.controls = instance.get('controls');

        instance.domElement = domElement;

        if (autoplay) {
            // Firefox 18.0a1 (2012-08-31) doesn't respect autoplay property set, force play.
            instance.play();
        }
    },

    getVideoCanvasImageData: function() {
        var instance = this;

        instance.syncVideoCanvas();

        return instance.canvas.getImageData();
    },

    load: function() {
        var instance = this,
            domElement = instance.domElement;

        domElement.load.apply(domElement, arguments);

        return instance;
    },

    loop_: function() {
        var instance = this,
            i = 0,
            trackers = instance.trackers_,
            type;

        tracking.forEach(trackers, function(trackerGroup, trackerName) {
            type = tracking.type[trackerName];

            if (type.track) {
                type.track(trackerGroup, instance);
            }
        });

        if (Object.keys(trackers).length) {
            requestAnimationFrame(function loop() {
                instance.loop_();
            });
        }
    },

    pause: function() {
        var instance = this,
            domElement = instance.domElement;

        domElement.pause.apply(domElement, arguments);

        return instance;
    },

    play: function() {
        var instance = this,
            domElement = instance.domElement;

        domElement.play.apply(domElement, arguments);

        return instance;
    },

    renderVideoCanvas: function(opt_selector) {
        var instance = this;

        instance.syncVideoCanvas();

        tracking.one(opt_selector || document.body).appendChild(
            instance.canvas.domElement);

        return instance;
    },

    srcChange_: function(stream) {
        var instance = this;

        instance.domElement.src = stream;
    },

    stopTracking: function() {
        var instance = this;

        instance.trackers_ = {};
    },

    syncVideoCanvas: function() {
        var instance = this,
            domElement = instance.domElement,
            width = instance.get('width'),
            height = instance.get('height');

        if (domElement.readyState === domElement.HAVE_ENOUGH_DATA) {
            instance.canvas.context.drawImage(
                instance.domElement, 0, 0, width, height);
        }

        return instance;
    },

    toDataURL: function(opt_format) {
        var instance = this;

        instance.syncVideoCanvas();

        return instance.canvas.toDataURL(opt_format);
    },

    track: function(config) {
        var instance = this,
            type = tracking.type[config.type.toUpperCase()],
            trackers = instance.trackers_;

        if (!type) {
            throw Error('A tracker type should be specified.');
        }

        if (!trackers[type.NAME]) {
            trackers[type.NAME] = [];
        }

        trackers[type.NAME].push(config);

        if (Object.keys(trackers).length === 1) {
            instance.loop_();
        }
    }
};

tracking.Video = tracking.augment(Video, tracking.DomElement);

// tracking.VideoCamera

var VideoCamera = function(opt_config) {
    var instance = this;

    instance.setAttrs(tracking.merge({
        audio: true
    }, opt_config), true);

    instance.initUserMedia_();
};

VideoCamera.prototype = {
    initUserMedia_: function() {
        var instance = this;

        navigator.getUserMedia(
            // Firefox 18.0a1 (2012-08-31) doesn't support audio yet, since we don't do nothing with audio, remove it for now.
            navigator.mozGetUserMedia ?
                { video: true } :
                { audio: instance.get('audio'), video: true },
            tracking.bind(instance.defSuccessHandler_, instance),
            tracking.bind(instance.defErrorHandler_, instance));
    },

    defSuccessHandler_: function(stream) {
        var instance = this;

        try {
            instance.set('src', URL.createObjectURL(stream));
        }
        catch (err) {
            // Firefox 18.0a1 (2012-08-31) doesn't require create object URL
            instance.set('src', stream);
        }
    },

    defErrorHandler_: function(err) {
        throw Error(err);
    }
};

tracking.VideoCamera = tracking.augment(VideoCamera, tracking.Video);

// self.Int32Array polyfill
if (!self.Int32Array) {
    self.Int32Array = Array;
    self.Float32Array = Array;
}

// self.Uint8ClampedArray polyfill
if (!self.Uint8ClampedArray) {
    self.Uint8ClampedArray = Array;
}

// window.URL polyfill
if (!window.URL) {
    window.URL = window.URL || window.webkitURL || window.msURL || window.oURL;
}

// getUserMedia polyfill
if (!navigator.getUserMedia) {
    navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

// requestAnimationFrame polyfill by Erik Möller
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'], x;
    for(x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] ||
            window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
}());

window.tracking = tracking;

}( window ));