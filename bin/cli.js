"use strict";

module.exports = require("yargs")
  .usage("Usage: ./tracking.js -f FILENAMES -c CLASSIFIERS [-d DIRECTORY]")
  .alias("h", "help")
  .option('c', {
    alias: "classifiers",
    array: true,
    demand: true,
    describe: "haarcascade classifier filename",
    type: "string"
  })
  .option('f', {
    alias: "filenames",
    array: true,
    describe: "one (or several) input filename(s)",
    type: "string"
  })
  .option('d', {
    alias: "directory",
    describe: "directory containing classifiers and images",
    type: "string"
  })
  .example("$ ./tracking.js -f myface.png -c faces.xml")
  .example("$ ./tracking.js -d photos/summer_photos/ -c smiles.xml faces.xml")
  .check(function (a) {
    if (!((a.f || a.d) && !(a.f && a.d)))
      throw new Error('Error:\n\tFilename or Directory must be set. Not both.');

    return true;
  })
  .argv;

