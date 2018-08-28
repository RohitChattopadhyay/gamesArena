//Global Variables

var gameArray = new Array();
var searchArray = new Array();
var sortedArray = new Array();
var searchFnRun = false;
var perPage = 20;
var defPlatform = "";
var version = 1;

//fetching from API
let gameData;
fetch('http://starlord.hackerearth.com/gamesext')
	.then(
		function (response) {
			if (response.status !== 200) {
				console.log('Error: ' +
					response.status);
				return;
			}
			response.json().then(function (data) {
				gameData = data;
				openDB();
			});
		}
	)

function openDB() {
	//function to open and store in IndexedDB
	var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
	if(!indexedDB) { alert('Unsupported browser, please update or use some other browser'); }
	var open = indexedDB.open("gamesDB", version);
	
	// Create the schema
	open.onupgradeneeded = function () {
		//for version change
		var db = open.result;
		var store = db.createObjectStore("history", {
			autoIncrement: true
		});
		var indexScore = store.createIndex("genreIndex", "genre");
		store = db.createObjectStore("games", {
			keyPath: "title"
		});
		indexScore = store.createIndex("ScoreIndex", "score");
	};

	open.onsuccess = function () {
		// Starting a new transaction
		var db = open.result;
		var tx = db.transaction("games", "readwrite");
		var store = tx.objectStore("games");
		var indexScore = store.index("ScoreIndex");
		//Store in indexedDB
		apiDB(store);
	};
	open.onerror = function (e) {
		//Error handler
		console.log(e.target.errorcode);
	};
}

function apiDB(store) {
	//function to store in IndexedDB
	for (i = 0; i < gameData.length; i++) {
		store.put(gameData[i]);
		searchArray.push(gameData[i]);
	}
	//shuffling array
	shuffle(searchArray);
	gameArray = searchArray;
	//displaying initial set of games
	gameDisplayer(0, searchArray);
	sortedArray = searchArray;
	sortedArray.sort(compare);
	h_recoDB();
}

function closeDB() {
	//closing connection function
	tx.oncomplete = function () {
		db.close();
	};
}

function searchSuggest(keyword, genre, platform) {
	//function to suggest in autocomplete search
	if (keyword.length == 0) keyword = " ";
	if (genre == '-1') {
		var show = true;
		genre = "";
	} else var show = false;
	searchFnRun = false;
	//clearing current data
	$("#autoSuggest").empty();
	var genre = typeof genre !== 'undefined' ? genre : document.getElementById("genreInp").value;
	var platform = typeof platform !== 'undefined' ? platform : document.getElementById("platformInp").value;
	// Start a new transaction
	var appender;
	$("#autoSuggest").empty();
	searchArray = new Array();
	var i = 0;
	var appender, pos, title;
	searchFnRun = true;
	if (searchFnRun == false) {
		$("#autoSuggest").empty();
		return;
	}
	var j = 0;
	$("#autoSuggest").empty();
	for (i = 0; i < gameArray.length; i++) {
		if (gameArray[i].title.toString().toUpperCase().indexOf(keyword.toUpperCase()) != -1 && gameArray[i].genre.toString().toUpperCase().indexOf(genre.toUpperCase()) != -1 && gameArray[i].platform.toString().toUpperCase().indexOf(platform.toUpperCase()) != -1) {
			if (j < 11) {
				title = gameArray[i].title;
				pos = title.toString().toUpperCase().indexOf(keyword.toUpperCase());
				appender = title.substr(0, pos) + "<b>" + title.substr(pos, keyword.length) + "</b>" + title.substr(pos + keyword.length);
				$("#autoSuggest").append("<li title='A " + gameArray[i].genre + " game for " + gameArray[i].platform + "' onclick=\"h_addDB('" + gameArray[i].url + "');window.open('http://ign.com" + gameArray[i].url + "');\">" + appender + "<small> (" + gameArray[i].platform + ")</small<</li>");
			}
			searchArray.push(gameArray[i]);
			j++;
		}
	}
	//no records handler
	if( j==0 ) $("#autoSuggest").append("<p>Oops! no such game found</p>");

	if (keyword.length == 0) return;
	if (document.getElementById("autoSuggest").style.display == "none" && show) $('#autoSuggest').slideDown();

};


