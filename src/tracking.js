;(function (window, undefined) {

var document = window.document,
    navigator = window.navigator,

    hasOwn_ = Object.prototype.hasOwnProperty,
    slice_ = Array.prototype.slice;

var tracking = {

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

    linkAttr: function(attrName, attrTarget) {
        var instance = this,
            changeFnName = attrName + 'Change_',
            changeFn = instance[changeFnName];

            instance[changeFnName] = function(val) {
                if (changeFn) {
                    changeFn.apply(this, arguments);
                }
                attrTarget.set(attrName, val);
            };
    }
};

tracking.Attribute = Attribute;

// tracking.Video

var Video = function(opt_config) {
    var instance = this;

    instance.setAttrs(tracking.merge({
        autoplay: true,
        canvasNode: null,
        height: 240,
        controls: true,
        width: 320,
        videoNode: null
    }, opt_config), true);

    instance.init_();
};

Video.prototype = {
    canvasContext: null,

    init_: function() {
        var instance = this;

        instance.createVideo_();
        instance.createCanvas_();
    },

    createCanvas_: function() {
        var instance = this,
            canvasNode = document.createElement('canvas');

        canvasNode.height = instance.get('height');
        canvasNode.width = instance.get('width');
        instance.canvasContext = canvasNode.getContext('2d');

        instance.set('canvasNode', canvasNode);

        return canvasNode;
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

    data: function() {
        var instance = this,
            width = instance.get('width'),
            height = instance.get('height');

        instance.syncData();

        return instance.canvasContext.getImageData(0, 0, width, height);
    },

    heightChange_: function(val) {
        var instance = this,
            canvasNode = instance.get('canvasNode'),
            videoNode = instance.get('videoNode');

        canvasNode.height = val;
        videoNode.height = val;
    },

    load: function() {
        var instance = this,
            videoNode = instance.get('videoNode');

        videoNode.load.apply(videoNode, arguments);

        return instance;
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

    srcChange_: function(stream) {
        var instance = this,
            videoNode = instance.get('videoNode');

        videoNode.src = stream;
    },

    syncData: function() {
        var instance = this,
            width = instance.get('width'),
            height = instance.get('height'),
            videoNode = instance.get('videoNode');

        instance.canvasContext.drawImage(videoNode, 0, 0, width, height);
    },

    toDataURL: function(opt_format) {
        var instance = this,
            canvasNode = instance.get('canvasNode');

        instance.syncData();

        return canvasNode.toDataURL(opt_format || 'image/png');
    },

    widthChange_: function(val) {
        var instance = this,
            canvasNode = instance.get('canvasNode'),
            videoNode = instance.get('videoNode');

        canvasNode.width = val;
        videoNode.width = val;
    }
};

tracking.Video = tracking.augment(Video, tracking.Attribute);

// tracking.Camera

var Camera = function(opt_config) {
    var instance = this;

    instance.setAttrs(tracking.merge({
        audio: true,
        height: 240,
        width: 320
    }, opt_config), true);

    instance.init_();
};

Camera.prototype = {
    init_: function() {
        var instance = this;

        var video = instance.initVideo_();

        navigator.getUserMedia(
            { audio: instance.get('audio'), video: true },
            tracking.bind(instance.defSuccessHandler_, instance),
            tracking.bind(instance.defErrorHandler_, instance));

        instance.linkAttr('width', video);
        instance.linkAttr('height', video);
    },

    initVideo_: function() {
        var instance = this;

        return instance.set('video', new tracking.Video({
            height: instance.get('height'),
            width: instance.get('width')
        }));
    },

    defSuccessHandler_: function(stream) {
        var instance = this,
            video = instance.get('video');

        video.set('src', URL.createObjectURL(stream));
    },

    defErrorHandler_: function(err) {
        throw Error(err);
    },

    render: function(opt_selector) {
        var instance = this,
            video = instance.get('video');

       video.render(opt_selector);

        return instance;
    }
};

tracking.Camera = tracking.augment(Camera, tracking.Attribute);

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
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] ||
            window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

window.tracking = tracking;

}( window ));