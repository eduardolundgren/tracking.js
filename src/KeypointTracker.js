(function() {

  /**
   * KeypointTracker utility.
   * @constructor
   * @extends {tracking.Tracker}
   */
  tracking.KeypointTracker = function() {
    tracking.Tracker.base(this, 'constructor');
  };

  tracking.inherits(tracking.KeypointTracker, tracking.Tracker);

  tracking.KeypointTracker.prototype.cameraMatrix = null;

  tracking.KeypointTracker.prototype.estimatePose = function() {};

  tracking.KeypointTracker.prototype.extractKeypoints = function() {};

  tracking.KeypointTracker.prototype.getCameraMatrix = function() {
    var instance = this;

    if (!instance.cameraMatrix) {
      instance.cameraMatrix = new tracking.Matrix({
        matrix: [[2868.4, 0, 1219.5], [0, 2872.1, 1591.7], [0, 0, 1]]
      });
    }

    return instance.cameraMatrix;
  };


  tracking.KeypointTracker.prototype.matchKeypoints = function() {};

  tracking.KeypointTracker.prototype.setCameraMatrix = function(cameraMatrix) {
    this.cameraMatrix = cameraMatrix;
  };

  tracking.KeypointTracker.prototype.track = function(pixels, width, height) {};

}());