function shuffle(array) {
	//function to shuffle an array
	var currentIndex = array.length,
		temporaryValue, randomIndex;

	while (0 !== currentIndex) {

		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	$("#preloader").fadeOut();
	return array;
}

function gameDisplayer(start, arr) {
	//function to display game in content box
	var target = document.getElementById("game-tile-container");
	var pageNo = Math.floor(start / perPage);
	var name;
	var current = Math.floor(start / perPage) + 1;
	var appender = "";
	var pagination = "";
	//shuffling the array
	shuffle(arr);
	var platform = document.getElementById("platformInp").value;
	if (arr.length == 0) appender = "<p>Oops! No such Games found</p>";
	for (var i = start; i < (start + perPage) && i < arr.length; i++) {
		name = arr[i].title;
		appender += "<li><div class='game-tile'><div class='default-tile-img tile-img'><div class='tile-img-loading'><div class='tile-img' style=\"background-image: url('https://place-hold.it/170x240&text=Game-Cover&bold&fontsize=24')\"><div class='tile-overlay'><button class='btn btn-primary' onclick=\"h_addDB('" + arr[i].url + "');window.open('https://ign.com" + arr[i].url + "')\">Details</button></div>";
		if (arr[i].editors_choice == "Y") appender += "<img title=\"Editor's Choice\" class='editorStar' src='assets/img/starS.png'>";
		appender += "</div></div></div><div class='tile-details'><small title='Genre'>" + arr[i].genre + " &nbsp;</small><h6 title=\"" + name + "\">";
		if (name.length > 15) appender += name.substring(0, 15) + "...";
		else appender += name;
		appender += "</h6><small><span title='Platform'>" + arr[i].platform + "</span><span style='float:right;margin-top:3px' title='Score'>" + arr[i].score + "</span></small></div></div></li>";
	}
	document.getElementById("recordNos").value = arr.length;
	//for pagination
	if (arr.length > perPage) {
		document.getElementById("recordNos").value = perPage;
		if (current > 1) {
			pagination += "<a title='Go to first page'  onclick='gameDisplayer(0,searchArray);'>«</a>";
			pagination += "<a onclick='gameDisplayer(";
			pagination += start > perPage ? eval(start - perPage) : 1;
			pagination += ",searchArray);'>" + eval(current - 1) + "</a>";
		}
		pagination += "<a class='active'>" + current + "</a>";
		if (current + 1 < arr.length / perPage) pagination += "<a onclick='gameDisplayer(" + eval(start + perPage) + ",searchArray);'>" + eval(current + 1) + "</a>";
		pagination += "<a class='active' style='opacity:0;padding:0'></a><a class='active' style='opacity:0;padding:0'></a>";
		if (current + 10 <= arr.length / perPage) pagination += "<a onclick='gameDisplayer(" + eval(start + perPage * 10) + ",searchArray);'>" + eval(current + 10) + "</a>";
		pagination += "<a title='Go to last page' onclick='gameDisplayer(" + eval(arr.length - perPage) + ",searchArray);'>»</a>";
	}
	//appending the resullt
	target.innerHTML = appender;
	document.getElementById("paginationBar").innerHTML = pagination;
}

function compare(a, b) {
	//function for sort
	if (a.score < b.score)
		return 1;
	if (a.score > b.score)
		return -1;
	return 0;
}


//functions for smoothscroll
function currentYPosition() {
	//function to find current Y position
	if (self.pageYOffset) return self.pageYOffset;
	if (document.documentElement && document.documentElement.scrollTop)
		return document.documentElement.scrollTop;
	if (document.body.scrollTop) return document.body.scrollTop;
	return 0;
}

function elmYPosition(eID) {
	//function to find element's Y coordinate
	var elm = document.getElementById(eID);
	var y = elm.offsetTop;
	var node = elm;
	while (node.offsetParent && node.offsetParent != document.body) {
		node = node.offsetParent;
		y += node.offsetTop;
	}
	return y;
}

function smoothScroll(eID) {
	//function to smooth scroll
	var startY = currentYPosition();
	var stopY = elmYPosition(eID);
	var distance = stopY > startY ? stopY - startY : startY - stopY;
	if (distance < 100) {
		scrollTo(0, stopY);
		return;
	}
	var speed = Math.round(distance / 100);
	if (speed >= 20) speed = 20;
	var step = Math.round(distance / 25);
	var leapY = stopY > startY ? startY + step : startY - step;
	var timer = 0;
	if (stopY > startY) {
		for (var i = startY; i < stopY; i += step) {
			setTimeout("window.scrollTo(0, " + leapY + ")", timer * speed);
			leapY += step;
			if (leapY > stopY) leapY = stopY;
			timer++;
		}
		return;
	}
	for (var i = startY; i > stopY; i -= step) {
		setTimeout("window.scrollTo(0, " + leapY + ")", timer * speed);
		leapY -= step;
		if (leapY < stopY) leapY = stopY;
		timer++;
	}
}