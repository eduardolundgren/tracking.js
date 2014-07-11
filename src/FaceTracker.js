(function() {
  /**
   * FaceTracker utility.
   * @constructor
   * @extends {tracking.HAARTracker}
   */
  tracking.FaceTracker = function() {
    tracking.FaceTracker.base(this, 'constructor');

    var data = tracking.HAARTracker.data.face;
    if (data) {
      this.setData(new Float64Array(data));
    }
  };

  tracking.inherits(tracking.FaceTracker, tracking.HAARTracker);
}());
