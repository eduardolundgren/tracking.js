(function (window, undefined) {

    tracking.type.HUMAN = {

        NAME: 'HUMAN',

        data: {},

        defaults: {
            blockSize: 20,

            blockJump: 50,

            blockScale: 1.25,

            data: 'frontal_face'
        },

        evalStage_: function(stage, integralImage, integralImageSquare, i, j, blockSize) {
            var instance = this,
                defaults = instance.defaults,
                stageIndex = stage[0],
                stageThreshold = stage[1],
                tree = stage[2],
                treeLen = tree.length,
                t,

                inverseArea = 1/(blockSize*blockSize),
                scale = blockSize/defaults.blockSize,

                stageSum = 0;

            for (t = 0; t < treeLen; t++) {
                var node = tree[t],

                    nodeThreshold = node[10],
                    left = node[11],
                    right = node[12],

                    total,
                    totalSquare,
                    mean,
                    variance,

                    wb1 = i*blockSize + j,
                    wb2 = i*blockSize + (j + blockSize),
                    wb3 = (i + blockSize)*blockSize + j,
                    wb4 = (i + blockSize)*blockSize + (j + blockSize),

                    rectsSum = 0,
                    rectsLen = (node.length - 3)/5,
                    r,
                    x, y, width, height, weight, w1, w2, w3, w4;

                total = integralImage[wb1] - integralImage[wb2] - integralImage[wb3] + integralImage[wb4];
                totalSquare = integralImageSquare[wb1] - integralImageSquare[wb2] - integralImageSquare[wb3] + integralImageSquare[wb4];
                mean = total*inverseArea;
                variance = totalSquare*inverseArea - mean*mean;

                if (variance > 1) {
                    variance = Math.sqrt(variance);
                }
                else {
                    variance = 1;
                }

                for (r = 0; r < rectsLen; r++) {
                     x = j + node[r*5];
                     y = i + node[r*5 + 1];
                     width = ~~(node[r*5 + 2]*scale);
                     height = ~~(node[r*5 + 3]*scale);
                     weight = node[r*5 + 4];

                     w1 = y*width + x;
                     w2 = y*width + (x + width);
                     w3 = (y + height)*width + x;
                     w4 = (y + height)*width + (x + width);

                     rectsSum = (integralImage[w1] - integralImage[w2] - integralImage[w3] + integralImage[w4])*weight*inverseArea;
                }

                if (rectsSum < nodeThreshold*variance) {
                    stageSum += left;
                }
                else {
                    stageSum += right;
                }
            }

            return (stageSum > stageThreshold);
        },

        track: function(trackerGroup, video) {
            var instance = this,
                config = trackerGroup[0],
                defaults = instance.defaults,
                imageData = video.getVideoCanvasImageData(),
                canvas = video.canvas,
                height = canvas.get('height'),
                width = canvas.get('width'),
                integralImage = new Int32Array(width*height),
                integralImageSquare = new Int32Array(width*height),

                imageLen = 0,
                g,

                stages = instance.data[config.data || defaults.data],
                stagesLen = stages.length,
                s,
                pixel,
                pixelSum = 0,
                pixelSumSquare = 0;

            canvas.forEach(imageData, function(r, g, b, a, w, i, j) {
                pixel = ~~(r*0.299 + b*0.587 + g*0.114);

                pixelSum += pixel;
                pixelSumSquare += pixel*pixel;

                integralImage[imageLen] = pixelSum;
                integralImageSquare[imageLen] = pixelSumSquare;
                imageLen++;
            });

            var i,
                j,
                blockJump = defaults.blockJump,
                blockScale = defaults.blockScale,
                blockSize = defaults.blockSize,
                maxBlockSize = Math.min(width, height);

            for (; blockSize <= maxBlockSize; blockSize = ~~(blockScale*blockSize)) {
                for (i = 0; i < (height - blockSize); i+=blockJump) {
                    for (j = 0; j < (width - blockSize); j+=blockJump) {
                        for (s = 0; s < stagesLen; s++) {
                            var stage = stages[s];

                            if (!instance.evalStage_(stage, integralImage, integralImageSquare, i, j, blockSize)) {
                                // if (stage[0] > 10) {
                                //     debugger;
                                // }
                                break;
                            }

                            console.log('ROSTO');
                        }
                    }
                }
            }
        }

    };

    // canvas.setImageData(imageData);
    // canvas.context.strokeStyle = "rgb(255,0,0)";
    // canvas.context.strokeRect(j, i, blockSize, blockSize);

}( window ));