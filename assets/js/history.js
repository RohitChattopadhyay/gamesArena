var maxGenre;
var results = new Array();
//Global Variables

function h_addDB(d) {
	//checking indexedDB
	var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
	if(!indexedDB) { alert('Unsupported browser, please update or use some other browser'); }
	var open = indexedDB.open("gamesDB", version);

	open.onsuccess = function () {
		// Start a new transaction
		var db = open.result;
		var tx = db.transaction("history", "readwrite");
		var store = tx.objectStore("history");
		for (var i = 0; i < sortedArray.length; i++) {
			if (sortedArray[i].url.toString().toUpperCase().indexOf(d.toString().toUpperCase()) != -1) {
				store.put(sortedArray[i]);
				i = sortedArray.length;
			}
		}
		tx.oncomplete = function () {
			db.close();
		};
	};
	open.onerror = function (e) {
		console.log(e);
	};
}

function h_recoDB() {
	//function to check most viewed genre from history in DB
	var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
	var open = indexedDB.open("gamesDB", version);

	var genreArray = new Array();
	open.onsuccess = function () {
		// Start a new transaction
		var db = open.result;
		var tx = db.transaction("history", "readwrite");
		var store = tx.objectStore("history");
		var index;
		var max = 0;
		var request = store.openCursor();
		request.onsuccess = function (event) {
			var cursor = event.target.result;
			//Checking maximum
			if (cursor) {
				index = cursor.value.genre;
				if (!results[index]) results[index] = 1;
				else results[index]++;
				if (genreArray.indexOf(index) < 0) {
					//storing in array
					genreArray.push(index);
				}
				cursor.continue();
			} else {
				for (var i = 0; i < genreArray.length; i++) {
					if (results[genreArray[i]] > max) {
						max = results[genreArray[i]];
						maxGenre = genreArray[i];
					}
				}
				if (max == 0) maxGenre = "Action";
				//function to display records in recommended feed
				reccoDisplay(maxGenre);
			}
		};
	};
	open.onerror = function (e) {
		console.log(e);
	};
}

function reccoDisplay(genre) {
	//function to display details in recommended field
	var appender, name, i;
	for (i = 0; i < searchArray.length; i++) {
		//Searching in array for genre
		if (searchArray[i].genre.toString().indexOf(genre) != -1 && searchArray[i].score > 8) {
			name = searchArray[i].title;
			appender = "";
			appender += "<li><div class='game-tile'><div class='default-tile-img tile-img'><div class='tile-img-loading'><div class='tile-img' style=\"background-image: url('https://place-hold.it/170x240&text=Game-Cover&bold&fontsize=24')\"><div class='tile-overlay'><button class='btn btn-primary' onclick=\"h_addDB('" + searchArray[i].url + "');window.open('https://ign.com" + searchArray[i].url + "')\">Details</button></div>";
			if (searchArray[i].editors_choice == "Y") appender += "<img title=\"Editor's Choice\" class='editorStar' src='assets/img/starS.png'>";
			appender += "</div></div></div><div class='tile-details'><small title='Genre'>" + searchArray[i].genre + " </small><h6 title=\"" + name + "\">";
			if (name.length > 15) appender += name.substring(0, 15) + "...";
			else appender += name;
			appender += "</h6><small><span title='Platform'>" + searchArray[i].platform + "</span><span style='float:right;margin-top:3px' title='Score'>" + searchArray[i].score + "</span></small></div></div></li>";
			document.getElementById('reco-tile-container').innerHTML = appender;
			//displaing in recommended feed
			recentDisplay();
			return;
		};
	}
}

