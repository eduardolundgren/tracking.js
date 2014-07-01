(function() {
  /**
   * FaceTracker utility.
   * @constructor
   * @extends {tracking.HAARTracker}
   */
  tracking.FaceTracker = function() {
    tracking.FaceTracker.base(this, 'constructor');

    this.setData(new Float64Array(tracking.HAARTracker.data.face));
  };

  tracking.inherits(tracking.FaceTracker, tracking.HAARTracker);
}());
