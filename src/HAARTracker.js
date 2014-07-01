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
   * Gets the tracker HAAR data.
   * @return {string}
   */
  tracking.Tracker.prototype.getData = function() {
    return this.data;
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
    var payload = tracking.ViolaJones.detect(pixels, width, height, data);
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

}());
