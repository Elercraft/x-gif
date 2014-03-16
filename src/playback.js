"use strict";

var Exploder = require('./exploder.js');

var Playback = function (element, file, opts) {
  this.element = element;
  this.onReady = opts.onReady;
  this.pingPong = opts.pingPong;

  new Exploder(file, this.afterExploded.bind(this));
};

// Once we have the GIF data, add things to the DOM
Playback.prototype.afterExploded = function (gif) {
  console.warn("Callbacks will hurt you. I promise.")
  this.gif = gif;

  this.element.innerHTML = "";
  gif.frames.forEach(function (frame) {
    var image = new Image();
    image.src = frame.url;
    if (frame.disposal == 2) image.className = 'disposal-restore';
    this.element.appendChild(image);
  }, this)

  this.onReady();
}

Playback.prototype.setFrame = function (fraction, repeatCount) {
  var frameNr = (this.pingPong && repeatCount % 2 >= 1) ? this.gif.frameAt(1 - fraction) : this.gif.frameAt(fraction);
  this.element.dataset['frame'] = frameNr;
}

Playback.prototype.stop = function () {
  this.playing = false;
}

Playback.prototype.startSpeed = function (speed, nTimes, endCb) {
  var gifLength = 10 * this.gif.length / speed,
    startTime = performance.now(),
    animationLoop = (function () {
      var duration = performance.now() - startTime,
        repeatCount = duration / gifLength,
        fraction = repeatCount % 1;
      if (!nTimes || repeatCount < nTimes) {
        this.setFrame(fraction, repeatCount);

        requestAnimationFrame(animationLoop);
      } else {
        this.setFrame(1.0, repeatCount);
        if (endCb) endCb();
      }
    }).bind(this);

  animationLoop();
}

Playback.prototype.fromClock = function (beatNr, beatDuration, beatFraction) {
  var speedup = 2,
    lengthInBeats = Math.max(1, Math.round((1 / speedup) * 10 * this.gif.length / beatDuration)),
    subBeat = beatNr % lengthInBeats,
    repeatCount = beatNr / lengthInBeats,
    subFraction = (beatFraction / lengthInBeats) + subBeat / lengthInBeats;
  this.setFrame(subFraction, repeatCount);
}

Playback.prototype.startHardBpm = function (bpm) {
  var beatLength = 60 * 1000 / bpm,
    startTime = performance.now(),
    animationLoop = (function () {
      var duration = performance.now() - startTime,
        repeatCount = duration / beatLength,
        fraction = repeatCount % 1;
      this.setFrame(fraction, repeatCount);

      if (this.playing) requestAnimationFrame(animationLoop);
    }).bind(this);

  this.playing = true;
  animationLoop();
}

Playback.prototype.startBpm = function (bpm) {
  var beatLength = 60 * 1000 / bpm,
    startTime = performance.now(),
    animationLoop = (function () {
      var duration = performance.now() - startTime,
        beatNr = Math.floor(duration / beatLength),
        beatFraction = (duration % beatLength) / beatLength;

      this.fromClock(beatNr, beatLength, beatFraction);

      if (this.playing) requestAnimationFrame(animationLoop);
    }).bind(this);

  this.playing = true;
  animationLoop();
}

module.exports = Playback;
