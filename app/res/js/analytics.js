
// declare and run - fn as scope
var fn = function() {

	// jQuery DOM objects
	var authButton;
	var getAccountButton;
	var getDataButton;
	var dataControls;
	var outputDiv;
	var title;

	// constants
	var maxAccounts = 50;
	var showDays = 30;
	var msPerDay = 1000 * 60 * 60 * 24;
	var maxResults = 30;
	var googleTimeFormat = 'yyyy-mm-dd';

	// global vars
	var myService;
	var scope;
	var accounts;

	// Load the Google data JavaScript client library.
	google.load('gdata', '2.x', {
		packages: ['analytics']
		});
	google.load("jquery", "1.5.0");

	// Set the callback function when the library is ready.
	google.setOnLoadCallback(init);

	var log = function (msg) {
			console.log("%s: %o", msg, this);
			return this;
		};

	/**
	 * This is called once the Google Data JavaScript library has been loaded.
	 * It creates a new AnalyticsService object, adds a click handler to the
	 * authentication button and updates the button text depending on the status.
	 */
	function init() {

		authButton = $('#authButton');
		getAccountButton = $('#getAccount');
		getDataButton = $('#getData');
		dataControls = $('#dataControls');
		outputDiv = $('#outputDiv');
		title = $('#title');

		dateFormat.masks.googleTime = 'YYYY-mm-dd'; // usage: now.format('googleTime');


		myService = new google.gdata.analytics.AnalyticsService('gaExportAPI_acctSample_v2.0');
		scope = 'https://www.google.com/analytics/feeds';

		// Add a click handler to the Authentication button.
		authButton.click(function() {
			// Test if the user is not authenticated.
			if (!google.accounts.user.checkLogin(scope)) {
				// Authenticate the user.
				google.accounts.user.login(scope);
			} else {
				// Log the user out.
				google.accounts.user.logout();
				getStatus();
			}
		});
		getStatus();
	}

	/**
	 * Utility method to display the user controls if the user is
	 * logged in. If user is logged in, get Account data and
	 * get Report Data buttons are displayed.
	 */
	function getStatus() {

		getAccountButton.click(getAccountFeed);
		getDataButton.click(getDataFeed);


		if (google.accounts.user.checkLogin(scope)) {
			// we are logged in
			dataControls.show();
			authButton.html('Log out from GA');
			authButton.addClass('light');
			renderAccountFeed();
		} else {
			dataControls.hide();
			authButton.html('Access Google Analytics');
			authButton.removeClass('light');
		}

	}

	function renderAccountFeed() {
		showLoading(dataControls);

		getAccountFeed(function(result) {
			// An array of analytics feed entries.
			var entries = result.feed.getEntries();

			accounts = [];

			// Iterate through the feed entries and add the data as table rows.
			for (var i = 0, entry; entry = entries[i]; ++i) {
				accounts.push({
					accountName: entry.getPropertyValue('ga:AccountName'),
					title: entry.getTitle().getText(),
					profileId: entry.getPropertyValue('ga:ProfileId'),
					tableId: entry.getTableId().getValue()
				});
			}

			renderAccountLinks(accounts);
		});
	}

	/**
	 * Main method to get account data from the API.
	 */
	function getAccountFeed(callback) {
		showLoading(dataControls);
		
		var myFeedUri =
			'https://www.google.com/analytics/feeds/accounts/default?max-results=' + maxAccounts; // TODO: unlimited
		myService.getAccountFeed(myFeedUri, callback, getErrorHandler(dataControls));
	}


	function renderAccountLinks(accounts) {
		dataControls.html('');

		for (var i = 0, entry; entry = accounts[i]; ++i) {
			var a = $('<a href="" class="profile-link">' + entry.title + '</a>');
			a.data('profileId', entry.profileId);
			a.data('title', entry.title);
			a.data('tableId', entry.tableId);

			//var localProfileId = entry.profileId.clone();
			a.click(function(e) {
				// maybe this isn't necessary - how JS closures work anyway? :)
				// renderChartForProfile(localProfileId);
				renderChartForProfile($(this).data('title'), $(this).data('profileId'), $(this).data('tableId'));

				// mark selected
				dataControls.find('a').removeClass('selected');
				$(this).addClass('selected');

				e.preventDefault();
			})

			dataControls.prepend(a);
		}

		return;
	}

	function renderChartForProfile(title, profileId, tableId) {
		showLoading(outputDiv);
		
		getDataFeed(tableId, maxResults, function(result) {
			outputDiv.html('<h2>' + title + '</h2>');

			// An array of Analytics feed entries.
			var entries = result.feed.getEntries();

			outputDiv.append(createTableFromFeedEntries(entries));

			console.log(entries);

			var items = [];
			for (var i = 0, entry; entry = entries[i]; ++i) {
				items.push({
					pageTitle: entry.getValueOf('ga:pageTitle'),
					pagePath: entry.getValueOf('ga:pagePath'),
					pageviews: entry.getValueOf('ga:pageviews')
				});
			}

			var data = [];
			for (var i = 0, item; item = items[i]; ++i) {
				data.push(item.pageviews);
			}
			

			// Create a Highcharts chart
			var series = [{
					name: 'Visits',
					data: data
				}];


			renderChart(outputDiv, 'Visits by date', 'date', 'visits', series, 'visits');

			outputDiv.append(createTable(items));

			/*
			// Create an HTML Table using an array of elements.
			var outputTable = ['<table><tr>',
			'<th>Page Title</th>',
			'<th>Page Path</th>',
			'<th>Pageviews</th></tr>'];

			// Iterate through the feed entries and add the data as table rows.
			for (var i = 0, item; item = items[i]; ++i) {

				// Add a row in the HTML Table array.
				var row = [
					item.pageTitle,
					item.pagePath,
					item.pageviews
				].join('</td><td>');
				outputTable.push('<tr><td>', row, '</td></tr>');
			}
			outputTable.push('</table>');

			// Insert the table into the UI.
			outputDiv.append(outputTable.join(''));
			*/
		});
	}

	function createTableFromFeedEntries(entries) {
		if (entries.length == 0) {
			return $('');
		}

		var getData = function(entries) {
			var d = [];

			for (var i = 0; i < entries.length; i++) {
				
			}
		}

		var data = getData(entries);

		// render table
		var table = $('<table></table>');

		// parse first row for properties
		var th = $('<tr></tr>');
		for (var column in data[0]) {
			th.append('<th>' + column + '</th>');
		}
		table.append(th);

		// rows
		for (var i = 0; i < data.length; i++) {
			var row = data[i];
			// var keys = getKeys(row);
			var tr = $('<tr></tr>');
			for (var column in row) {
				tr.append('<td>' + row[column] + '</td>');
			}
			table.append(tr);
		}

		return table;
	}

	function createTable(data) {
		if (data.length == 0) {
			return $('');
		}

		// render table
		var table = $('<table></table>');

		// parse first row for properties
		var th = $('<tr></tr>');
		for (var column in data[0]) {
			th.append('<th>' + column + '</th>');
		}
		table.append(th);

		// rows
		for (var i = 0; i < data.length; i++) {
			var row = data[i];
			// var keys = getKeys(row);
			var tr = $('<tr></tr>');
			for (var column in row) {
				tr.append('<td>' + row[column] + '</td>');
			}
			table.append(tr);
		}

		return table;
	}

	function renderChart(appendTo, title, axisX, axisY, series, unitName) {

		var id = generateId('chart');
		var chartDiv = $('<div id="' + id + '" style="width: 100%; height: 180px;"></div>');
		appendTo.append(chartDiv);


		var	chart = new Highcharts.Chart({
			chart: {
				renderTo: id,
				defaultSeriesType: 'areaspline' // 'column' // 'areaspline'
			},
			title: {
				text: title
			},
			legend: {
				enabled: false
				/*
				,
				layout: 'vertical',
				align: 'left',
				verticalAlign: 'top',
				x: 150,
				y: 100,
				floating: true,
				borderWidth: 1,
				backgroundColor: '#FFFFFF'
				*/
			},
			xAxis: {
				labels: {
					formatter: function() {
						return this.value; // clean, unformatted number for year
					}
				},
				/*
				categories: [
					'Monday',
					'Tuesday',
					'Wednesday',
					'Thursday',
					'Friday',
					'Saturday',
					'Sunday'
				],*/
				/* plotBands: [{ // visualize the weekend
					from: 4.5,
					to: 6.5,
					color: 'rgba(68, 170, 213, .2)'
				}]*/
				title: {text:axisX}
			},
			yAxis: {
				title: {text: axisY}
			},
			tooltip: {
				formatter: function() {
						return '' + this.x +': '+ this.y +' ' + unitName;
				}
			},
			/*credits: {
				enabled: false
			},*/
			plotOptions: {
				areaspline: {
					fillOpacity: 0.5
				},
				column: {
					pointPadding: 0,
					pointWidth: 600 / showDays,
					shadow: false

				}
			},
			series: series
		});

		return chartDiv;
	}

	/**
	 * Main method to get report data from the Export API.
	 */
	function getDataFeed(profileId, maxResults, callback) {
		var to = new Date();
		var from = to - (msPerDay * showDays);

		var myFeedUri =
			'https://www.google.com/analytics/feeds/data' +
			'?start-date=' + dateFormat(from, googleTimeFormat) +
			'&end-date=' + dateFormat(to, googleTimeFormat) +
			'&dimensions=ga:date' + // ga:pageTitle,ga:pagePath
			'&metrics=ga:visits,ga:pageviews' +
			'&sort=-ga:date' +
			'&max-results=' + maxResults +
			'&ids=' + profileId;

		myService.getDataFeed(myFeedUri, callback, getErrorHandler(outputDiv));
	}


	function formatDate() {

	}

	/**
	 * Alert any errors that come from the API request.
	 * @param {object} e The error object returned by the Analytics API.
	function handleError(e) {
		var error = 'There was an error!\n';
		if (e.cause) {
			error += e.cause.status;
		} else {
			error.message;
		}
		alert(error);
	}
	 */

	function showLoading(where) {
		where.html('<div class="loading"><img src="res/img/ajax-loader.gif" alt="" /> loading ...</div>');
	}

	function getErrorHandler(where) {
		return function(e) {
			var error = 'There was an error!<br />';
			if (e.cause) {
				error += e.cause.status;
			} else {
				error += error.message;
			}
			where.html('<div class="lightError">' + error + '</div>');
		}
	}

	var nextId = 1;

	function generateId(prefix) {
		return prefix + ++nextId;
	}

	function getKeys(obj){
	   var keys = [];
	   for(var key in obj){
		  keys.push(key);
	   }
	   return keys;
	}

}();