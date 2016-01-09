"use strict";

(function() {
  var root = this;
  var someOtherTracking = root.tracking;
  var tracking = {};

  tracking.noConflict = function() {
    root.tracking = someOtherTracking
    return tracking
  };

  'begin_injection';
  'end_injection';


  if( typeof exports !== 'undefined' ) {
    if( typeof module !== 'undefined' && module.exports ) {
      exports = module.exports = tracking;
    }
    exports = tracking;
  }
  else {
    root.tracking = tracking;
  }


}).call(this);
