console.info("Loading Wortal.js 1.1.2");

window.adsbygoogle = window.adsbygoogle || [];
var PLACEMENTS = ["start", "pause", "next", "browse", "reward", "preroll"]

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

function event(name, features) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", "https://wombat.digitalwill.co.jp/wortal/events");
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    xmlhttp.send(JSON.stringify({ name, features }));
}

window.triggerWortalAd = function (placement, description, callbacks) {
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
    let hostChannelId = getParameterByName("channelid")
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
        //{beforeAd, afterAd, adBreakDone, onNoShow}

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

        params.beforeAd = function () {
            adShown = true;
            callbacks.beforeAd();
        };
        params.afterAd = callbacks.afterAd;

        adBreak(params);

    }
}

window.initWortal = function (callback) {

    let hostIdMetaTagElm = document.createElement("meta")
    let loadGoogleScript = document.createElement("script");
    let clientId = getParameterByName("clientid");
    let debug = getParameterByName("debug");
    let hostChannelId = getParameterByName("channelid")
    let hostId = getParameterByName("hostid")
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

    loadGoogleScript.addEventListener("load", function () {

        if (typeof (callback) === "function") {

            callback();
            return;

        }

        console.warn("No callback provided to initWortal");

    });

}

window.initWortalLink = function (callback) {
    var loadLinkScript = document.createElement("script");
    document.head.appendChild(loadLinkScript);

    loadLinkScript.src = "https://lg.rgames.jp/libs/link-game-sdk/1.0/bundle.js";
    loadLinkScript.onload = function(script) {
        window.wortalLink = LinkGame
        if (typeof (callback) === "function") {
            callback();
        }
    };
}
