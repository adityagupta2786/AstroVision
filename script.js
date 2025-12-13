
function clearResults() {
    document.getElementById('photoGrid').innerHTML = '';
}
function setStatus(text) {
    document.getElementById('status').innerText = text || '';
}
function openSearch(event) {
    if (event) event.preventDefault();
    document.getElementById("searchControls").style.display = "block";
    document.getElementById("roverControls").style.display = "none";
    document.getElementById("asteroidControls").style.display = "none";

    setStatus("");
    clearResults();

    const input = document.getElementById("searchInput");
    if (input) input.focus();
}
async function searchNASA(query) {
    if (!query) {
        setStatus('Please type a search term (e.g. Saturn).');
        return;
    }

    setStatus('Searching NASA images for "' + query + '" ..');
    clearResults();

    try {
        const encoded = encodeURIComponent(query);
        const url = `https://images-api.nasa.gov/search?q=${encoded}&media_type=image`;

        const res = await fetch(url);
        const data = await res.json();

        const items = data.collection && data.collection.items ? data.collection.items : [];

        if (!items.length) {
            setStatus('No images found for "' + query + '".');
            return;
        }

        setStatus('Found ' + items.length + ' results — showing first 12.');

        const show = items.slice(0, 12);
        const grid = document.getElementById('photoGrid');

        show.forEach(item => {
            if (!item.links || !item.links.length) return;
            const imageUrl = item.links[0].href;
            const title = (item.data && item.data[0] && item.data[0].title) ? item.data[0].title : 'NASA Image';
            const date = (item.data && item.data[0] && item.data[0].date_created) ? item.data[0].date_created : '';

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${imageUrl}" alt="${escapeHtml(title)}">
                <p><b>${escapeHtml(title)}</b></p>
                <p style="font-size:13px;color:#6a5844;">${date}</p>
            `;
            grid.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        setStatus('Error fetching NASA images. See console for details.');
    }
}
function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
}
document.addEventListener('DOMContentLoaded', function () {
    const sBtn = document.getElementById('searchBtn');
    if (sBtn) {
        sBtn.addEventListener('click', function () {
            const q = document.getElementById('searchInput').value.trim();
            searchNASA(q);
        });
    }
    const sInput = document.getElementById('searchInput');
    if (sInput) {
        sInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('searchBtn').click();
            }
        });
    }
    document.querySelectorAll('.tag').forEach(btn => {
        btn.addEventListener('click', function () {
            const q = this.getAttribute('data-q');
            document.getElementById('searchInput').value = q;
            searchNASA(q);
        });
    });
});

function showAsteroids(event) {
    event.preventDefault();

    document.getElementById("status").innerText = "";
    document.getElementById("photoGrid").innerHTML = "";

    document.getElementById("roverControls").style.display = "none";
    document.getElementById("asteroidControls").style.display = "block";
    document.getElementById("searchControls").style.display = "none";
}

async function loadPhotos() {
    const rover = document.getElementById("roverSelect").value;
    const status = document.getElementById("status");
    const grid = document.getElementById("photoGrid");

    document.getElementById("asteroidControls").style.display = "none";
    document.getElementById("roverControls").style.display = "block";

    status.innerText = "Loading photos..";
    grid.innerHTML = "";

    try {
        const response = await fetch(
            `https://images-api.nasa.gov/search?q=${rover}%20rover&media_type=image`
        );
        const result = await response.json();

        const items = result.collection.items;

        if (!items || items.length === 0) {
            status.innerText = "No photos found!";
            return;
        }

        status.innerText = 'Found ' + items.length + ' photos — showing first 12.';

        items.slice(0, 12).forEach(item => {

            if (!item.links || !item.links[0]) return;

            const imageUrl = item.links[0].href;
            const title = item.data[0].title;
            const date = item.data[0].date_created;

            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <img src="${imageUrl}" alt="NASA Image">
                <p><b>${title}</b></p>
                <p>${date}</p>
            `;

            grid.appendChild(card);
        });

    } catch (error) {
        status.innerText = "Error loading photos!";
        console.error(error);
    }
}

async function loadAsteroids() {
    const status = document.getElementById("status");
    const grid = document.getElementById("photoGrid");

    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;

    if (!start || !end) {
        status.innerText = "Please select both start and end dates.";
        return;
    }
    const sDate = new Date(start);
    const eDate = new Date(end);
    const timeDiff = eDate - sDate;
    const days = (timeDiff / (1000 * 60 * 60 * 24)) + 1;
    if (days > 8) {
        status.innerText = "Please choose a date range of 7 days or less.";
        return;
    }

    status.innerText = "Loading asteroid data..";
    grid.innerHTML = "";

    try {
        const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${start}&end_date=${end}&api_key=jhUfGsXj0koS73x7rDujeUmtIG5Cmf023zEBgecy`;
        const response = await fetch(url);
        const data = await response.json();

        const neo = data.near_earth_objects;
        if (!neo) {
            status.innerText = "No data found.";
            return;
        }

        let list = [];
        for (let date in neo) {
            neo[date].forEach(a => {
                a.close_date = date;
                list.push(a);
            });
        }

        status.innerText = 'Found ' + list.length + ' asteroids — showing first 12.';

        list.slice(0, 12).forEach(ast => {
            const name = ast.name;
            const size = ast.estimated_diameter.kilometers.estimated_diameter_max.toFixed(2);
            const speed = ast.close_approach_data[0].relative_velocity.kilometers_per_hour.split(".")[0];
            const miss = ast.close_approach_data[0].miss_distance.kilometers.split(".")[0];
            const hazardous = ast.is_potentially_hazardous_asteroid;

            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <p><b>${name}</b></p>
                <p>🪨 Size: ${size} km</p>
                <p>🚀 Speed: ${speed} km/h</p>
                <p>🌍 Miss Distance: ${miss} km</p>
                <p>📅 Date: ${ast.close_date}</p>
                <p style="color:${hazardous ? 'red' : 'green'};">
                    ${hazardous ? "⚠ Hazardous" : "✔ Safe"}
                </p>
            `;
            grid.appendChild(card);
        });

    } catch (error) {
        status.innerText = "Error loading asteroid data!";
        console.error(error);
    }
}
function goHome(event) {
    event.preventDefault();
    document.getElementById("roverControls").style.display = "block";
    document.getElementById("asteroidControls").style.display = "none";
    document.getElementById("searchControls").style.display = "none";

    document.getElementById("status").innerText = "";
    document.getElementById("photoGrid").innerHTML = "";
}
