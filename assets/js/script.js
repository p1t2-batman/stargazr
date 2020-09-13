var appId = 'c91544c398fb201869e640762955d4c6'
var cityInputEl = $('#city');
var searchBtnEl = $('#search-btn');
var weatherContainerEl = $('#weather-container');

var getWeatherByCity = function (city) {
    var weatherUrl = 'http://api.openweathermap.org/data/2.5/forecast?q=' + city + '&units=imperial&appid=' + appId;

    return $.get(weatherUrl);
};

var getWeatherForCurrentLocation = function () {
    navigator.geolocation.getCurrentPosition(function (pos) {
        console.log(pos);
    });
};

var buildWeather = function (forecastData) {
    weatherContainerEl.empty();
    var weatherSectionEl = $('#weather-section');
    weatherSectionEl.removeClass('hide');

    $.each(forecastData, function(i, data) {

        var weatherCardEl = $('<div class="weather-card">');
        weatherContainerEl.append(weatherCardEl);

        var weatherHourEl = $('<h4>').text(moment(data.dt * 1000).format('hA'));
        weatherCardEl.append(weatherHourEl);

        var tempEl = $('<p>').html('Temp: ' + Math.round(data.main.temp) + '&deg;');
        weatherCardEl.append(tempEl);

        var cloudsEl = $('<p>').text('Cloudiness: ' + data.clouds.all +'%');
        weatherCardEl.append(cloudsEl);

        var rainEl = $('<p>').text('Rain: ' + data.pop + '%');
        weatherCardEl.append(rainEl);
    })
};

searchBtnEl.on('click', function () {
    var city = cityInputEl.val().trim();
    getWeatherByCity(city)
        .then(function (data) {
            // set start of window
            var start = moment().minutes(0).seconds(0);

            if (start.hour() >= 6) {
                start.hour(18);
            }

            // adjust start of window for UTC offset
            start = start.utc();
            start.hour(Math.round(start.hour() / 3) * 3)
            start = start.unix();

            // set end of window
            var end = moment().minutes(0).seconds(0);

            if (end.hour() < 6) {
                end.hour(6);
            } else {
                end.hour(6).add(1, 'd');
            }

            // adjust end of window for UTC offset
            end = end.utc();
            end.hour(Math.round(end.hour() / 3) * 3)
            end = end.unix();

            data.list = data.list.filter(function (d) {
                var dt = moment(d.dt * 1000).unix();
                return dt >= start && dt <= end;
            });

            buildWeather(data.list);
        });
});

// var createSkyMap = function() {
//     var skyMapEl = $('<iframe src="https://virtualsky.lco.global/embed/index.html?longitude="' + longitude + '"&latitude="'  + latitude + '"&projection=polar">');
//     skyMapContainer.append(skyMapEl);
// };