(function() {
  /**
   * EyeTracker utility.
   * @constructor
   * @extends {tracking.HAARTracker}
   */
  tracking.EyeTracker = function() {
    tracking.EyeTracker.base(this, 'constructor');

    this.setData(new Float64Array(tracking.HAARTracker.data.eye));
  };

  tracking.inherits(tracking.EyeTracker, tracking.HAARTracker);
}());
