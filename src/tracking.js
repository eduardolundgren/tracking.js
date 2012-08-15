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

// tracking.Canvas

var Canvas = function(opt_config) {
    var instance = this;

    instance.setAttrs(tracking.merge({
        canvasNode: null,
        height: 240,
        width: 320
    }, opt_config), true);

    instance.createCanvas_();
};

Canvas.prototype = {
    context: null,

    createCanvas_: function() {
        var instance = this,
            canvasNode = document.createElement('canvas');

        instance.context = canvasNode.getContext('2d');
        canvasNode.height = instance.get('height');
        canvasNode.width = instance.get('width');

        instance.set('canvasNode', canvasNode);

        return canvasNode;
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
            i = 0,
            j = 0,
            w;

        for (i = 0; i < height; i++) {
            for (j = 0; j < width; j++) {
                w = i*width*4 + j*4;
                fn.call(instance, data[w], data[w+1], data[w+2], data[w+3], w, i, j);
            }
        }
    },

    render: function(opt_selector) {
        var instance = this,
            canvasNode = instance.get('canvasNode');

        tracking.one(opt_selector || document.body).appendChild(canvasNode);

        return instance;
    },

    toDataURL: function(opt_format) {
        var instance = this,
            canvasNode = instance.get('canvasNode');

        return canvasNode.toDataURL(opt_format || 'image/png');
    },

    transform: function(fn) {
        var instance = this,
            imageData = instance.getImageData(),
            newImageData = instance.context.createImageData(imageData),
            newData = newImageData.data;

        instance.forEach(imageData, function(r, g, b, a, w, i, j) {
            var value = (r + g + b)/3;

            newData[w] = value;
            newData[w+1] = value;
            newData[w+2] = value;
            newData[w+3] = 255;
        });

        instance.setImageData(newImageData);

        return instance;
    }
};

tracking.Canvas = tracking.augment(Canvas, tracking.Attribute);

// tracking.Video

var Video = function(opt_config) {
    var instance = this;

    instance.setAttrs(tracking.merge({
        autoplay: true,
        canvas: null,
        height: 240,
        controls: true,
        width: 320,
        videoNode: null
    }, opt_config), true);

    instance.trackers_ = [];

    instance.createVideo_();
    instance.createCanvas_();
};

Video.prototype = {
    trackers_: null,

    createCanvas_: function() {
        var instance = this,
            canvas = instance.set('canvas', new tracking.Canvas());

        instance.linkAttr('height', canvas, true);
        instance.linkAttr('width', canvas, true);

        return canvas;
    },

    createVideo_: function() {
        var instance = this,
            videoNode = document.createElement('video');

        videoNode.autoplay = instance.get('autoplay');
        videoNode.controls = instance.get('controls');
        videoNode.height = instance.get('height');
        videoNode.width = instance.get('width');

        instance.set('videoNode', videoNode);

        return videoNode;
    },

    getVideoCanvasImageData: function() {
        var instance = this,
            canvas = instance.get('canvas');

        instance.syncVideoCanvas();

        return canvas.getImageData();
    },

    heightChange_: function(val) {
        var instance = this,
            videoNode = instance.get('videoNode'),
            canvas = instance.get('canvas'),
            canvasNode = canvas.get('canvasNode');

        canvasNode.height = val;
        videoNode.height = val;
    },

    load: function() {
        var instance = this,
            videoNode = instance.get('videoNode');

        videoNode.load.apply(videoNode, arguments);

        return instance;
    },

    loop_: function() {
        var instance = this,
            i = 0,
            tracker,
            trackers = instance.trackers_;

        for (; (tracker = trackers[i++]); ) {
            tracker.type.call(instance, tracker, instance);
        }

        if (trackers.length) {
            requestAnimationFrame(function loop() {
                instance.loop_();
            });
        }
    },

    pause: function() {
        var instance = this,
            videoNode = instance.get('videoNode');

        videoNode.pause.apply(videoNode, arguments);

        return instance;
    },

    play: function() {
        var instance = this,
            videoNode = instance.get('videoNode');

        videoNode.play.apply(videoNode, arguments);

        return instance;
    },

    render: function(opt_selector) {
        var instance = this,
            videoNode = instance.get('videoNode');

        tracking.one(opt_selector || document.body).appendChild(videoNode);

        return instance;
    },

    renderVideoCanvas: function(opt_selector) {
        var instance = this,
            canvas = instance.get('canvas').get('canvasNode');

        instance.syncVideoCanvas();

        tracking.one(opt_selector || document.body).appendChild(canvas);

        return instance;
    },

    srcChange_: function(stream) {
        var instance = this,
            videoNode = instance.get('videoNode');

        videoNode.src = stream;
    },

    stopTracking: function() {
        var instance = this;

        instance.trackers_ = [];
    },

    syncVideoCanvas: function() {
        var instance = this,
            canvas = instance.get('canvas'),
            width = instance.get('width'),
            height = instance.get('height'),
            videoNode = instance.get('videoNode');

        canvas.context.drawImage(videoNode, 0, 0, width, height);

        return instance;
    },

    toDataURL: function(opt_format) {
        var instance = this,
            canvas = instance.get('canvas');

        instance.syncVideoCanvas();

        return canvas.toDataURL(opt_format);
    },

    track: function(config) {
        var instance = this,
            trackers = instance.trackers_;

        if (!config.type) {
            throw Error('A tracker type should be specified.');
        }

        var trackerId = trackers.push(config) - 1;

        if (trackers.length === 1) {
            instance.loop_();
        }

        return {
            id: trackerId,
            cancel: function() {
                trackers.splice(trackerId, 1);
            }
        };
    },

    widthChange_: function(val) {
        var instance = this,
            videoNode = instance.get('videoNode'),
            canvas = instance.get('canvas'),
            canvasNode = canvas.get('canvasNode');

        canvasNode.width = val;
        videoNode.width = val;
    }
};

tracking.Video = tracking.augment(Video, tracking.Attribute);

// tracking.VideoCamera

var VideoCamera = function(opt_config) {
    var instance = this;

    instance.setAttrs(tracking.merge({
        audio: true,
        height: 240,
        width: 320
    }, opt_config), true);

    instance.initUserMedia_();
};

VideoCamera.prototype = {
    initUserMedia_: function() {
        var instance = this;

        navigator.getUserMedia(
            { audio: instance.get('audio'), video: true },
            tracking.bind(instance.defSuccessHandler_, instance),
            tracking.bind(instance.defErrorHandler_, instance));
    },

    defSuccessHandler_: function(stream) {
        var instance = this;

        instance.set('src', URL.createObjectURL(stream));
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