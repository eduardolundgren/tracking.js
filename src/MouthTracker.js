(function() {
  /**
   * MouthTracker utility.
   * @constructor
   * @extends {tracking.HAARTracker}
   */
  tracking.MouthTracker = function() {
    tracking.MouthTracker.base(this, 'constructor');

    this.setData(new Float64Array(tracking.HAARTracker.data.mouth));
  };

  tracking.inherits(tracking.MouthTracker, tracking.HAARTracker);
}());
