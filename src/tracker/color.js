(function (window, undefined) {

    var isString = tracking.isString,

        distance = tracking.math.distance;

    tracking.type.COLOR = {
        NAME: 'COLOR',

        defaults: {

            color: 'magenta',

            minFoundPixels: 30

        },

        blue: function(r, g, b) {
            var threshold = 50;

            if ((b - r) >= threshold && (b - g) >= threshold) {
                return true;
            }
        },

        cyan: function(r, g, b) {
            var thresholdGreen = 60,
                thresholdBlue = 60;

            if ((g - r) >= thresholdGreen && (b - r) >= thresholdBlue) {
                return true;
            }
        },

        magenta: function(r, g, b) {
            var threshold = 50;

            if ((r - g) >= threshold && (b - g) >= threshold) {
                return true;
            }
        },

        findCoordinates_: function(pixels, total) {
            var instance = this,
                dx = 0,
                dy = 0,
                totalInliers = 0,
                minx = Infinity,
                miny = Infinity,
                maxx = -1,
                maxy = -1,
                x,
                y,
                c;

            for (c = 0; c < total; c+=2) {
                x = pixels[c];
                y = pixels[c+1];

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

            return {
                x: dx/totalInliers,
                y: dy/totalInliers,
                z: 60 - ((maxx - minx) + (maxy - miny))/2
            };
        },

        flagOutliers_: function(pixels, total) {
            var instance = this,
                dist,
                m,
                n;

            for (m = 0; m < total; m+=2) {
                dist = 0;

                for (n = 2; n < total; n+=2) {
                    dist += distance(
                        pixels[m], pixels[m+1], pixels[n], pixels[n+1]);
                }

                if (dist/total > 20) {
                    pixels[m] = -1;
                    pixels[m+1] = -1;
                }
            }
        },

        track: function(trackerGroup, video) {
            var instance = this,
                defaults = instance.defaults,
                config,
                c,
                total = [],
                pixels = [],
                payload,
                colorThreshold;

            video.canvas.forEach(
                video.getVideoCanvasImageData(),
                function pixelMatrixLoop(r, g, b, a, w, i, j) {

                    for (c = -1; (config = trackerGroup[++c]); ) {
                        if (!pixels[c]) {
                            total[c] = 0;
                            pixels[c] = [];
                        }

                        colorThreshold = config.color || defaults.color;

                        if (isString(colorThreshold) && instance.hasOwnProperty(colorThreshold)) {
                            colorThreshold = instance[colorThreshold];
                        }

                        if (colorThreshold(r, g, b, a, w, i, j)) {
                            total[c] += 2;
                            pixels[c].push(j, i);
                        }
                    }

                }
            );

            for (c = -1; (config = trackerGroup[++c]); ) {
                if (total[c] <= defaults.minFoundPixels) {
                    if (config.onNotFound) {
                        config.onNotFound.call(video, payload);
                    }

                    continue;
                }

                instance.flagOutliers_(pixels[c], total[c]);

                payload = instance.findCoordinates_(pixels[c], total[c]);

                payload.pixels = pixels[c];

                if (config.onFound) {
                    config.onFound.call(video, payload);
                }
            }
        }
    };

}( window ));