// ==UserScript==
// name and namespace cannot be changed - it would break the update mechanism, that's why we will leave the name at Extra Flags for int
// @name        BantFlags
// @namespace   BintFlegs
// @description BantFlags test
// @include     http*://boards.4chan.org/bant/*
// @exclude     http*://boards.4chan.org/bant/catalog
// @version     0.30
// @grant       GM_xmlhttpRequest
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @run-at      document-end
// ==/UserScript==

// DO NOT EDIT ANYTHING IN THIS SCRIPT DIRECTLY - YOUR REGION SHOULD BE CONFIGURED BY USING THE CONFIGURATION BOXES (see install webms for help)

// must wait for replacement for GM_addStyle and GM_registerMenuCommand

/** JSLint excludes */
/*jslint browser: true*/
/*global document, console, GM_addStyle, GM_setValue, GM_getValue, GM_registerMenuCommand, GM_xmlhttpRequest, cloneInto, unsafeWindow*/

/* WebStorm JSLint ticked:
 - uncapitalized constructors
 - missing 'use strict' pragma
 - many var statements
 */

/* Right margin: 160 */

// DO NOT EDIT ANYTHING IN THIS SCRIPT DIRECTLY - YOUR REGION SHOULD BE CONFIGURED BY USING THE CONFIGURATION BOXES (see install webms for help)
var regions = [];
var radio = "all";
var lastRegion = ""; //used for back button
var regionVariable = 'regionVariableAPI2';
var radioVariable = 'radioVariableAPI2';
var allPostsOnPage = [];
var postNrs = [];
var postRemoveCounter = 60;
var requestRetryInterval = 5000;
var flegsBaseUrl = 'https://raw.githubusercontent.com/bantflags/bantflags/master/flags/';
// remove comment and change link to add country flag icons into selection menu var countryFlegsBaseUrl = 'https://raw.githubusercontent.com/flagzzzz/Extra-Flags-for-4chan/master/flags/';
var flagListFile = 'flag_list.txt';
var backendBaseUrl = 'https://nineball.party/';
var postUrl = 'files/post_flags_api2.php';
var getUrl = 'files/get_flags_api2.php';
var shortId = 'witingwc.ef.';
var regionDivider = "||";

