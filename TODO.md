### Face tracking
- DONE display line with the face
- impressive speed and accuracy from @clmtrackr - https://github.com/auduno/clmtrackr
- http://blog.dlib.net/2014/08/real-time-face-pose-estimation.html
  - dlib implementation
- PerspectiveCamera.setViewOffset - todo the https://www.youtube.com/watch?v=LEPvUfC7wh8
- support for webworker ?
  - it consume a lot of cpu
- try blur in source image
- get a video on the internet to use as example
- DONE do lerp on output 

---

### Misc
- fix image source
- handle a proper versioning
  - master is last stable
  - stable is tagged in github repo
  - dev is 'next-stable'

- Tracking.Image without destination buffer - force reallocation
  - allow to provide destination, if not present, 
- three.js is r67 in the examples - current three.js is r86
  - TODO port on current three.js
- some examples are not running well - list which one
  - webcam one ?
- some examples are unclear - no instructions 
  - provide info in color tracking on how to run it
  - TODO list which one
- add more interactive examples - stuff i can try with a webcam
- merge lots of good PR
  - https://github.com/eduardolundgren/tracking.js/pull/229 - Add support for Safari 11
  - https://github.com/eduardolundgren/tracking.js/pull/144 Regressing Local Binary Features more details on face detection
  - https://github.com/eduardolundgren/tracking.js/pull/164 - Creating conversor from haarcascade to tracking.js array
  - https://github.com/eduardolundgren/tracking.js/pull/131 <- merge or close
- ```gulp test``` fails in the benchmarks
