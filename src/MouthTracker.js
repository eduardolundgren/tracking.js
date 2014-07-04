(function() {
  /**
   * MouthTracker utility.
   * @constructor
   * @extends {tracking.HAARTracker}
   */
  tracking.MouthTracker = function() {
    tracking.MouthTracker.base(this, 'constructor');

    var data = tracking.HAARTracker.data.mouth;
    if (data) {
      this.setData(new Float64Array(data));
    }
  };

  tracking.inherits(tracking.MouthTracker, tracking.HAARTracker);
}());
