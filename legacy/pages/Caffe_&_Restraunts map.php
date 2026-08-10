<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Visit Rwanda - Explore Kigali</title>
    
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --cream: #E9E5D9;
            --olive: #606C38;
            --dark-forest: #283618;
            --primary: var(--olive);
            --dark: #1D1C1C;
            --bg: var(--cream);
        }

        * { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; height: 100%; font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); overflow: hidden; }

        .app-container { display: flex; height: 100vh; width: 100vw; position: relative; }

        /* --- SIDEBAR --- */
        .top-section {
            width: 380px; height: 100vh; background: white; display: flex; flex-direction: column; z-index: 1500;
            box-shadow: 8px 0 30px rgba(0,0,0,0.05); transition: transform 0.5s cubic-bezier(0.65, 0, 0.35, 1), width 0.5s;
            flex-shrink: 0;
        }
        .sidebar-hidden .top-section { transform: translateX(-100%); width: 0; }

        #sidebarToggle {
            position: absolute; left: 380px; top: 20px; z-index: 3000;
            background: white; border: 1px solid #eee; border-radius: 0 10px 10px 0;
            padding: 15px 10px; cursor: pointer; box-shadow: 4px 0 10px rgba(0,0,0,0.1);
            transition: left 0.5s cubic-bezier(0.65, 0, 0.35, 1); font-weight: 800; color: var(--olive);
        }
        .sidebar-hidden #sidebarToggle { left: 0; }

        /* --- MAP --- */
        #map { flex: 1; height: 100%; z-index: 1; }

        /* --- INSTRUCTION PANEL --- */
        .instruction-panel {
            position: absolute; top: 20px; right: 20px; width: 320px; 
            background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px);
            z-index: 2000; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            display: none; flex-direction: column; border: 1px solid rgba(0,0,0,0.05);
        }
        .instruction-panel.active { display: flex; }
        .instruction-panel.minimized { height: 75px; overflow: hidden; }

        .instr-header { padding: 15px 20px; background: #fff; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
        .instr-destination { font-weight: 800; font-size: 1rem; color: var(--dark); }
        .instr-stats { font-size: 0.8rem; color: var(--olive); font-weight: 700; }
        .instr-steps { max-height: 300px; overflow-y: auto; background: #fff; }
        
        .step-item { display: flex; align-items: center; padding: 12px 20px; border-bottom: 1px solid #f9f9f9; font-size: 0.85rem; }
        .step-icon { width: 25px; color: var(--olive); }

        .panel-btns { display: flex; border-top: 1px solid #eee; }
        .panel-btns button { flex: 1; padding: 12px; border: none; background: #fff; font-size: 0.75rem; font-weight: 800; color: #888; cursor: pointer; }

        /* --- CARDS & SCROLLING --- */
        .pro-card { background: white; border-radius: 18px; display: flex; overflow: hidden; margin: 10px 20px; border: 1px solid #eee; cursor: pointer; transition: 0.2s; }
        .pro-card:hover { border-color: var(--olive); transform: scale(1.02); }
        .card-img { width: 85px; height: 85px; object-fit: cover; }
        .card-content { padding: 12px; flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .card-content h4 { margin: 0 0 5px; font-size: 0.95rem; color: var(--dark-forest); }
        .btn-directions { background: var(--olive); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 800; font-size: 0.7rem; width: fit-content; }

        .load-more-btn {
            margin: 20px; padding: 15px; background: #f8f9fa; border: 2px dashed #ddd;
            border-radius: 15px; color: #888; font-weight: 700; cursor: pointer; text-align: center; transition: 0.3s;
        }
        .load-more-btn:hover { background: var(--olive); color: white; border-color: var(--olive); }

        .leaflet-routing-container { display: none !important; }
    </style>
</head>
<body>

<div class="app-container" id="mainApp">
    <button id="sidebarToggle" onclick="toggleSidebar()">◀</button>

    <div class="top-section" id="list-section">
        <div style="padding: 25px;">
            <div style="background: #F1F2F6; padding: 14px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #999; font-size: 0.9rem;">🔍 Explore Kigali</span>
                <span style="color: var(--olive); font-weight: 800; cursor: pointer; font-size: 0.8rem;" onclick="locateUser()">📍 NEARBY</span>
            </div>
        </div>
        <div id="place-list" style="overflow-y: auto; flex: 1;">
            </div>
        <div class="load-more-btn" id="loadMore" onclick="loadMorePlaces()">+ SHOW MORE PLACES</div>
    </div>
    
    <div id="map"></div>

    <div class="instruction-panel" id="instrPanel">
        <div class="instr-header">
            <div>
                <span class="instr-destination" id="destName">Route</span>
                <div class="instr-stats" id="routeStats">Calculating...</div>
            </div>
            <button onclick="toggleMinimize()" style="background:none; border:none; cursor:pointer;">▼</button>
        </div>
        <div class="instr-steps" id="instrSteps"></div>
        <div class="panel-btns">
            <button onclick="toggleMinimize()" id="minBtnText">MINIMIZE</button>
            <button style="color:#e74c3c" onclick="closeGuidance()">CLOSE</button>
        </div>
    </div>
</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>

<script>
    // Expanded Location Database
    const allLocations = [
        { name: "Inzora Rooftop", lat: -1.9439, lng: 30.0675, img: "https://images.unsplash.com/photo-1511920170033-f8396924c348" },
        { name: "Question Coffee", lat: -1.9482, lng: 30.0912, img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085" },
        { name: "Heaven Garden", lat: -1.9445, lng: 30.0594, img: "https://images.unsplash.com/photo-1559339352-11d035aa65de" },
        { name: "Rubia Roasters", lat: -1.9515, lng: 30.0824, img: "https://images.unsplash.com/photo-1442512595331-e89e73853f31" },
        { name: "Repub Lounge", lat: -1.9501, lng: 30.0622, img: "https://images.unsplash.com/photo-1552566626-52f8b828add9" },
        { name: "The Bistro", lat: -1.9455, lng: 30.0611, img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4" },
        { name: "Kigali Heights", lat: -1.9447, lng: 30.0892, img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab" },
        { name: "Pili Pili", lat: -1.9322, lng: 30.1245, img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836" },
        { name: "Choose Kigali", lat: -1.9392, lng: 30.0543, img: "https://images.unsplash.com/photo-1574096079513-d8259312b785" },
        { name: "Bamboo Rooftop", lat: -1.9441, lng: 30.0619, img: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7" }
    ];

    let displayedCount = 4;
    const map = L.map('map', { zoomControl: false }).setView([-1.9441, 30.0619], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

    let userPos = null;
    let router = null;

    function toggleSidebar() {
        const app = document.getElementById('mainApp');
        app.classList.toggle('sidebar-hidden');
        const btn = document.getElementById('sidebarToggle');
        btn.innerText = app.classList.contains('sidebar-hidden') ? "▶" : "◀";
        setTimeout(() => map.invalidateSize(), 500);
    }

    function locateUser() {
        navigator.geolocation.getCurrentPosition(pos => {
            userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            L.circle([userPos.lat, userPos.lng], { radius: 100, color: '#606C38' }).addTo(map);
            map.setView([userPos.lat, userPos.lng], 15);
            renderCards();
        });
    }

    function renderCards() {
        const list = document.getElementById('place-list');
        list.innerHTML = "";
        const toShow = allLocations.slice(0, displayedCount);
        
        toShow.forEach(loc => {
            L.marker([loc.lat, loc.lng]).addTo(map);
            const card = document.createElement('div');
            card.className = 'pro-card';
            card.onclick = () => startRoute(loc.name, loc.lat, loc.lng);
            card.innerHTML = `
                <img src="${loc.img}?w=200" class="card-img">
                <div class="card-content">
                    <h4>${loc.name}</h4>
                    <button class="btn-directions">DIRECTIONS</button>
                </div>`;
            list.appendChild(card);
        });

        if (displayedCount >= allLocations.length) {
            document.getElementById('loadMore').style.display = 'none';
        }
    }

    function loadMorePlaces() {
        displayedCount += 3;
        renderCards();
    }

    function startRoute(name, lat, lng) {
        if(!userPos) return alert("Please enable GPS first.");
        if(router) map.removeControl(router);
        
        router = L.Routing.control({
            waypoints: [L.latLng(userPos.lat, userPos.lng), L.latLng(lat, lng)],
            lineOptions: { styles: [{ color: '#606C38', weight: 6 }] },
            createMarker: () => null
        }).addTo(map);

        router.on('routesfound', function(e) {
            const routes = e.routes[0];
            document.getElementById('instrPanel').classList.add('active');
            document.getElementById('destName').innerText = name;
            document.getElementById('routeStats').innerText = `${(routes.summary.totalDistance/1000).toFixed(1)} km • ${Math.round(routes.summary.totalTime/60)} min`;
            
            const stepBox = document.getElementById('instrSteps');
            stepBox.innerHTML = "";
            routes.instructions.forEach(instr => {
                stepBox.innerHTML += `
                    <div class="step-item">
                        <div class="step-icon">○</div>
                        <div class="step-text">${instr.text}</div>
                        <div class="step-dist">${Math.round(instr.distance)}m</div>
                    </div>`;
            });
        });
    }

    function toggleMinimize() {
        const panel = document.getElementById('instrPanel');
        panel.classList.toggle('minimized');
        document.getElementById('minBtnText').innerText = panel.classList.contains('minimized') ? "EXPAND" : "MINIMIZE";
    }

    function closeGuidance() {
        document.getElementById('instrPanel').classList.remove('active');
        if(router) map.removeControl(router);
    }

    window.onload = locateUser;
</script>
</body>
</html>