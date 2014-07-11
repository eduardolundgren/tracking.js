(function() {
  /**
   * EyeTracker utility.
   * @constructor
   * @extends {tracking.HAARTracker}
   */
  tracking.EyeTracker = function() {
    tracking.EyeTracker.base(this, 'constructor');

    var data = tracking.HAARTracker.data.eye;
    if (data) {
      this.setData(new Float64Array(data));
    }
  };

  tracking.inherits(tracking.EyeTracker, tracking.HAARTracker);
}());
