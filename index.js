console.info("Loading Wortal.js 1.3.0");

window.adsbygoogle = window.adsbygoogle || [];
var PLACEMENTS = ["start", "pause", "next", "browse", "reward", "preroll"]
var PLATFORMS = ["wortal", "link", "viber"]
var PLATFORM_DOMAINS = {
    "viber": ["vbrplsbx.io"],
    "link": ["rgsbx.net", "lgsbx.net"],
    "wortal": ["html5gameportal.com", "html5gameportal.dev"]
}
var SHARE_TO = ["facebook", "twitter"]

window.adBreak = adConfig = function (o) {
    adsbygoogle.push(o);
}

// Preload ads
adConfig({preloadAdBreaks: 'on'});

/**
 * Borrowed from https://stackoverflow.com/a/901144
 * @param name
 * @returns {string|null}
 */
function getParameterByName(name) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    var results = regex.exec(window.location.href);

    if (!results) {
        return null;
    }
    if (!results[2]) {
        return '';
    }

    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function identifyPlatformByURL() {
    var location = window.location;
    var host = location.host

    //Check Viber
    viber_domains = PLATFORM_DOMAINS["viber"]
    for (var i = 0; i < viber_domains.length; i++) {
        if (host.indexOf(viber_domains[i]) !== -1) {
            return window.setWortalPlatform('viber')
        }
    }

    //Check Link
    link_domains = PLATFORM_DOMAINS["link"]
    for (var i = 0; i < link_domains.length; i++) {
        if (host.indexOf(link_domains[i]) !== -1) {
            return window.setWortalPlatform('link')
        }
    }

    return window.setWortalPlatform('wortal')
}

function event(name, features) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", "https://wombat.digitalwill.co.jp/wortal/events");
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    xmlhttp.send(JSON.stringify({ name, features }));
}

window.getWortalPlatform = function () {
    if (!window.wortalPlatform) {
        return "wortal"
    }

    return window.wortalPlatform
}

window.setWortalPlatform = function (platform) {
    if (PLATFORMS.indexOf(platform) < 0) {
        console.warn("Invalid platform selected:", platform, "Should be one of", PLATFORMS);
        return;
    }

    window.wortalPlatform = platform
}

window.initWortal = function (callback, onErrorCallback=function () {}) {
    var platform = window.getWortalPlatform()
    switch (platform) {
        case "wortal":
            return initWortalPlatform(callback, onErrorCallback);
        case "link":
            return initLinkPlatform(callback);
        case "viber":
            return initViberPlatform(callback);
        default:
            console.warn("Invalid platform selected:", platform, "Should be one of", PLATFORMS);
            return;
    }
}

window.triggerWortalAd = function (placement, placementId, description= "", callbacks) {
    switch (window.getWortalPlatform()) {
        case "wortal":
            return triggerWortalPlatformAd(placement, description, callbacks);
        case "link":
        case "viber":
            return triggerWortalLinkViberAd(placement, placementId, callbacks);
    }
}

window.shareGame = function (to, message) {
    if (SHARE_TO.indexOf(to) < 0) {
        console.warn("Invalid media social platform selected:", to, "Should be one of", SHARE_TO);
        return;
    }

    switch (to) {
        case "facebook":
            return shareOnFacebook(message);
        case "twitter":
            return shareOnTwitter(message);
    }

}