/** Setup, preferences */
var setup = {
    namespace: 'BintFlegs',
    id: "ExtraFlags-setup",
    html: function () {

        var htmlFixedStart = '<div>Extra Flags for 4chan v2</div><br/>';
        var htmlBackButton = '<button name="back">Back</button>';
        var htmlNextButton = '<button name="forward">Next</button>';
        var htmlBackNextButtons = '<div>' + htmlBackButton + htmlNextButton + '</div>';
        var htmlSaveButton = '<div><button name="save" title="Pressing &#34;Save Regions&#34; will set your regions to the ones current displayed below.">' +
            'Save Regions</button></div><br/>';
        var htmlHelpText = '<label name="' + shortId + 'label"> You can go as deep as you like, regions stack.<br/>' +
            'For example; United States, California, Los Angeles<br/></label>' +
            '<label>Country must match your flag! Your flag not here? Open issue here:<br/>' +
            '<a href="https://github.com/bantflags/bantflags/issues" style="color:blue">' +
            'https://github.com/bantflags/bantflags/issues</a></label>';
        var filterRadio = '<br/><br/><form id="filterRadio">' +
            '<input type="radio" name="filterRadio" id="filterRadioall" style="display: inline !important;" value="all"><label>Show country + ALL regions.</label>' +
            '<br/><input type="radio" name="filterRadio" id="filterRadiofirst" style="display: inline !important;" value="first"><label>Only show country + FIRST region.</label>' +
            '<br/><input type="radio" name="filterRadio" id="filterRadiolast" style="display: inline !important;" value="last"><label>Only show country + LAST region. (v1/old format)</label>' +
            '</form>';

        if (regions.length > 1) {
            var selectMenuFlags = "Regional flags selected: ";
            var path = flegsBaseUrl + "/" + regions[0];
            for (var i = 1; i < regions.length; i++) {
                path += "/" + regions[i];
                selectMenuFlags += "<img src='" + path + ".png'" +  " title='" + regions[i] + "'> ";
            }
            selectMenuFlags += "<br/>";
            return htmlFixedStart + '<div>Region: <br/><select id="' + shortId + 'countrySelect">' +
                '</select></div><br/>' + htmlBackNextButtons +
                '<br/>' + htmlSaveButton + '</div>' + selectMenuFlags + htmlHelpText + filterRadio;
        }

        if (regions.length == 1) {
            var selectMenuFlags = "<br/>";
            return htmlFixedStart + '<div>Region: <br/><select id="' + shortId + 'countrySelect">' +
                '</select></div><br/>' + htmlBackNextButtons +
                '<br/>' + '</div><br/><br/>' + selectMenuFlags + htmlHelpText + filterRadio;
       }

        return htmlFixedStart + '<div>Country: <br/><select id="' + shortId + 'countrySelect">' +
            '</select></div><br/>' + htmlBackNextButtons + '<br/>' + htmlHelpText + filterRadio;

    },
    fillHtml: function (path1) {
        if (path1 === "") { //normal call
            var path = flegsBaseUrl + "/";
            var oldPath = path;
            if (regions.length > 0) {
                for (var i = 0; i < regions.length; i++) {
                    oldPath = path;
                    path += regions[i] + "/";
                }
            }
            var pathNoFlagList = path;
        } else { // end of folder line call
            path = path1;
            oldPath = "";
            var pathNoFlagList = path;
        }

        /* resolve countries which we support */
        GM_xmlhttpRequest({
            method: "GET",
            url: path + flagListFile,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function (response) {
                if (response.status == 404) { // detect if there are no more folders
                    setup.fillHtml(oldPath);
                    setup.q('forward').disabled = true; // disable next button
                } else {
                    //hide spam, debug purposes only
                    //console.log(response.responseText);
                    var countrySelect = document.getElementById(shortId + 'countrySelect'),
                        countriesAvailable = response.responseText.split('\n');

                    for (var countriesCounter = 0; countriesCounter < countriesAvailable.length - 1; countriesCounter++) {
                        var opt = document.createElement('option');
                        opt.value = countriesAvailable[countriesCounter];

                        if (regions.length > 0) {
                            opt.innerHTML = countriesAvailable[countriesCounter] + " " + "<img src=\"" + flegsBaseUrl + pathNoFlagList + countriesAvailable[countriesCounter] + ".png\"" + " title=\"" + countriesAvailable[countriesCounter] + "\">";
                        } else {
                            opt.innerHTML = countriesAvailable[countriesCounter]; // remove comment to enable country flags in the selection menu + " " + "<img src=\"" + countryFlegsBaseUrl + countriesAvailable[countriesCounter] + ".png\"" + " title=\"" + countriesAvailable[countriesCounter] + "\">";
                        }


                        if (lastRegion != "" && countriesAvailable[countriesCounter] === lastRegion) { // automatically select last selected when going up a folder
                            opt.selected = "selected";
                        } else if (oldPath == "" && countriesAvailable[countriesCounter] === regions[regions.length - 1]) { // show final selected when no more
                            // folders detected
                            opt.selected = "selected";
                        }
                        countrySelect.appendChild(opt);
                    }
                }

            }
        });
    },
    setRadio: function() {
        var radioStatus = setup.load(radioVariable);
        if (!radioStatus || radioStatus === "" || radioStatus === "undefined") {
            radioStatus = "all";
        }
        var radioButton = document.getElementById("filterRadio" + radioStatus);
        radioButton.checked = true;
    },
    q: function (n) {
        return document.querySelector('#' + this.id + ' *[name="' + n + '"]');
    },
    removeExtra: function () {
        if (regions.length > 0) {
            lastRegion = regions[regions.length - 1];
            regions.pop();
        }
        setup.show();
    },
    show: function () {
        /* remove setup window if existing */
        var setup_el = document.getElementById(setup.id);
        if (setup_el) {
            setup_el.parentNode.removeChild(setup_el);
        }
        /* create new setup window */
        GM_addStyle('\
            #' + setup.id + ' { position:fixed;z-index:10001;top:40px;right:40px;padding:20px 30px;background-color:white;width:auto;border:1px solid black }\
            #' + setup.id + ' * { color:black;text-align:left;line-height:normal;font-size:12px }\
            #' + setup.id + ' div { text-align:center;font-weight:bold;font-size:14px }'
        );
        setup_el = document.createElement('div');
        setup_el.id = setup.id;
        setup_el.innerHTML = setup.html();
        setup.fillHtml("", "");

        document.body.appendChild(setup_el);

        setup.setRadio();

        /* button listeners */
        setup.q('back').addEventListener('click', function () {
            if (regions.length > 0) {
                if (setup.q('forward').disabled == true) {
                    setup.q('forward').disabled = false; // reenable next button
                }
                lastRegion = regions[regions.length - 1];
                regions.pop();
                setup.show();
            }
        }, false);

        setup.q('forward').addEventListener('click', function () {
            var e = document.getElementById(shortId + "countrySelect");
            var temp = e.options[e.selectedIndex].value;
            lastRegion = "";
            if (temp != "" && regions[regions.length - 1] != temp) {
                this.disabled = true;
                this.innerHTML = 'Saving...';

                lastRegion = regions[regions.length - 1];
                regions.push(temp);
                setup.show();
            }

        }, false);

        setup.q('save').addEventListener('click', function () {
            var e = document.getElementById(shortId + "countrySelect");
            var temp = e.options[e.selectedIndex].value;

            if (regions[regions.length - 1] === "") { //prevent last spot from being blank
                regions.pop();
            }
            lastRegion = "";

            radio = document.querySelector('input[name="filterRadio"]:checked').value;
            setup.save(radioVariable, radio);

            alert('Flags set: ' + regions + '\n\n' + 'Refresh all your 4chan tabs and be sure to post using the quick reply window!');

            this.disabled = true;
            this.innerHTML = 'Saving...';
            setup_el.parentNode.removeChild(setup_el);
            setup.save(regionVariable, regions);

        }, false);
    },
    save: function (k, v) {
        GM_setValue(setup.namespace + k, v);
    },
    load: function (k) {
        return GM_getValue(setup.namespace + k);
    },
    init: function () {
        //GM_registerMenuCommand('Extra Flags setup', setup.show;
        GM_registerMenuCommand('Extra Flags setup', setup.show);
    }
};

