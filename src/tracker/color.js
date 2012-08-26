(function (window, undefined) {

    var defaults = {

            color: 'magenta'

        },

        colors = {

            blue: function(r, g, b) {
                var threshold = 50;

                if ((b - r) >= threshold && (b - g) >= threshold) {
                    return true;
                }
            },

            cyan: function(r, g, b) {
                var thresholdGreen = 30,
                    thresholdBlue = 30;

                if ((g - r) >= thresholdGreen && (b - r) >= thresholdBlue) {
                    return true;
                }
            },

            magenta: function(r, g, b) {
                var threshold = 50;

                if ((r - g) >= threshold && (b - g) >= threshold) {
                    return true;
                }
            }

        },

        isString = tracking.isString,

        distance = tracking.math.distance;

    tracking.type.COLOR = function(config, video) {

        var cpx, cpy, cpz,

            dist,

            dx = 0, dy = 0,

            m1 = 0, m2 = 0, n,

            minx = Infinity, maxx = -1,

            miny = Infinity, maxy = -1,

            pixels = [],

            total = 0, totalInliers = 0,

            x, y,

            imageData = video.getVideoCanvasImageData(),

            colorThreshold = config.color || defaults.color;

        if (isString(colorThreshold) && colors.hasOwnProperty(colorThreshold)) {
            colorThreshold = colors[colorThreshold];
        }

        video.canvas.forEach(
            imageData,
            function pixelMatrixLoop(r, g, b, a, w, i, j) {
                if (colorThreshold(r, g, b, a, w, i, j)) {
                    total += 2;
                    pixels.push(j, i);
                }
            }
        );

        if (total < 30) {
            return;
        }

        // Flag outliers
        for (; m1 < total; m1+=2) {
            dist = 0;

            for (n = 2; n < total; n+=2) {
                dist += distance(
                    pixels[m1], pixels[m1+1], pixels[n], pixels[n+1]);
            }

            if (dist/total > 20) {
                pixels[m1] = -1;
                pixels[m1+1] = -1;
            }
        }

        for (; m2 < total; m2+=2) {
            x = pixels[m2];
            y = pixels[m2+1];

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

        cpx = dx/totalInliers;
        cpy = dy/totalInliers;
        cpz = 60 - ((maxx - minx) + (maxy - miny))/2;

        if (config.callback) {
            config.callback.call(video, {
                x: cpx,
                y: cpy,
                z: cpz,
                pixels: pixels
            });
        }
    };

    tracking.type.COLOR.colors = colors;

    tracking.type.COLOR.defaults = defaults;

}( window ));