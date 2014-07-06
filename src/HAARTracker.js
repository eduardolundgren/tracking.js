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
  tracking.Tracker.prototype.data = null;

  /**
   * Specifies the initial scale to start the feature block scaling.
   * @default 1.0
   * @type {number}
   */
  tracking.Tracker.prototype.initialScale = 1.0;

  /**
   * Specifies the scale factor to scale the feature block.
   * @default 1.25
   * @type {number}
   */
  tracking.Tracker.prototype.scaleFactor = 1.25;

  /**
   * Specifies the block step size.
   * @default 1.5
   * @type {number}
   */
  tracking.Tracker.prototype.stepSize = 1.5;

  /**
   * Gets the tracker HAAR data.
   * @return {string}
   */
  tracking.Tracker.prototype.getData = function() {
    return this.data;
  };

  /**
   * Gets the initial scale to start the feature block scaling.
   * @return {number}
   */
  tracking.Tracker.prototype.getInitialScale = function() {
    return this.initialScale;
  };

  /**
   * Gets the scale factor to scale the feature block.
   * @return {number}
   */
  tracking.Tracker.prototype.getScaleFactor = function() {
    return this.scaleFactor;
  };

  /**
   * Gets the block step size.
   * @return {number}
   */
  tracking.Tracker.prototype.getStepSize = function() {
    return this.stepSize;
  };

  /**
   * Tracks the `Video` frames. This method is called for each video frame in
   * order to decide whether `onFound` or `onNotFound` callback will be fired.
   * @param {Uint8ClampedArray} pixels The pixels data to track.
   * @param {number} width The pixels canvas width.
   * @param {number} height The pixels canvas height.
   */
  tracking.HAARTracker.prototype.track = function(pixels, width, height) {
    var data = this.getData();
    if (!data) {
      throw new Error('HAAR cascade data not set.');
    }
    var payload = tracking.ViolaJones.detect(pixels, width, height, this.getInitialScale(), this.getScaleFactor(), this.getStepSize(), data);
    if (payload.length) {
      if (this.onFound) {
        this.onFound.call(this, payload);
      }
    } else {
      if (this.onNotFound) {
        this.onNotFound.call(this, payload);
      }
    }
  };

  /**
   * Sets the tracker HAAR data.
   * @param {array} data
   */
  tracking.Tracker.prototype.setData = function(data) {
    this.data = data;
  };

  /**
   * Sets the initial scale to start the block scaling.
   * @param {number} initialScale
   */
  tracking.Tracker.prototype.setInitialScale = function(initialScale) {
    this.initialScale = initialScale;
  };

  /**
   * Sets the scale factor to scale the feature block.
   * @param {number} scaleFactor
   */
  tracking.Tracker.prototype.setScaleFactor = function(scaleFactor) {
    this.scaleFactor = scaleFactor;
  };

  /**
   * Sets the block step size.
   * @param {number} stepSize
   */
  tracking.Tracker.prototype.setStepSize = function(stepSize) {
    this.stepSize = stepSize;
  };

}());
