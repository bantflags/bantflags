// ==UserScript==
// @name        BantFlags
// @namespace   BintFlegs
// @description More flags for r/banter
// @include     http*://boards.4chan.org/bant/*
// @include     http*://archive.nyafuu.org/bant/*
// @include     http*://archived.moe/bant/*
// @include     http*://thebarchive.com/bant/*
// @exclude     http*://boards.4chan.org/bant/catalog
// @exclude     http*://archive.nyafuu.org/bant/statistics/
// @exclude     http*://archived.moe/bant/statistics/
// @exclude     http*://thebarchive.com/bant/statistics/
// @version     0.50
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @run-at      document-end
// ==/UserScript==

// DO NOT EDIT ANYTHING IN THIS SCRIPT DIRECTLY - YOUR FLAGS SHOULD BE CONFIGURED BY USING THE CONFIGURATION BOXES

/** JSLint excludes */
/*jslint browser: true*/
/*global document, console, GM_setValue, GM_getValue, GM_xmlhttpRequest, cloneInto, unsafeWindow*/

/* WebStorm JSLint ticked:
 - uncapitalized constructors
 - missing 'use strict' pragma
 - many var statements
 */

/* Right margin: 160 */

// DO NOT EDIT ANYTHING IN THIS SCRIPT DIRECTLY - YOUR FLAGS SHOULD BE CONFIGURED BY USING THE CONFIGURATION BOXES

var regions = [];
var regionVariable = 'regionVariableAPI2';
var allPostsOnPage = [];
var postNrs = [];
var postRemoveCounter = 60;
var requestRetryInterval = 5000;
var flegsBaseUrl = 'https://nineball.party/files/flags/';
var flagListFile = 'flag_list.txt';
var backendBaseUrl = 'https://nineball.party/';
var postUrl = 'files/post_flag_api2.php';
var getUrl = 'files/get_flags_api2.php';
var shortId = '490.bf.'; // TODO: reimplement, this isn't stupid
var regionDivider = "||";

var vlog= false;
var enable_archive=true; //enable flags in archives.

/** nSetup, preferences */
var nsetup = { // not anymore a clone of the original setup
    namespace: 'BintFlegs',
    id: "bantFlags-setup", // doesn't seem to get used
    form: "<span id=\"bantflags_container\"></span>" +
          "<button type=\"button\" id=\"append_flag_button\" title=\"Click to add selected flag to your flags. Click on flags to remove them. Saving happens automatically, you only need to refresh the pages that have an outdated flaglist on the page.\"><<</button>" +
          "<select id=\"flagSelect\"></select>",
    fillHtml: function (path1) {
          var path = flegsBaseUrl + "/actual_flags/";
          var oldPath = path;
          // resolve countries which we support
          GM_xmlhttpRequest({
             method: "GET",
             url: path + flagListFile,
             headers: {
                "Content-Type": "application/x-www-form-urlencoded"
             },
             onload: function (response) {
                var countrySelect = document.getElementById("flagSelect"),
                countriesAvailable = response.responseText.split('\n');

                for (var countriesCounter = 0; countriesCounter < countriesAvailable.length - 1; countriesCounter++) {
                   var opt = document.createElement('option');
                   opt.value = countriesAvailable[countriesCounter];
                   opt.innerHTML = "<img src=\"" + path + countriesAvailable[countriesCounter] + ".png\"" + " title=\"" + countriesAvailable[countriesCounter] + "\">" + " " + countriesAvailable[countriesCounter];
                   countrySelect.appendChild(opt);
                }
             }
          });
    },
    save: function (k, v) {
        GM_setValue(nsetup.namespace + k, v);
        regions = nsetup.load(regionVariable);
    },
    load: function (k) {
        //console.log("loading happens here");
        return GM_getValue(nsetup.namespace + k);
    },
    setFlag: function(flag) { // place a flag from the selector to the flags array variable and create an element in the flags_container div
        var path = flegsBaseUrl + '/actual_flags/';
        var UID = Math.random().toString(36).substring(7);
        if (!flag) {
            var flagName = document.getElementById("flagSelect").value;
        } else {
            flagName = flag;
        }
        var flagContainer = document.getElementById("bantflags_container");
        var flagElement = document.createElement('img');
        flagElement.title = flagName;
        flagElement.setAttribute("src", path + flagName + ".png");
        flagElement.setAttribute("id", UID);
        flagElement.setAttribute("class", "bantflags_flag");
        flagContainer.appendChild(flagElement);
        var flagsCount = flagContainer.children.length;
        if (flagsCount > 8) {nsetup.gray("on"); } // Why does 8 work? What happened to the async issue a moment ago?
        document.getElementById(UID).addEventListener("click", function() {
            var flagToRemove = document.getElementById(UID);
            flagToRemove.parentNode.removeChild(flagToRemove);
            nsetup.gray("off");
            nsetup.save(regionVariable, nsetup.parse());
        });
        if (!flag){ nsetup.save(regionVariable, nsetup.parse()); }
    },
    init: function () {
        // here we insert the form for placing flags. How?
        var flagsForm = document.createElement("div");
        flagsForm.setAttribute("class", "flagsForm");
        flagsForm.innerHTML = nsetup.form;
        addGlobalStyle('.flagsForm{text-align: right;}');
        addGlobalStyle(".bottomCtrl{text-align: right !important; } .bantflags_flag { padding: 1px;} [title^='Romania'] { position: relative; animation: shakeAnim 0.1s linear infinite;} @keyframes shakeAnim { 0% {left: 1px;} 25% {top: 2px;} 50% {left: 1px;} 75% {left: 0px;} 100% {left: 2px;}}");
        document.getElementsByClassName("bottomCtrl")[0].parentNode.appendChild(document.createElement("br")); // lol                                    Copy and paste abstraction
        document.getElementsByClassName("bottomCtrl")[0].parentNode.appendChild(document.createElement("br")); // I don't like this either but that stupid delete form floats right
        document.getElementsByClassName("bottomCtrl")[0].parentNode.appendChild(flagsForm);
        for (var i in regions) {
            nsetup.setFlag(regions[i]);
        }
        document.getElementById("append_flag_button").addEventListener("click", function() { nsetup.setFlag(); });
        nsetup.fillHtml("", ""); // I have no idea what this argument is tbh fampai
    },
    parse: function() {
        var flagsArray = [];
        var flagElements = document.getElementsByClassName("bantflags_flag");
        for (var i = 0; i < flagElements.length; i++) {
            flagsArray[i] = flagElements[i].title;
            //console.log("added a flag to flagsArray");
        }
        return flagsArray;
    },
    gray: function(state) {
        var button = document.getElementById("append_flag_button");
        if (state == "on") {
            button.disabled = true;
        } else {
            button.disabled = false;
        }
    }
};

