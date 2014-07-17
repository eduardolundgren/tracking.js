(function() {
  /**
   * TrackerTask utility.
   * @constructor
   * @extends {tracking.EventEmitter}
   */
  tracking.TrackerTask = function(tracker) {
    tracking.TrackerTask.base(this, 'constructor');

    if (!tracker) {
      throw new Error('Tracker instance not specified.');
    }

    this.setTracker(tracker);

    this.reemitTrackEvent_ = function(event) {
      this.emit('track', event);
    }.bind(this);
    tracker.on('track', this.reemitTrackEvent_);
  };

  tracking.inherits(tracking.TrackerTask, tracking.EventEmitter);

  /**
   * Holds the tracker instance managed by this task.
   * @type {tracking.Tracker}
   * @private
   */
  tracking.TrackerTask.prototype.tracker_ = null;

  /**
   * Gets the tracker instance managed by this task.
   * @return {tracking.Tracker}
   */
  tracking.TrackerTask.prototype.getTracker = function() {
    return this.tracker_;
  };

  /**
   * Sets the tracker instance managed by this task.
   * @return {tracking.Tracker}
   */
  tracking.TrackerTask.prototype.setTracker = function(tracker) {
    this.tracker_ = tracker;
  };

  /**
   * Emits a `stop` event on the tracker task for the implementers to stop any
   * child action being done, such as `requestAnimationFrame`.
   */
  tracking.TrackerTask.prototype.stop = function() {
    this.emit('stop');
    this.tracker_.removeListener('track', this.reemitTrackEvent_);
  };
}());
