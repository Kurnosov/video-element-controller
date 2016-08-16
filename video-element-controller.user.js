// ==UserScript==
// @name         video-element-controller
// @version      0.1
// @namespace    hhttps://github.com/Kurnosov/video-element-controller
// @description  Adds useful keyboard shortcuts for HTML5 video.
// @homepageURL  https://github.com/Kurnosov/video-element-controller
// @updateURL    https://raw.github.com/Kurnosov/video-element-controller/master/video-element-controller.meta.js
// @downloadURL  https://raw.github.com/Kurnosov/video-element-controller/master/video-element-controller.user.js
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
// @grant        GM_log
// ==/UserScript==


(function() {
    'use strict';
    var currentPlaybackRate = 1.0; // default playback rate.
    var speedStep = 0.5;
    var tuneSpeedStep = 0.1;
    var rotateAngleStep = 90;
    var scaleStep = 0.25;

    if (typeof document.KeyEvent == "undefined") {
        var KeyEvent = {
            DOM_VK_SPACE: 32,
            DOM_VK_UP: 38,
            DOM_VK_DOWN: 40,
            DOM_VK_0: 48,
            DOM_VK_9: 57,
            DOM_VK_EQUALS: 61,
            DOM_VK_C: 67,
            DOM_VK_HYPHEN_MINUS: 173,
            DOM_VK_OPEN_BRACKET: 219,
            DOM_VK_CLOSE_BRACKET: 221
        };
    }

    var playbackRateInfo = document.createElement("h1");
    playbackRateInfo.setAttribute("id", "playbackrate-indicator");
    playbackRateInfo.style.position = "absolute";
    playbackRateInfo.style.top = "1px";
    playbackRateInfo.style.right = "0.5%";
    playbackRateInfo.style.color = "rgba(255, 0, 0, 1)";
    playbackRateInfo.style.zIndex = "99999"; // ensures that it shows above other elements.
    playbackRateInfo.style.visibility = "visible";
    playbackRateInfo.style.fontSize = "1em";

    function setPlaybackRate(rate) {
        // fix floating point errors like 1.1 + 0.1 = 1.2000000000000002.
        var step = rate % speedStep === 0 ? speedStep : tuneSpeedStep;
        rate = Math.round(rate * (1 / step)) / (1 / step);

        // grab the video elements and set their playback rate.
        var videoElement = document.getElementsByTagName("video")[0];
        if (videoElement) {
            videoElement.playbackRate = rate;
            var elapsed = videoElement.duration - videoElement.currentTime;
            var min = Math.floor(elapsed / 60);
            var sec = Math.floor(elapsed - min * 60);
            playbackRateInfo.innerHTML = (min > 0 ? min + "m" + sec : sec) + "s" + (rate > 1 || rate < 1 ? "<br/>" + rate + "x" : "");

            if (!document.getElementById("playbackrate-indicator")) {
                videoElement.parentElement.appendChild(playbackRateInfo);
            }
        }
    }

    function setCurrentTime(seek) {
        var videoElement = document.getElementsByTagName("video")[0];
        videoElement.currentTime = videoElement.duration * (seek * 0.1);
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

    document.addEventListener('DOMContentLoaded', function() {
        setPlaybackRate(currentPlaybackRate);
    });

    // youtube videos don't always load on the DOMContentLoaded event :-/
    // document.addEventListener('DOMNodeInserted', function() {
    //     setPlaybackRate(currentPlaybackRate);
    // });


    // mimic vlc keyboard shortcuts
    window.addEventListener('keydown', function(event) {
        if (document.getElementsByTagName("video")[0]) {
            var keycode = event.charCode || event.keyCode;
            var oldPlaybackRate = currentPlaybackRate;

            // decrease playback rate if '[' is pressed
            if (keycode === KeyEvent.DOM_VK_OPEN_BRACKET) {
                currentPlaybackRate -= tuneSpeedStep + 0.0;
            }

            // increase playback rate if ']' is pressed
            if (keycode === KeyEvent.DOM_VK_CLOSE_BRACKET) {
                currentPlaybackRate += tuneSpeedStep + 0.0;
            }

            if (keycode === KeyEvent.DOM_VK_DOWN) {
                if (event.shiftKey) {
                    currentPlaybackRate -= speedStep + 0.0;
                } else {
                    currentPlaybackRate = 1.0;
                }
            }

            if (keycode === KeyEvent.DOM_VK_UP) {
                currentPlaybackRate += speedStep + 0.0;
            }

            if (keycode >= KeyEvent.DOM_VK_0 && keycode <= KeyEvent.DOM_VK_9) {
                setCurrentTime(keycode - 48);
            }

            if (keycode === KeyEvent.DOM_VK_SPACE) {
                setPlayPause();
            }

            if (keycode === KeyEvent.DOM_VK_C) {
                updateTransformProperty('rotate', (event.shiftKey ? -rotateAngleStep : rotateAngleStep));
            }

            //173 "-"; 61 "+"
            if (event.shiftKey) {
                if (keycode === KeyEvent.DOM_VK_EQUALS) {
                    updateTransformProperty("scale", scaleStep);
                }
                if (keycode === KeyEvent.DOM_VK_HYPHEN_MINUS) {
                    updateTransformProperty("scale", -scaleStep);
                }
            }

            event.preventDefault();

            if (currentPlaybackRate != oldPlaybackRate) setPlaybackRate(currentPlaybackRate);
        }
    }, true);
}());