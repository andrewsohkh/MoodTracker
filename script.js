// Save multiple moods per day (array of moods per date)
function saveMood() {
    const mood = document.getElementById("mood").value;
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    // Get existing moods for today, or start a new array
    let moods = [];
    const stored = localStorage.getItem(date);
    if (stored) {
        try {
            moods = JSON.parse(stored);
            if (!Array.isArray(moods)) moods = [];
        } catch {
            moods = [];
        }
    }
    // Add the new mood with time
    moods.push({ mood, time });

    // Save back to localStorage
    localStorage.setItem(date, JSON.stringify(moods));

    // Show a non-intrusive message
    let msg = document.getElementById("saveMsg");
    if (!msg) {
        msg = document.createElement("div");
        msg.id = "saveMsg";
        msg.style.color = "green";
        msg.style.marginTop = "10px";
        document.body.appendChild(msg);
    }
    msg.textContent = "Mood saved!";
    setTimeout(() => { msg.textContent = ""; }, 2000);
}

function getWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=542fa04b5af32e11606c3005e1ffcb90&units=metric`)
                    .then(response => response.json())
                    .then(data => {
                        const weatherDesc = data.weather[0].description;
                        document.getElementById("weather").innerText = `Weather: ${weatherDesc}`;
                        // Suggest activities based on weather
                        let suggestion = "";
                        if (weatherDesc.includes("rain")) {
                            suggestion = "It's rainy! Perfect for reading a book or meditating indoors. 📖☔";
                        } else if (weatherDesc.includes("cloud")) {
                            suggestion = "A bit cloudy today—maybe a relaxing walk would be nice. 🚶‍♂️";
                        } else {
                            suggestion = "Clear and bright! Time for an outdoor adventure. ☀️🌳";
                        }
                        document.getElementById("suggestion").innerText = suggestion;
                    })
                    .catch(error => {
                        document.getElementById("weather").innerText = "Could not fetch weather.";
                        document.getElementById("suggestion").innerText = "";
                        console.error("Error fetching data:", error);
                    });
            },
            function(error) {
                document.getElementById("weather").innerText = "Location permission denied or unavailable.";
                document.getElementById("suggestion").innerText = "";
            }
        );
    } else {
        document.getElementById("weather").innerText = "Geolocation not supported.";
        document.getElementById("suggestion").innerText = "";
    }
}
let moodChartInstance = null;

function generateMoodChart() {
    const moodChartElem = document.getElementById('moodChart');
    if (!moodChartElem) {
        console.error("Element with id 'moodChart' not found.");
        return;
    }
    const ctx = moodChartElem.getContext('2d');
    // Gather all moods (flattened)
    const moodData = Object.keys(localStorage)
        .filter(date => /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date))
        .flatMap(date => {
            try {
                const moods = JSON.parse(localStorage.getItem(date));
                if (Array.isArray(moods)) {
                    return moods.map(entry => ({
                        label: `${date} ${entry.time}`,
                        mood: entry.mood
                    }));
                }
                return [];
            } catch {
                return [];
            }
        })
        .sort((a, b) => {
            // Sort by date and time
            const aDate = new Date(a.label);
            const bDate = new Date(b.label);
            return aDate - bDate;
        });

    if (moodData.length === 0) {
        alert("No mood data found. Please submit some moods first!");
        return;
    }

    const moodLabels = moodData.map(entry => entry.label);
    const moodValues = moodData.map(entry => {
        if (entry.mood === "happy") return 3;
        if (entry.mood === "neutral") return 2;
        if (entry.mood === "stressed") return 1;
        return 0;
    });

    if (moodChartInstance) {
        moodChartInstance.destroy();
    }

    moodChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: moodLabels,
            datasets: [{
                label: 'Mood Trend',
                data: moodValues,
                borderColor: 'blue',
                borderWidth: 2,
                fill: false,
                tension: 0.2,
                pointBackgroundColor: 'blue'
            }]
        },
        options: {
            scales: {
                y: {
                    min: 0,
                    max: 3,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            if (value === 1) return "Stressed";
                            if (value === 2) return "Neutral";
                            if (value === 3) return "Happy";
                            return "";
                        }
                    }
                }
            }
        }
    });
}