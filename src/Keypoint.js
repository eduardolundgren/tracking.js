(function() {
  /**
   * Keypoint utility.
   * @static
   * @constructor
   */
  tracking.Keypoint = function (array) {
    var instance = this;

    instance.x = array[0];
    instance.y = array[1];
    instance.z = array[2];
  };

}());