var initWortalPlatform = function (callback, onErrorCallback=function (){}) {
    let hostIdMetaTagElm = document.createElement("meta")
    let loadGoogleScript = document.createElement("script");
    let clientId = getParameterByName("clientid");
    let debug = getParameterByName("debug");
    let hostChannelId = getParameterByName("channelid");
    let hostId = getParameterByName("hostid");
    let freqCap = `${getParameterByName("freqcap") || 30}s`

    if (clientId === "" || clientId === null) {
        console.error("Failed to setup wortal.js. Configuration \"clientid\" missing");
        return;
    }

    if (debug === "true") {
        loadGoogleScript.setAttribute("data-ad-client", "ca-pub-123456789");
        loadGoogleScript.setAttribute("data-adbreak-test", "on");
    } else {
        loadGoogleScript.setAttribute("data-ad-host", hostId);
        loadGoogleScript.setAttribute("data-ad-client", clientId);
        loadGoogleScript.setAttribute("data-ad-frequency-hint", freqCap);
        hostChannelId ? loadGoogleScript.setAttribute("data-ad-host-channel", hostChannelId) : null;
    }

    loadGoogleScript.setAttribute("src", "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js");
    loadGoogleScript.setAttribute("type", "text/javascript");

    hostIdMetaTagElm.setAttribute("name", "google-adsense-platform-account")
    hostIdMetaTagElm.setAttribute("content", hostId)

    document.head.appendChild(hostIdMetaTagElm);
    document.head.appendChild(loadGoogleScript);

    loadGoogleScript.onerror = function() {
        console.log("Error loading " + this.src);
        if (typeof (onErrorCallback) === "function") {

            onErrorCallback();
            return;

        }
    };

    loadGoogleScript.addEventListener("load", function () {

        if (typeof (callback) === "function") {

            callback();
            return;

        }

        console.warn("No callback provided to initWortal");

    });
}

var initLinkPlatform = function (callback) {
    var loadLinkScript = document.createElement("script");
    document.head.appendChild(loadLinkScript);

    loadLinkScript.src = "https://lg.rgames.jp/libs/link-game-sdk/1.3.0/bundle.js";
    loadLinkScript.onload = function(script) {
        window.wortalGame = LinkGame
        if (typeof (callback) === "function") {
            callback();
        }
    };
}

var initViberPlatform = function (callback) {
    var loadLinkScript = document.createElement("script");
    document.head.appendChild(loadLinkScript);

    loadLinkScript.src = "https://vbrpl.io/libs/viber-play-sdk/1.13.0/bundle.js";
    loadLinkScript.onload = function(script) {
        window.wortalGame = ViberPlay
        if (typeof (callback) === "function") {
            callback();
        }
    };
}

var triggerWortalPlatformAd = function (placement, description, callbacks) {
    /**
     * Doc: https://developers.google.com/ad-placement/apis/adbreak
     * Callbacks is object:
     * {
     *     beforeAd: function () {},
     *     afterAd: function () {},
     *     adBreakDone: function () {},
     *     beforeReward: function (showAdFn) {},     // Show reward prompt (call showAdFn() if clicked)
     *     adDismissed: function () {},              // Player dismissed the ad before completion
     *     adViewed: function () {},                 // Ad was viewed and closed
     *     noShow: function () {}
     * }
     */

    if (PLACEMENTS.indexOf(placement) < 0) {
        console.warn("Invalid placement selected:", placement, "Should be one of", PLACEMENTS);
        return;
    }

    var adShown = false;
    let clientId = getParameterByName("clientid");
    let hostChannelId = getParameterByName("channelid");
    let hostId = getParameterByName("hostid")
    let sessionId = getParameterByName('sessid')

    console.info("Wortal Ad Break called placement=", placement, "description=", description);

    var params = {
        type: placement, name: description
    }

    params.adBreakDone = function (placementInfo) {
        console.log(placementInfo)
        event('AdBreakDone', {
            client_id: clientId,
            host_channel_id: hostChannelId,
            host_id: hostId,
            session_id: sessionId,
            placement,
            breakFormat: placementInfo.breakFormat,
            breakStatus: placementInfo.breakStatus,
        })

        callbacks.adBreakDone && callbacks.adBreakDone(placementInfo)
    }

    if (callbacks.beforeReward) {
        params.beforeReward = callbacks.beforeReward
    }

    if (callbacks.adDismissed) {
        params.adDismissed = callbacks.adDismissed
    }

    if (callbacks.adViewed) {
        params.adViewed = callbacks.adViewed
    }

    if (placement === "preroll") {

        console.info("Attempting to show preroll.");

        // Set a timeout to control ads not showing.
        setTimeout(function () {
            console.warn("Ad did not show. Skipping.");
            if (typeof callbacks.noShow !== "function") {

                return;
            }

            callbacks.noShow();

        }, 500);

        adBreak(params);

    } else {

        console.log("Attempting to show", placement);

        // Set a timeout to control ads not showing.
        setTimeout(function () {

            if (adShown) {
                event('AdShown', {
                    client_id: clientId,
                    host_channel_id: hostChannelId,
                    host_id: hostId,
                    session_id: sessionId,
                    placement
                })
                return;
            }

            console.warn("Ad did not show. Skipping.");
            if (typeof callbacks.noShow !== "function") {

                return;
            }

            callbacks.noShow();

        }, 500);


        //{beforeAd, afterAd, adBreakDone, onNoShow}

        params.beforeAd = function () {
            adShown = true;
            callbacks.beforeAd();
        };
        params.afterAd = callbacks.afterAd;

        adBreak(params);

    }


}