/** Prompt to set region if regionVariable is empty  */
regions = setup.load(regionVariable);
radio = setup.load(radioVariable);
if (!regions) {
    regions = [];
    setTimeout(function () {
        if (window.confirm("Extra Flags: No region detected, set it up now?") === true) {
            setup.show();
        }
    }, 2000);
}
if (!radio || radio === "" || radio === "undefined") {
    radio = "all";
}

/** parse the posts already on the page before thread updater kicks in */
function parseOriginalPosts() {
    var tempAllPostsOnPage = document.getElementsByClassName('postContainer');
    allPostsOnPage = Array.prototype.slice.call(tempAllPostsOnPage); //convert from element list to javascript array
    postNrs = allPostsOnPage.map(function (p) {
        return p.id.replace("pc", "");
    });
}

/** the function to get the flags from the db uses postNrs
 *  member variable might not be very nice but it's the easiest approach here */
function onFlagsLoad(response) {
    //exit on error
    if (response.status !== 200) {
        console.log("Could not fetch flags, status: " + response.status);
        console.log(response.statusText);
        setTimeout(resolveRefFlags, requestRetryInterval);
        return;
    }

    var jsonData = JSON.parse(response.responseText);

    jsonData.forEach(function (post) {
        var postToAddFlagTo = document.getElementById("pc" + post.post_nr),
            postInfo = postToAddFlagTo.getElementsByClassName('postInfo')[0],
            nameBlock = postInfo.getElementsByClassName('nameBlock')[0],
            currentFlag = nameBlock.getElementsByClassName('flag')[0],
            postedRegions = post.region.split(regionDivider);

        if (postedRegions.length > 0 && !(currentFlag === undefined)) {
            var path = currentFlag.title;
            for (var i = 0; i < postedRegions.length; i++) {
                path += "/" + postedRegions[i];

                // this is probably quite a dirty fix, but it's fast
                if ((radio === "all") || (radio === "first" && i === 0) || (radio === "last" && i === (postedRegions.length - 1))) {
                    var newFlag = document.createElement('a');
                    nameBlock.appendChild(newFlag);

                    var lastI = i;
                    if (radio === 'last') {
                        lastI = 0;
                    }

                    var newFlagImgOpts = 'onerror="(function () {var extraFlagsImgEl = document.getElementById(\'pc' + post.post_nr +
                        '\').getElementsByClassName(\'extraFlag\')[' + lastI +
                        '].firstElementChild; if (!/\\/empty\\.png$/.test(extraFlagsImgEl.src)) {extraFlagsImgEl.src = \'' +
                        flegsBaseUrl + 'empty.png\';}})();"';

                    newFlag.innerHTML = "<img src=\"" + flegsBaseUrl + path + ".png\"" + newFlagImgOpts + " title=\"" + postedRegions[i] + "\">";
                    newFlag.className = "extraFlag";

                    if (i > 0) {
                        newFlag.href = "https://www.google.com/search?q=" + postedRegions[i] + ", " + postedRegions[i - 1];
                    } else {
                        newFlag.href = "https://www.google.com/search?q=" + postedRegions[i] + ", " + currentFlag.title;
                    }

                    newFlag.target = '_blank';
                    //padding format: TOP x RIGHT_OF x BOTTOM x LEFT_OF
                    newFlag.style = "padding: 0px 0px 0px 5px; vertical-align:;display: inline-block; width: 16px; height: 11px; position: relative;";

                    console.log("resolved " + postedRegions[i]);
                }
            }
        }

        //postNrs are resolved and should be removed from this variable
        var index = postNrs.indexOf(post.post_nr);
        if (index > -1) {
            postNrs.splice(index, 1);
        }
    });

    //removing posts older than the time limit (they likely won't resolve)
    var timestampMinusPostRemoveCounter = Math.round(+new Date() / 1000) - postRemoveCounter;

    postNrs.forEach(function (post_nr) {
        var postToAddFlagTo = document.getElementById("pc" + post_nr),
            postInfo = postToAddFlagTo.getElementsByClassName('postInfo')[0],
            dateTime = postInfo.getElementsByClassName('dateTime')[0];

        if (dateTime.getAttribute("data-utc") < timestampMinusPostRemoveCounter) {
            var index = postNrs.indexOf(post_nr);
            if (index > -1) {
                postNrs.splice(index, 1);
            }
        }
    });
}

