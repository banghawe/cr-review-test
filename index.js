console.info("Loading Wortal.js 1.0.0");
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

window.triggerWortalAd = function (placement, description, beforeAd, afterAd, adBreakDone) {

    if (PLACEMENTS.indexOf(placement) < 0) {
        console.warn("Invalid placement selected:", placement, "Should be one of", PLACEMENTS);
        return;
    }

    console.log("Wortal Ad Break called placement=", placement, "description=", description);
    var params = {
        type: placement,
        name: description,
        beforeAd: beforeAd,
        afterAd: afterAd
    }

    if (adBreakDone) {
        params.adBreakDone = adBreakDone
    }

    adBreak(params);

}

window.initWortal = function (callback) {

    let hostIdMetaTagElm = document.createElement("meta")
    let loadGoogleScript = document.createElement("script");
    let clientId = getParameterByName("clientid");
    let debug = getParameterByName("debug");
    let hostChannelId = getParameterByName("channelid");
    let hostId = getParameterByName("hostid")

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
