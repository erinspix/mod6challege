// Combined JavaScript file

// API handling
const apiUrl = `https://api.openweathermap.org/data/2.5/forecast`;
const apiKey = `da1a0a1cd5ef1413573ed8e0ae798a03`; // Your actual API key

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
        });
}

// Utility functions

// Function to display the current weather conditions
function displayCurrentWeather(data) {
    console.log('Displaying current weather data:', data);
    const l = document.getElementById('l');
    const temp = document.getElementById('temp');
    const winddd = document.getElementById('wind');
    const h = document.getElementById('h');

    // Clear previous content if needed
    l.textContent = '';
    temp.textContent = '';
    winddd.textContent = '';
    h.textContent = '';

    // Extract city name and current date
    const city = data.city.name;
    const date = new Date().toLocaleDateString();

    l.append(city, ` `, date);

    // Extract current weather data
    const currentWeather = data.list[0]; // Assuming the first item is the current weather
    temp.textContent = `Temperature: ${currentWeather.main.temp} °C`;
    winddd.textContent = `Wind Speed: ${currentWeather.wind.speed} m/s`;
    h.textContent = `Humidity: ${currentWeather.main.humidity}%`;
}

// Function to display the 5-day weather forecast
function displayForecast(data) {
    console.log('Displaying forecast data:', data);
    const forecastContainer = document.getElementById('forecast');

    // Clear any existing forecast data
    forecastContainer.innerHTML = '<h2>5-Day Forecast</h2>';

    // Group weather data by date
    const weatherList = data.list;
    const groupedByDate = {};

    weatherList.forEach(item => {
        const timestamp = item.dt;
        const date = new Date(timestamp * 1000).toISOString().split('T')[0];

        if (!groupedByDate[date]) {
            groupedByDate[date] = [];
        }

        groupedByDate[date].push(item);
    });

    // Display each day's weather
    for (const date in groupedByDate) {
        if (groupedByDate.hasOwnProperty(date)) {
            const items = groupedByDate[date];

            // Display the first weather entry for the day
            const item = items[0];
            const temp = item.main.temp;
            const humidity = item.main.humidity;
            const wind = item.wind.speed;

            const dayForecast = document.createElement('div');
            dayForecast.classList.add('forecast-day');
            dayForecast.innerHTML = `
                <h3>${date}</h3>
                <p>Temperature: ${temp} °C</p>
                <p>Humidity: ${humidity}%</p>
                <p>Wind Speed: ${wind} m/s</p>
            `;
            forecastContainer.appendChild(dayForecast);
        }
    }
}

// Function to update and display the search history
function updateSearchHistory(city) {
    let cities = JSON.parse(localStorage.getItem('cities')) || [];
    if (!cities.includes(city)) {
        cities.push(city);
        localStorage.setItem('cities', JSON.stringify(cities));
    }
    console.log('Updated search history:', cities);
    displaySearchHistory();
}

// Function to display the search history from localStorage
function displaySearchHistory() {
    const pastCities = document.getElementById('pastCities');
    pastCities.innerHTML = ''; // Clear previous content

    const cities = JSON.parse(localStorage.getItem('cities')) || [];
    console.log('Displaying search history:', cities);
    cities.forEach(city => {
        const cityBtn = document.createElement('button');
        cityBtn.textContent = city;
        cityBtn.addEventListener('click', () => {
            getCoordinates(city)
                .then(({ lat, lon }) => {
                    getWeatherData(lat, lon)
                        .then(data => {
                            displayCurrentWeather(data);
                            displayForecast(data);
                        });
                });
        });
        pastCities.appendChild(cityBtn);
    });
}

// Main application logic

// Select the form element
const searchBtn = document.getElementById('btn');
const cityNameInput = document.getElementById('cityName');

// Event listener for the form submission
searchBtn.addEventListener('click', event => {
    event.preventDefault();
    const city = cityNameInput.value.trim();
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
            });

        cityNameInput.value = ''; // Clear the input field after submission
    }
});

// Display the search history when the page loads
displaySearchHistory();