/** fetch flags from db */
function resolveRefFlags() {
    var boardID = window.location.pathname.split('/')[1];
    if (boardID === "int" || boardID === "sp" || boardID === "pol" || boardID === "bant") {

        GM_xmlhttpRequest({
            method: "POST",
            url: backendBaseUrl + getUrl,
            data: "post_nrs=" + encodeURIComponent(postNrs) + "&" + "board=" + encodeURIComponent(boardID),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: onFlagsLoad
        });
    }
}

/** send flag to system on 4chan x (v2, loadletter, v3 untested) post
 *  handy comment to save by ccd0
 *  console.log(e.detail.boardID);  // board name    (string)
 *  console.log(e.detail.threadID); // thread number (integer in ccd0, string in loadletter)
 *  console.log(e.detail.postID);   // post number   (integer in ccd0, string in loadletter) */
document.addEventListener('QRPostSuccessful', function (e) {
    //setTimeout to support greasemonkey 1.x
    setTimeout(function () {
        GM_xmlhttpRequest({
            method: "POST",
            url: backendBaseUrl + postUrl,
            data: "post_nr=" + encodeURIComponent(e.detail.postID) + "&" + "board=" + encodeURIComponent(e.detail.boardID) + "&" + "regions=" +
            encodeURIComponent(regions.slice(1).join(regionDivider)),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function (response) {
                //hide spam, debug purposes only
                //console.log(response.responseText);
            }
        });
    }, 0);
}, false);

