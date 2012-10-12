(function (window, undefined) {

    tracking.type.HUMAN = {

        NAME: 'HUMAN',

        data: {},

        defaults: {
            data: 'frontal_face'
        },

        analisa_: function(stage, gray, i, j, w, h) {
            var instance = this,
                stageIndex = stage[0],
                stageThreshold = stage[1],
                tree = stage[2],
                treeLen = tree.length,
                t;

            for (t = 0; t < treeLen; t++) {
                var node = tree[t],
                    x1 = node[0],
                    y1 = node[1],
                    w1 = node[2],
                    h1 = node[3],
                    p1 = node[4],

                    x2 = node[5],
                    y2 = node[6],
                    w2 = node[7],
                    h2 = node[8],
                    p2 = node[9],

                    nodeThreshold = node[10],
                    left = node[11],
                    right = node[12];

                var a = [];
            }
        },

        track: function(trackerGroup, video) {
            var instance = this,
                defaults = instance.defaults,
                config = trackerGroup[0],
                height = video.canvas.get('height'),
                width = video.canvas.get('width'),
                gray = new Uint8ClampedArray(width*height),
                p,

                g,
                grayLen = 0,

                stages = instance.data[config.data || defaults.data],
                stagesLen = stages.length,
                s;

            video.canvas.forEach(video.getVideoCanvasImageData(), function(r, g, b, a, w, i, j) {
                p = r*0.299 + b*0.587 + g*0.114;
                gray[grayLen++] = p;
            });

            // ...

            for (g = 0; g < grayLen; g++) {
                var i, j, w, h;
            }

            for (s = 0; s < stagesLen; s++) {
                var stage = stages[s];

                instance.analisa_(stage, gray, i, j, w, h);
            }
        }

    };

}( window ));