var triggerWortalLinkViberAd = function (placementType, placementId, callbacks) {
    /**
     * Callbacks is object:
     * {
     *     beforeAd: function () {},
     *     afterAd: function () {},
     *     adDismissed: function () {},
     *     adViewed: function () {},
     *     noBreak: function () {},
     * }
     */

    if (!window.wortalGame) {
        return console.error("Please instantiate window.wortalGame by calling window.initWortal before using this function")
    }

    console.log("Attempting to show", placementType, "ad with id", placementId)
    if (placementType == "reward") {
        getLinkViberRewardedVideoAd(placementId, callbacks)
    } else {
        getLinkViberInterstitialAd(placementId, callbacks)
    }
}

var getLinkViberInterstitialAd = function (placementId, callbacks) {
    if (!window.wortalGame) {
        return console.error("Please instantiate window.wortalGame by calling window.initWortal before using this function")
    }

    var preloadedInterstitial = null;
    window.wortalGame.getInterstitialAdAsync(placementId)
        .then(function(interstitial) {
            callbacks.beforeAd && callbacks.beforeAd();
            preloadedInterstitial = interstitial;
            return preloadedInterstitial.loadAsync();
        })
        .then(function () {
            preloadedInterstitial.showAsync()
                .then(function () {
                    console.log('Interstitial ad finished successfully');
                    callbacks.afterAd && callbacks.afterAd()
                })
                .catch(function(err) {
                    onAdbreakError(err, callbacks)
                });
        })
        .catch(function(err) {
            onAdbreakError(err, callbacks)
        });
}

var getLinkViberRewardedVideoAd = function (placementId, callbacks) {
    var preloadedRewardedVideo = null;
    window.wortalGame.getRewardedVideoAsync(placementId)
        .then(function(rewarded) {
            callbacks.beforeAd && callbacks.beforeAd();
            preloadedRewardedVideo = rewarded
            return preloadedRewardedVideo.loadAsync();
        })
        .then(function() {
            preloadedRewardedVideo.showAsync()
            .then(function() {
                console.log('Rewarded video watched successfully');
                callbacks.adViewed && callbacks.adViewed();
                callbacks.afterAd && callbacks.afterAd();
            })
            .catch(function(err) {
                console.log(err);
                callbacks.adDismissed && callbacks.adDismissed();
            });
        })
        .catch(function(err) {
            onAdbreakError(err, callbacks);
        });
}

var getShareUrl = function () {
    var shareUrl = getParameterByName("shareUrl")

    return shareUrl
}

var shareOnFacebook = function (message) {
    var shareUrl = getShareUrl()
    var url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${message}`
    window.open(url, "_blank");
}

var shareOnTwitter = function (message) {
    var shareUrl = getShareUrl()
    var url = "https://twitter.com/intent/tweet"
    window.open(`${url}?url=${shareUrl}&text=${message}`, "_blank");
}

// Helpers
var onAdbreakError = function(e, options) {
    console.error(e);
	options.noBreak && options.noBreak();
}

identifyPlatformByURL()