/** Prompt to set region if regionVariable is empty  */
regions = nsetup.load(regionVariable);
if (!regions) {
    regions = [];
    setTimeout(function () {
        window.confirm("Bant Flags: No Flags detected");
    }, 2000);
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
            var path = "actual_flags";
            for (var i = 0; i < postedRegions.length; i++) {
                if (postedRegions[i] != "empty, or there were errors. Re-set your flags.") { path = "actual_flags/" + postedRegions[i]; }
                else { path = "empty" ; }
                var newFlag = document.createElement('a');
                nameBlock.appendChild(newFlag);
                var lastI = i;
                newFlag.innerHTML = "<img src=\"" + flegsBaseUrl + path + ".png\"" + " title=\"" + postedRegions[i] + "\">";
                newFlag.className = "bantFlag";
                newFlag.target = '_blank';
                //padding format: TOP x RIGHT_OF x BOTTOM x LEFT_OF
                newFlag.style = "padding: 0px 0px 0px 5px; vertical-align:;display: inline-block; width: 16px; height: 11px; position: relative;";
                console.log("resolved " + postedRegions[i]);
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
    if (boardID === "bant") {

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

///START archive functions

function a_getPostNumbers(f)
{
	return f.filter(function (i) { return i.id!=""; } ).map(function (p) {
        return p.id;
    });
}

function a_parseAllPostsIndex() {
    var thread = document.getElementsByClassName('thread');
	var post = document.getElementsByClassName('post');
	var p_thread = [];
	var postNrs_t = [];
	var p_post = [];
	var postNrs_p = [];
	var i=0;

    p_thread = Array.prototype.slice.call(thread);
    postNrs_t = a_getPostNumbers(p_thread);

	p_post = Array.prototype.slice.call(post);
	postNrs_p =  a_getPostNumbers(p_post);

	postNrs = postNrs_t.concat(postNrs_p);

	if(vlog)
		for(;i<postNrs.length;i++)
			console.log("post "+postNrs[i]);

	return postNrs;
}

function a_onFlagsLoad(response) {
    //exit on error
    if (response.status !== 200) {
        console.log("Could not fetch flags, status: " + response.status);
        console.log(response.statusText);
        setTimeout(a_resolveRefFlags, requestRetryInterval);
        return;
    }
	if(vlog)
		console.log("JSON: "+response.responseText);
    var jsonData = JSON.parse(response.responseText);
    jsonData.forEach(function (post) {
        var postToAddFlagTo = document.getElementById(post.post_nr),
            postData = postToAddFlagTo.getElementsByClassName('post_data')[0],
            postType = postData.getElementsByClassName('post_type')[0],
            currentFlag = postType.getElementsByClassName('flag')[0],
            postedRegions = post.region.split(regionDivider);

        if (postedRegions.length > 0 && !(currentFlag === undefined)) {

            var path = "actual_flags";
			console.log("Adding to "+post.post_nr);
            for (var i = 0; i < postedRegions.length; i++) {
                 if (postedRegions[i] != "empty, or there were errors. Re-set your flags.") { path = "actual_flags/" + postedRegions[i]; }
                else { path = "/empty" ; }
                //path = "actual_flags/" + postedRegions[i];

                    var newFlag = document.createElement('a');
                    postType.appendChild(newFlag);

                    var lastI = i;
                    var newFlagImgOpts = 'onerror="(function () {var extraFlagsImgEl = document.getElementById(\'pc' + post.post_nr +
                        '\').getElementsByClassName(\'extraFlag\')[' + lastI +
                        '].firstElementChild; if (!/\\/empty\\.png$/.test(extraFlagsImgEl.src)) {extraFlagsImgEl.src = \'' +
                        flegsBaseUrl + 'empty.png\';}})();"'; //i have no idea what this does desu

                    newFlag.innerHTML = "<img src=\"" + flegsBaseUrl + path + ".png\"" + newFlagImgOpts + " title=\"" + postedRegions[i] + "\">";
                    newFlag.className = "bantFlag";

                    newFlag.target = '_blank';


                    //padding format: TOP x RIGHT_OF x BOTTOM x LEFT_OF
                   newFlag.style = "padding: 0px 0px 0px "+(3+(4*(i>0)))+"px; vertical-align:;display: inline-block; width: 16px; height: 11px; position: relative;";

                    console.log("\tresolved " + postedRegions[i]);
            }
        }

        //postNrs are resolved and should be removed from this variable
        var index = postNrs.indexOf(post.post_nr);
        if (index > -1) {
            postNrs.splice(index, 1);
        }
    });

    //removing posts older than the time limit (they likely won't resolve)
    var timestampMinusPostRemoveCounter = Math.round(+new Date() / 1000) - postRemoveCounter; //should i remove this?

    postNrs.forEach(function (post_nr) {
        var postToAddFlagTo = document.getElementById(post_nr),
            postData = postToAddFlagTo.getElementsByClassName('post_data')[0],
            dateTime = postData.getElementsByClassName('time_wrap')[0];

        if (dateTime.getAttribute("data-utc") < timestampMinusPostRemoveCounter) {
            var index = postNrs.indexOf(post_nr);
            if (index > -1) {
                postNrs.splice(index, 1);
            }
        }
    });
}

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

function a_resolveRefFlags() {
    var boardID = window.location.pathname.split('/')[1]; //do i need this?
    if (boardID === "bant") {
		if(vlog) console.log(encodeURIComponent(postNrs) );
        GM_xmlhttpRequest({
            method: "POST",
            url: backendBaseUrl + getUrl,
            data: "post_nrs=" + encodeURIComponent(postNrs) + "&" + "board=" + encodeURIComponent(boardID),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: a_onFlagsLoad
        });
    }
}

///END archive functions


if(window.location.host == "boards.4chan.org") // /bant/ stuff
{
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
				encodeURIComponent(regions.slice().join(regionDivider)),
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
				encodeURIComponent(regions.slice().join(regionDivider)),
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

	/** START fix flag alignment */
    addGlobalStyle('.flag{top: 0px !important;left: -1px !important}');
	/** END fix flag alignment */

	/** setup init and start first calls */
	nsetup.init();
	parseOriginalPosts();
	resolveRefFlags();
}
else if(enable_archive) { //archive stuff

	addGlobalStyle('.bantFlag{top: -2px !important;left: -1px !important}');
	addGlobalStyle(".bottomCtrl{text-align: right !important; } .bantflags_flag { padding: 1px;} [title^='Romania'] { position: relative; animation: shakeAnim 0.1s linear infinite;} @keyframes shakeAnim { 0% {left: 1px;} 25% {top: 2px;} 50% {left: 1px;} 75% {left: 0px;} 100% {left: 2px;}}");

	a_parseAllPostsIndex();
	a_resolveRefFlags();
}
