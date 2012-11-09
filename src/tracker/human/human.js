(function (window, undefined) {

    tracking.type.HUMAN = {

        NAME: 'HUMAN',

        data: {},

        defaults: {
            blockSize: 20,

            blockJump: 5,

            blockScale: 1.25,

            data: 'frontal_face'
        },

        evalStage_: function(stage, integralImage, integralImageSquare, i, j, width, height, blockSize) {
            var instance = this,
                defaults = instance.defaults,
                stageIndex = stage[0],
                stageThreshold = stage[1],
                tree = stage[2],
                treeLen = tree.length,
                t,

                inverseArea = 1.0/(blockSize*blockSize),
                scale = blockSize/defaults.blockSize,

                stageSum = 0;

            for (t = 0; t < treeLen; t++) {
                var node = tree[t],
                    nodeLen = node.length,

                    nodeThreshold = node[nodeLen-3],
                    left = node[nodeLen-2],
                    right = node[nodeLen-1],

                    total,
                    totalSquare,
                    mean,
                    variance,

                    wb1 = i*width + j,
                    wb2 = i*width + (j + blockSize),
                    wb3 = (i + blockSize)*width + j,
                    wb4 = (i + blockSize)*width + (j + blockSize),

                    rectsSum = 0,
                    rectsLen = (nodeLen - 3)/5,
                    r,
                    x1, y1, x2, y2, rectWidth, rectHeight, rectWeight, w1, w2, w3, w4;

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
                     x1 = j + ~~(node[r*5]*scale);
                     y1 = i + ~~(node[r*5 + 1]*scale);
                     rectWidth = ~~(node[r*5 + 2]*scale);
                     rectHeight = ~~(node[r*5 + 3]*scale);
                     rectWeight = node[r*5 + 4];

                     x2 = x1 + rectWidth;
                     y2 = y1 + rectHeight;

                     w1 = y1*width + x1;
                     w2 = y1*width + x2;
                     w3 = y2*width + x1;
                     w4 = y2*width + x2;

                     rectsSum += (integralImage[w1] - integralImage[w2] - integralImage[w3] + integralImage[w4])*rectWeight;
                }

                if (rectsSum*inverseArea < nodeThreshold*variance) {
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
                integralImage = new Uint32Array(width*height),
                integralImageSquare = new Uint32Array(width*height),

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

                if (i === 0 & j === 0) {
                    pixelSum = pixel;
                    pixelSumSquare = pixel*pixel;
                }
                else if (i === 0) {
                    pixelSum = pixel + integralImage[i*width + (j - 1)];
                    pixelSumSquare = pixel*pixel + integralImageSquare[i*width + (j - 1)];
                }
                else if (j === 0) {
                    pixelSum = pixel + integralImage[(i - 1)*width + j];
                    pixelSumSquare = pixel*pixel + integralImageSquare[(i - 1)*width + j];
                }
                else {
                    pixelSum = pixel + integralImage[i*width + (j - 1)] + integralImage[(i - 1)*width + j] - integralImage[(i - 1)*width + (j - 1)];
                    pixelSumSquare = pixel*pixel + integralImageSquare[i*width + (j - 1)] + integralImageSquare[(i - 1)*width + j] - integralImageSquare[(i - 1)*width + (j - 1)];
                }

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

            for (; blockSize <= maxBlockSize; blockSize = ~~(blockSize*blockScale)) {
                for (i = 0; i < (height - blockSize); i+=blockJump) {
                    for (j = 0; j < (width - blockSize); j+=blockJump) {
                        var pass = true;

                        for (s = 0; s < stagesLen; s++) {
                            var stage = stages[s];

                            pass = instance.evalStage_(stage, integralImage, integralImageSquare, i, j, width, height, blockSize);

                            if (!pass) {
                                break;
                            }
                        }

                        if (pass) {
                            console.log('ROSTO');
                            // canvas.setImageData(imageData);
                            canvas.context.strokeStyle = "rgb(255,0,0)";
                            canvas.context.strokeRect(j, i, blockSize, blockSize);
                        }
                    }
                }
            }
        }

    };

}( window ));