function recentDisplay() {
	//function to display in recent feed
	var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
	var open = indexedDB.open("gamesDB", version);

	open.onsuccess = function () {
		// Start a new transaction
		var db = open.result;
		var tx = db.transaction("history", "readwrite");
		var store = tx.objectStore("history");
		var request = store.openCursor(null, 'prevunique');
		var appender = "";
		var i = 0;
		//6 records will be displayed
		request.onsuccess = function (event) {
			var cursor = event.target.result;
			if (cursor) {
				if (i < 6) {
					var name = cursor.value.title;
					appender += "<li><div class='game-tile'><div class='default-tile-img tile-img'><div class='tile-img-loading'><div class='tile-img' style=\"background-image: url('https://place-hold.it/170x240&text=Game-Cover&bold&fontsize=24')\"><div class='tile-overlay'><button class='btn btn-primary' onclick=\"h_addDB('" + cursor.value.url + "');window.open('https://ign.com" + cursor.value.url + "')\">Details</button></div>";
					if (cursor.value.editors_choice == "Y") appender += "<img title=\"Editor's Choice\" class='editorStar' src='assets/img/starS.png'>";
					appender += "</div></div></div><div class='tile-details'><h6 title=\"" + name + "\">";
					if (name.length > 15) appender += name.substring(0, 15) + "...";
					else appender += name;
					appender += "</h6></div></div></li>";
					i++;
				}
				//else if (i>10) cursor.delete();
				cursor.continue();
			}
			//appending the feed
			if (i==0) document.getElementById('recentTitle').innerHTML = "";
			document.getElementById('recent-tile-container').innerHTML = appender;
		};
	};
	open.onerror = function (e) {
		//Error handling
		console.log("Error: " + e.target.errorcode);
	};
}

function sortDisplayer(start, arr, sort) {
	//function to display sorted ressults
	var target = document.getElementById("game-tile-container");
	var pageNo = Math.floor(start / perPage);
	var name;
	var current = Math.floor(start / perPage) + 1;
	var appender = "";
	var pagination = "";
	arr = searchArray;
	//sorting array
	arr.sort(compare);
	//in case result is zero
	if (arr.length == 0) appender = "<p>Oops! No such Games found</p>";
	if (!sort) {
		$('#dsc_sign').slideUp(function () {
			$('#asc_sign').slideDown()
		});
		for (var i = start; i < (start + perPage) && i < arr.length; i++) {
			name = arr[i].title;
			appender += "<li><div class='game-tile'><div class='default-tile-img tile-img'><div class='tile-img-loading'><div class='tile-img' style=\"background-image: url('https://place-hold.it/170x240&text=Game-Cover&bold&fontsize=24')\"><div class='tile-overlay'><button class='btn btn-primary' onclick=\"h_addDB('" + arr[i].url + "');window.open('https://ign.com" + arr[i].url + "')\">Details</button></div>";
			if (arr[i].editors_choice == "Y") appender += "<img title=\"Editor's Choice\" class='editorStar' src='assets/img/starS.png'>";
			appender += "</div></div></div><div class='tile-details'><small title='Genre'>" + arr[i].genre + " &nbsp;</small><h6 title=\"" + name + "\">";
			if (name.length > 15) appender += name.substring(0, 15) + "...";
			else appender += name;
			appender += "</h6><small><span title='Platform'>" + arr[i].platform + "</span><span style='float:right;margin-top:3px' title='Score'>" + arr[i].score + "</span></small></div></div></li>";
		}
	} else {
		$('#asc_sign').slideUp(function () {
			$('#dsc_sign').slideDown()
		});
		for (var i = start; i < (start + perPage) && i < arr.length; i++) {
			i++;
			name = arr[arr.length - i].title;
			appender += "<li><div class='game-tile'><div class='default-tile-img tile-img'><div class='tile-img-loading'><div class='tile-img' style=\"background-image: url('https://place-hold.it/170x240&text=Game-Cover&bold&fontsize=24')\"><div class='tile-overlay'><button class='btn btn-primary' onclick=\"h_addDB('" + arr[arr.length - i].url + "');window.open('https://ign.com" + arr[arr.length - i].url + "')\">Details</button></div>";
			if (arr[arr.length - i].editors_choice == "Y") appender += "<img title=\"Editor's Choice\" class='editorStar' src='assets/img/starS.png'>";
			appender += "</div></div></div><div class='tile-details'><small title='Genre'>" + arr[arr.length - i].genre + " &nbsp;</small><h6 title=\"" + name + "\">";
			if (name.length > 15) appender += name.substring(0, 15) + "...";
			else appender += name;
			appender += "</h6><small><span title='Platform'>" + arr[arr.length - i].platform + "</span><span style='float:right;margin-top:3px' title='Score'>" + arr[arr.length - i].score + "</span></small></div></div></li>";
			i--;
		}
	}
	//apending data
	document.getElementById("recordNos").value = perPage;
	if (arr.length > perPage) {
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
	target.innerHTML = appender;
	document.getElementById("paginationBar").innerHTML = pagination;
	//appended data
}