/** send flag to system on 4chan inline post */
document.addEventListener('4chanQRPostSuccess', function (e) {
    var boardID = window.location.pathname.split('/')[1];
    var evDetail = e.detail || e.wrappedJSObject.detail;
    //setTimeout to support greasemonkey 1.x
    setTimeout(function () {
        GM_xmlhttpRequest({
            method: "POST",
            url: backendBaseUrl + postUrl,
            data: "post_nr=" + encodeURIComponent(evDetail.postId) + "&" + "board=" + encodeURIComponent(boardID) + "&" + "regions=" +
            encodeURIComponent(regions.slice(1).join(regionDivider)),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function (response) {
                //hide spam, debug only
                //console.log(response.responseText);
            }
        });
    }, 0);
}, false);

/** Listen to post updates from the thread updater for 4chan x v2 (loadletter) and v3 (ccd0 + ?) */
document.addEventListener('ThreadUpdate', function (e) {
    var evDetail = e.detail || e.wrappedJSObject.detail;
    var evDetailClone = typeof cloneInto === 'function' ? cloneInto(evDetail, unsafeWindow) : evDetail;

    //ignore if 404 event
    if (evDetail[404] === true) {
        return;
    }

    setTimeout(function () {
        //add to temp posts and the DOM element to allPostsOnPage
        evDetailClone.newPosts.forEach(function (post_board_nr) {
            var post_nr = post_board_nr.split('.')[1];
            postNrs.push(post_nr);
            var newPostDomElement = document.getElementById("pc" + post_nr);
            allPostsOnPage.push(newPostDomElement);
        });

    }, 0);
    //setTimeout to support greasemonkey 1.x
    setTimeout(resolveRefFlags, 0);
}, false);

/** Listen to post updates from the thread updater for inline extension */
document.addEventListener('4chanThreadUpdated', function (e) {
    var evDetail = e.detail || e.wrappedJSObject.detail;

    var threadID = window.location.pathname.split('/')[3];
    var postsContainer = Array.prototype.slice.call(document.getElementById('t' + threadID).childNodes);
    var lastPosts = postsContainer.slice(Math.max(postsContainer.length - evDetail.count, 1)); //get the last n elements (where n is evDetail.count)

    //add to temp posts and the DOM element to allPostsOnPage
    lastPosts.forEach(function (post_container) {
        var post_nr = post_container.id.replace("pc", "");
        postNrs.push(post_nr);
        allPostsOnPage.push(post_container);
    });
    //setTimeout to support greasemonkey 1.x
    setTimeout(resolveRefFlags, 0);
}, false);

/** START fix flag alignment on chrome */
function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) {
        return;
    }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

if (navigator.userAgent.toLowerCase().indexOf('webkit') > -1) {
    addGlobalStyle('.flag{top: 0px !important;left: -1px !important}');
}
/** END fix flag alignment on chrome */

/** setup init and start first calls */
setup.init();
parseOriginalPosts();
resolveRefFlags();
