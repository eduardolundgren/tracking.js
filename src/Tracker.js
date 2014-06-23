(function() {
  /**
   * Tracker utility.
   * @constructor
   */
  tracking.Tracker = function() {};

  /**
   * Specifies the tracker type.
   * @type {string}
   */
  tracking.Tracker.prototype.type = null;

  /**
   * Gets the tracker type.
   * @return {string}
   */
  tracking.Tracker.prototype.getType = function() {
    return this.type;
  };

  /**
   * Fires when the tracker founds a target into the video frame.
   * @param {Video} video The `Video` instance being tracked.
   * @param {object} payload The payload of the tracker, e.g. this can be an
   *     array of x, y coodinates of the target element, or an array of
   *     rectangles, specifically, any relevant information that worth exposing to
   * the implementer.
   */
  tracking.Tracker.prototype.onFound = function() {};

  /**
   * Fires when the tracker doesn't found a target into the video frame. Be
   * aware of how to use this method since for most of the processed frames
   * nothing is found, hence this can potentially be called much often than
   * you would expect.
   * @param {Video} video The `Video` instance being tracked.
   * @param {object} payload The payload of the tracker.
   */
  tracking.Tracker.prototype.onNotFound = function() {};

  /**
   * Sets the tracker type.
   * @param {string} type
   */
  tracking.Tracker.prototype.setType = function(type) {
    this.type = type;
  };

  /**
   * Tracks the pixels on the array. This method is called for each video
   * frame in order to decide whether `onFound` or `onNotFound` callback will
   * be fired.
   * @param {Uint8ClampedArray} pixels The pixels data to track.
   * @param {number} width The pixels canvas width.
   * @param {number} height The pixels canvas height.
   */
  tracking.Tracker.prototype.track = function() {};
}());
