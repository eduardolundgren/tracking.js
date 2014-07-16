(function() {
  /**
   * HAARTracker utility.
   * @constructor
   * @extends {tracking.Tracker}
   */
  tracking.HAARTracker = function() {
    tracking.HAARTracker.base(this, 'constructor');
  };

  tracking.inherits(tracking.HAARTracker, tracking.Tracker);

  /**
   * Holds the HAAR cascade data converted from OpenCV training.
   * @type {array}
   * @static
   */
  tracking.HAARTracker.data = {};

  /**
   * Specifies the tracker HAAR data for the instance.
   * @type {array}
   */
  tracking.HAARTracker.prototype.data = null;

  /**
   * Specifies the edges density of a block in order to decide whether to skip
   * it or not.
   * @default 0.2
   * @type {number}
   */
  tracking.HAARTracker.prototype.edgesDensity = 0.2;

  /**
   * Specifies the initial scale to start the feature block scaling.
   * @default 1.0
   * @type {number}
   */
  tracking.HAARTracker.prototype.initialScale = 1.0;

  /**
   * Specifies the scale factor to scale the feature block.
   * @default 1.25
   * @type {number}
   */
  tracking.HAARTracker.prototype.scaleFactor = 1.25;

  /**
   * Specifies the block step size.
   * @default 1.5
   * @type {number}
   */
  tracking.HAARTracker.prototype.stepSize = 1.5;

  /**
   * Gets the tracker HAAR data.
   * @return {string}
   */
  tracking.HAARTracker.prototype.getData = function() {
    return this.data;
  };

  /**
   * Gets the edges density value.
   * @return {number}
   */
  tracking.HAARTracker.prototype.getEdgesDensity = function() {
    return this.edgesDensity;
  };

  /**
   * Gets the initial scale to start the feature block scaling.
   * @return {number}
   */
  tracking.HAARTracker.prototype.getInitialScale = function() {
    return this.initialScale;
  };

  /**
   * Gets the scale factor to scale the feature block.
   * @return {number}
   */
  tracking.HAARTracker.prototype.getScaleFactor = function() {
    return this.scaleFactor;
  };

  /**
   * Gets the block step size.
   * @return {number}
   */
  tracking.HAARTracker.prototype.getStepSize = function() {
    return this.stepSize;
  };

  /**
   * Tracks the `Video` frames. This method is called for each video frame in
   * order to emit `track` event.
   * @param {Uint8ClampedArray} pixels The pixels data to track.
   * @param {number} width The pixels canvas width.
   * @param {number} height The pixels canvas height.
   */
  tracking.HAARTracker.prototype.track = function(pixels, width, height) {
    var data = this.getData();
    if (!data) {
      throw new Error('HAAR cascade data not set.');
    }
    var results = tracking.ViolaJones.detect(pixels, width, height, this.getInitialScale(), this.getScaleFactor(), this.getStepSize(), this.getEdgesDensity(), data);
    this.emit('track', {
      data: results
    });
  };

  /**
   * Sets the tracker HAAR data.
   * @param {array} data
   */
  tracking.HAARTracker.prototype.setData = function(data) {
    this.data = data;
  };

  /**
   * Sets the edges density.
   * @param {number} edgesDensity
   */
  tracking.HAARTracker.prototype.setEdgesDensity = function(edgesDensity) {
    this.edgesDensity = edgesDensity;
  };

  /**
   * Sets the initial scale to start the block scaling.
   * @param {number} initialScale
   */
  tracking.HAARTracker.prototype.setInitialScale = function(initialScale) {
    this.initialScale = initialScale;
  };

  /**
   * Sets the scale factor to scale the feature block.
   * @param {number} scaleFactor
   */
  tracking.HAARTracker.prototype.setScaleFactor = function(scaleFactor) {
    this.scaleFactor = scaleFactor;
  };

  /**
   * Sets the block step size.
   * @param {number} stepSize
   */
  tracking.HAARTracker.prototype.setStepSize = function(stepSize) {
    this.stepSize = stepSize;
  };

}());
