// Combined JavaScript file

const apiKey = 'bdfee267b13189b673fb53d11c349486'; // Your actual API key
const apiUrl = `https://api.openweathermap.org/data/2.5/forecast`;
let isCelsius = true;
let searchHistory = [];

// Function to fetch geographical coordinates using the Geocoding API
function getCoordinates(city) {
    console.log(`City being searched: ${city}`);
    const geocodeURL = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`;
    
    return fetch(geocodeURL)
        .then(response => response.json())
        .then(data => {
            console.log('Geocoding API response data:', data);
            if (data.length === 0) {
                throw new Error('City not found');
            }
            const { lat, lon } = data[0];
            console.log('Coordinates extracted:', { lat, lon });
            return { lat, lon };
        })
        .catch(error => {
            console.error('Error fetching coordinates:', error);
            displayErrorMessage('Error fetching coordinates. Please try again.');
        });
}

// Function to fetch weather data using the coordinates
function getWeatherData(lat, lon) {
    console.log('Fetching weather data for coordinates:', { lat, lon });
    const url = `${apiUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Weather API response data:', data);
            return data;
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            displayErrorMessage('Error fetching weather data. Please try again.');
        });
}

// Function to display the current weather conditions
function displayCurrentWeather(data) {
    console.log('Displaying current weather data:', data);
    const weatherInfoDiv = document.getElementById('weather-info');
    const weatherIcon = document.getElementById('weather-icon');

    weatherInfoDiv.innerHTML = '';
    if (data.cod === '404') {
        weatherInfoDiv.innerHTML = `<p>${data.message}</p>`;
    } else {
        const cityName = data.city.name;
        const date = new Date().toLocaleDateString();
        let temperature = data.list[0].main.temp;
        if (!isCelsius) {
            temperature = (temperature * 9 / 5) + 32;
        }
        const temperatureUnit = isCelsius ? '°C' : '°F';
        const humidity = data.list[0].main.humidity;
        const windSpeed = data.list[0].wind.speed;
        const description = data.list[0].weather[0].description;
        const iconCode = data.list[0].weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

     //   weatherIcon.src = iconUrl;
      //  weatherIcon.alt = description;

        weatherInfoDiv.innerHTML = `
            <h3>${cityName} (${date})</h3>
            <img src="${iconUrl}" alt="${description}">
            <p>${Math.round(temperature)}${temperatureUnit}</p>
            <p>Humidity: ${humidity}%</p>
            <p>Wind Speed: ${windSpeed} m/s</p>
            <p>${description}</p>
        `;
    }
}

// Function to display the 5-day weather forecast
function displayForecast(data) {
    console.log('Displaying forecast data:', data);
    const forecastContainer = document.getElementById('forecast-data');
    forecastContainer.innerHTML = ''; // Clear previous content

    const dailyForecasts = getDailyForecasts(data.list);

    dailyForecasts.forEach(forecast => {
        const date = new Date(forecast.date).toLocaleDateString();
        const temperature = isCelsius ? `${Math.round(forecast.temp)}°C` : `${Math.round(forecast.temp * 9 / 5 + 32)}°F`;
        const humidity = `${forecast.humidity}%`;
        const windSpeed = `${forecast.windSpeed} m/s`;
        const description = forecast.description;
        const iconUrl = `https://openweathermap.org/img/wn/${forecast.icon}.png`;

        forecastContainer.innerHTML += `
            <div class="forecast-item">
                <h4>${date}</h4>
                <img src="${iconUrl}" alt="${description}">
                <p>Temperature: ${temperature}</p>
                <p>Humidity: ${humidity}</p>
                <p>Wind Speed: ${windSpeed}</p>
                <p>${description}</p>
            </div>
        `;
    });
}

// Function to process and select daily forecasts
function getDailyForecasts(data) {
    const dailyForecasts = [];
    const days = {};

    data.forEach(item => {
        const date = item.dt_txt.split(' ')[0]; 
        if (!days[date]) {
            days[date] = {
                date: item.dt_txt,
                temp: item.main.temp, 
                humidity: item.main.humidity,
                windSpeed: item.wind.speed,
                description: item.weather[0].description,
                icon: item.weather[0].icon
            };
        } else {
            // Update the daily forecast if a later entry for the same day is found
            if (item.main.temp > days[date].temp) {
                days[date].temp = item.main.temp;
                days[date].humidity = item.main.humidity;
                days[date].windSpeed = item.wind.speed;
                days[date].description = item.weather[0].description;
                days[date].icon = item.weather[0].icon;
            }
        }
    });

    // Convert days object to array 
    for (const key in days) {
        dailyForecasts.push(days[key]);
    }
    // Return only the next 5 days 
    return dailyForecasts.slice(0, 5); 
}

// Function to update and display the search history
function updateSearchHistory(city) {
    searchHistory = JSON.parse(localStorage.getItem('cities')) || [];
    if (!searchHistory.includes(city)) {
        searchHistory.push(city);
        localStorage.setItem('cities', JSON.stringify(searchHistory));
    }
    console.log('Updated search history:', searchHistory);
    displaySearchHistory();
}

// Function to display the search history from localStorage
function displaySearchHistory() {
    const searchHistoryDiv = document.getElementById('search-history');
    searchHistoryDiv.innerHTML = '<h3>Search History</h3>'; // Clear previous content

    searchHistory = JSON.parse(localStorage.getItem('cities')) || [];
    searchHistory.forEach(city => {
        const cityBtn = document.createElement('button');
        cityBtn.textContent = city;
        cityBtn.onclick = () => {
            document.getElementById('cityName').value = city;
            getCoordinates(city)
                .then(({ lat, lon }) => {
                    return getWeatherData(lat, lon);
                })
                .then(data => {
                    displayCurrentWeather(data);
                    displayForecast(data);
                });
        };
        searchHistoryDiv.appendChild(cityBtn);
    });
}

// Function to handle error messages
function displayErrorMessage(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Function to toggle between Celsius and Fahrenheit
function toggleTemperatureUnit() {
    isCelsius = !isCelsius;
    const city = document.getElementById('cityName').value.trim();
    if (city) {
        getCoordinates(city)
            .then(({ lat, lon }) => {
                return getWeatherData(lat, lon);
            })
            .then(data => {
                displayCurrentWeather(data);
                displayForecast(data);
            });
    }
}

// Main application logic
document.getElementById('btn').addEventListener('click', event => {
    event.preventDefault();
    const city = document.getElementById('cityName').value.trim();
    console.log('City submitted:', city); // Debugging line

    if (city) {
        getCoordinates(city)
            .then(({ lat, lon }) => {
                console.log('Coordinates received:', { lat, lon }); // Debugging line
                return getWeatherData(lat, lon);
            })
            .then(data => {
                console.log('Weather data received:', data); // Debugging line
                displayCurrentWeather(data);
                displayForecast(data);
                updateSearchHistory(city);
            })
            .catch(error => {
                console.error('Error during API call:', error);
                displayErrorMessage('Error during API call. Please try again.');
            });

        document.getElementById('cityName').value = ''; // Clear the input field after submission
    }
});

// Event listener to toggle temperature units
//document.getElementById('toggle-temp-unit').addEventListener('click', toggleTemperatureUnit);

// Display the search history when the page loads
document.addEventListener('DOMContentLoaded', displaySearchHistory);
