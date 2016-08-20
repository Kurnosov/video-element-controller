// ==UserScript==
// @name         video-element-controller
// @version      0.1
// @namespace    https://github.com/Kurnosov/video-element-controller
// @description  Adds useful keyboard shortcuts for HTML5 video.
// @homepageURL  https://github.com/Kurnosov/video-element-controller
// @updateURL    https://raw.github.com/Kurnosov/video-element-controller/master/video-element-controller.meta.js
// @downloadURL  https://raw.github.com/Kurnosov/video-element-controller/master/video-element-controller.user.js
// @require      https://raw.githubusercontent.com/madrobby/keymaster/master/keymaster.js
// @run-at       document-start
// @include      http*://*.youtube.com/*
// @include      http*://*.gfycat.com/*
// @include      http*://*.vimeo.com/*
// @include      https://www.facebook.com/video.php*
// @include      https://www.facebook.com/*/videos/*
// @include      https://www.kickstarter.com/*
// @include      http*://2ch.hk/*
// @include      http*://arhivach.org/*
// @include      *
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var currentPlaybackRate = 1.0; // x default playback rate.
    var playRateTuneStep = 0.5;
    var playRateFineTuneStep = 0.1;
    var rotateAngleStep = 90; // by degrees
    var scaleStep = 0.25;
    var seekStep = 10; // % use percentage
    var videoHotkeysScope = "videohotkeys";

    
    var k = key.noConflict();
    k.setScope(videoHotkeysScope);
    k("h, shift+h", videoHotkeysScope, function() { toggleVideoInfoOverlay(); return false; });
    k("space", videoHotkeysScope, function() { setPlayPause(); return false; });
    k("[", videoHotkeysScope, function() { setPlaybackRate(-playRateFineTuneStep); return false; });
    k("]", videoHotkeysScope, function() { setPlaybackRate(+playRateFineTuneStep); return false; });
    k("up", videoHotkeysScope, function() { setPlaybackRate(+playRateTuneStep); return false; });
    k("shift+down", videoHotkeysScope, function() { setPlaybackRate(-playRateTuneStep); return false; });
    k("down", videoHotkeysScope, function() { setPlaybackRate(1.0 - currentPlaybackRate); return false; });
    k("0,1,2,3,4,5,6,7,8,9", videoHotkeysScope, function(event) { setCurrentTime(event.keyCode - 48); return false; });
    k("shift+left", videoHotkeysScope, function() { seekByStep(-seekStep);return false; });
    k("shift+right", videoHotkeysScope, function() { seekByStep(+seekStep);return false; });
    k("z", videoHotkeysScope, function() { updateTransformProperty("scale", +scaleStep); return false; });
    k("shift+z", videoHotkeysScope, function() { updateTransformProperty("scale", -scaleStep); return false; });
    k("c, r", videoHotkeysScope, function() { updateTransformProperty('rotate', +rotateAngleStep); });
    k("shift+c, shift+r", videoHotkeysScope, function() { updateTransformProperty('rotate', -rotateAngleStep); return false; });

    k.filter = function(event) {
        if (document.getElementById(videoInfoOverlay.getAttribute("id"))) {
            var tagName = (event.target || event.srcElement).tagName;
            return true && !(tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA');
        }
        return false;
    };

    var videoInfoOverlay = document.createElement("h1");
    videoInfoOverlay.setAttribute("id", "video-info-overlay");
    videoInfoOverlay.style.position = "absolute";
    videoInfoOverlay.style.top = "1px";
    videoInfoOverlay.style.right = "0.5%";
    videoInfoOverlay.style.color = "rgba(255, 0, 0, 1)";
    videoInfoOverlay.style.zIndex = "99999"; // ensures that it shows above other elements.
    videoInfoOverlay.style.visibility = "visible";
    videoInfoOverlay.style.fontSize = "1em";

    function setPlaybackRate(rate) {
        if (rate && currentPlaybackRate + rate >= 0) {
            currentPlaybackRate += rate;
        } 

        // fix floating point errors like 1.1 + 0.1 = 1.2000000000000002.
        var step = currentPlaybackRate % playRateTuneStep === 0 ? playRateTuneStep : playRateFineTuneStep;
        currentPlaybackRate = Math.round(currentPlaybackRate * (1 / step)) / (1 / step);

        // grab the video elements and set their playback rate.
        var videoElement = document.getElementsByTagName("video")[0];
        if (videoElement) {
            videoElement.playbackRate = currentPlaybackRate;
            var elapsed = videoElement.duration - videoElement.currentTime;
            var min = Math.floor(elapsed / 60);
            var sec = Math.floor(elapsed - min * 60);
            videoInfoOverlay.innerHTML = (min > 0 ? min + "m" + sec : sec) + "s" + (currentPlaybackRate > 1 || currentPlaybackRate < 1 ? "<br />" + currentPlaybackRate + "x" : "");

            if (!document.getElementById(videoInfoOverlay.getAttribute("id"))) {

                videoElement.parentElement.appendChild(videoInfoOverlay);

                videoElement.addEventListener('timeupdate', function() {
                    var elapsed = this.duration - this.currentTime;
                    var min = Math.floor(elapsed / 60);
                    var sec = Math.floor(elapsed - min * 60);
                    videoInfoOverlay.innerHTML = (min > 0 ? min + "m" + sec : sec) + "s" + (currentPlaybackRate > 1 || currentPlaybackRate < 1 ? "<br/>" + currentPlaybackRate + "x" : "");
                }, false);

                // var observer = new MutationObserver(function(mutations) {
                //     mutations.forEach(function(mutation) {
                //         var name = mutation.attributeName,
                //         newValue = mutation.target.getAttribute(name),
                //         oldValue = mutation.oldValue;
                //         if (name == 'src') {
                //             if (!newValue) {
                //             } else {
                //             }
                //         }
                //             // observer.disconnect();
                //     });
                // });

                // observer.observe(videoElement, {
                //     attributes: true,
                // });
            }
        }
    }

    function toggleVideoInfoOverlay() {
        videoInfoOverlay.style.visibility = videoInfoOverlay.style.visibility === "visible" ? "hidden" : "visible";
    }

    function setCurrentTime(seek) {
        var videoElement = document.getElementsByTagName("video")[0];
        videoElement.currentTime = videoElement.duration * (seek * 0.1);
    }

    function seekByStep(seek) {
        var videoElement = document.getElementsByTagName("video")[0];
        if (videoElement) {
            videoElement.currentTime += videoElement.duration / seek;
        }
    }

    function setPlayPause() {
        var videoElement = document.getElementsByTagName("video")[0];
        if (videoElement.paused) {
            videoElement.play();
        } else {
            videoElement.pause();
        }
    }

    function updateTransformProperty(propertyName, newValue) {
        var videoElement = document.getElementsByTagName("video")[0];
        var tr = (videoElement.style.transform.match(/([\w]+)\(([^\)]+)\)/g) || [])
            .map(function(it) {
                return it.replace(/\)$/, '').split(/\(/);
            })
            .reduce(function(m, it) {
                return m[it[0]] = it[1], m;
            }, {});
        var pm = tr[propertyName];
        var newTrans = "";
        if (pm) {
            var oldValue = parseFloat(pm.match(/[+-]?\d+(\.\d+)?/g)[0], 10);
            pm = pm.replace(/[+-]?\d+(\.\d+)?/g, oldValue + newValue);
        } else {
            switch (propertyName) {
                case "rotate":
                    pm = newValue + "deg";
                    break;
                case "scale":
                    pm = (1 + newValue) + "," + (1 + newValue);
                    break;
            }
        }

        tr[propertyName] = pm;

        for (var idx in tr) {
            newTrans += idx + "(" + tr[idx] + ") ";
        }

        if (newTrans.length > 0) {
            videoElement.style.transform = newTrans;
        }
    }

    window.addEventListener('loadedmetadata', function() {
        setPlaybackRate(null);
    }, true);
    // window.addEventListener('beforeunload', function() {

    // }, true);
}());