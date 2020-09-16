var appId = 'c91544c398fb201869e640762955d4c6';
var cityInputEl = $('#city');
var searchBtnEl = $('#search-btn');
var weatherContainerEl = $('.weather-container');
var cityListEl = $('#search-history-list');
var cities = JSON.parse(localStorage.getItem('cities')) || [];
var virtualSkyEl = $('#virtual-sky');
var virtualSkyUrlBase = 'https://virtualsky.lco.global/embed/index.html?gradient=false&projection=lambert&constellations=true&constellationlabels=true&meteorshowers=true&showstarlabels=true&live=true&az=127.61740917006273'; // &longitude=-119.86286000000001&latitude=34.4326

var getWeatherByCity = function (city, isButtonClick) {
    var weatherUrl = 'https://api.openweathermap.org/data/2.5/forecast?q=' + city + '&units=imperial&appid=' + appId;

    $.get(weatherUrl)
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
        })
        .then(function () {
            if (!isButtonClick) {
                cities.unshift(city);
                cities.length = cities.length > 10 ? 10 : cities.length;
                localStorage.setItem('cities', JSON.stringify(cities));

                createListItems(cities);
            }
        }, function () {
            alert('Could not find city');
        });
};

var getWeatherForCurrentLocation = function () {
    navigator.geolocation.getCurrentPosition(function (pos) {
        console.log(pos);
    });
};

// building weather cards to hold data
var buildWeather = function (forecastData) {
    weatherContainerEl.empty();
    var weatherSectionEl = $('#weather-section');
    weatherSectionEl.removeClass('hide');

    $.each(forecastData, function (i, data) {
        var weatherCardEl = $('<div class="weather-card col s3">');
        weatherContainerEl.append(weatherCardEl);

        var weatherHourEl = $('<h3>').text(moment(data.dt * 1000).format('hA'));
        weatherCardEl.append(weatherHourEl);

        var weatherImg = data.weather[0].icon;
        var weatherImgEl = $('<img>').attr('src', 'http://openweathermap.org/img/wn/' + weatherImg + '@2x.png');
        weatherCardEl.append(weatherImgEl);

        var weatherDescEl = $('<p>').html('<span>' + data.weather[0].description + '</span>');
        weatherCardEl.append(weatherDescEl);

        var tempEl = $('<p>').html('Temp: <span>' + Math.round(data.main.temp) + '&deg;</span>');
        weatherCardEl.append(tempEl);

        var cloudsEl = $('<p>').html('Cloud Cover: <span>' + data.clouds.all + '%</span>');
        weatherCardEl.append(cloudsEl);

        var rainEl = $('<p>').html('Rain: <span>' + Math.round(data.pop * 100) + '%</span>');
        weatherCardEl.append(rainEl);
    })
};

var createListItems = function (cities) {
    cityListEl.empty();

    $.each(cities, function (i, city) {
        var cityEl = $('<li id="search-history-item">');
        cityEl.text(city);
        cityEl.on('click', function () {
                getWeatherByCity(city, true);
                sunAndMoon(city);
        });

        cityListEl.append(cityEl);
    });
};

var sunAndMoon = function (city) {
    var dailyWeatherUrl = 'https://api.openweathermap.org/data/2.5/weather?q=' + city + '&appid=' + appId;
    var moonDate = moment().unix();
    var moonPhaseUrl = 'https://api.farmsense.net/v1/moonphases/?d=' + moonDate;
    var moonContainerEl = $('#moon');
    var sunContainerEl = $('#sun');

    $.get(dailyWeatherUrl)
        .then(function (data) {
            sunContainerEl.empty();
            
            var sunTitleEl = $('<h3>').text("Solar Schedule");
            sunContainerEl.append(sunTitleEl);

            var sunImgEl = $('<img>').attr('src',  './assets/images/sun.png');
            sunContainerEl.append(sunImgEl);

            var sunriseEl = $('<p>').html('Sunrise: <span>' + moment(data.sys.sunrise * 1000).format('LT') + '</span>');
            sunContainerEl.append(sunriseEl);

            var sunsetEl = $('<p>').html('Sunset: <span>' + moment(data.sys.sunset * 1000).format('LT') + '</span>');
            sunContainerEl.append(sunsetEl);

            updateVirtualSky(data.coord);
        });

    $.get(moonPhaseUrl)
        .then(function (data) {
            moonContainerEl.empty();
            var moonTitleEl = $('<h3>').text("Moon Phase");
            moonContainerEl.append(moonTitleEl);

            var moonImg = data[0].Index;
            var moonImgEl = $('<img>').attr('src', './assets/images/moon/' + moonImg + '.png');
            moonContainerEl.append(moonImgEl);

            var moonPhaseEl = $('<p>').text(data[0].Phase);
            moonContainerEl.append(moonPhaseEl);
        });
};

var updateVirtualSky = function(coords) {
    virtualSkyEl.attr('src', virtualSkyUrlBase + '&latitude=' + coords.lat + '&longitude=' + coords.lon);
};

searchBtnEl.on('click', function () {
    var city = cityInputEl.val().trim();
    cityInputEl.val('');

    if (!city) {
        return;
    }

    getWeatherByCity(city);
    sunAndMoon(city);
});

createListItems(cities);