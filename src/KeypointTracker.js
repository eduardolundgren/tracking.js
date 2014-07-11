(function() {

  tracking.KeypointTracker = function () {
    this.setType('keypoint');
  };

  tracking.inherits(tracking.KeypointTracker, tracking.Tracker);

  tracking.KeypointTracker.prototype.getCameraIntrisicParameters = function () {
    var instance = this;

    if (!instance._cameraIntrisicParameters) {
      instance._cameraIntrisicParameters = new tracking.Matrix({matrix: [[2868.4, 0, 1219.5],[0, 2872.1, 1591.7],[0, 0, 1]]});
    }

    return instance._cameraIntrisicParameters;
  };

  tracking.KeypointTracker.prototype.setCameraIntrisicParameters = function (matrix) {
    if (Array.isArray(matrix)) {
      this._cameraIntrisicParameters = new tracking.Matrix(matrix);
    }
    else {
      this._cameraIntrisicParameters = matrix;
    }
  };

  tracking.KeypointTracker.prototype._extractKeypoints = function () {
      
  };

  tracking.KeypointTracker.prototype._matchKeypoints = function () {
      
  };

  tracking.KeypointTracker.prototype._estimatePose = function () {
      
  };

  tracking.KeypointTracker.prototype.track = function(pixels, width, height) {
    
  };

}());