
<link rel="stylesheet" href="assets/css/map.css">

<body class="map-page-body">
    <?php include __DIR__ . '/../include/preloader.php'; ?>
    <?php include __DIR__ . '/../include/nav.php'; ?>

    <div class="map-wrapper">
        <aside class="map-sidebar">
            <div class="sidebar-header">
                <span class="tag">Live Explorer</span>
                <h2>Kigali Navigator</h2>
                <div class="status-indicator">
                    <div class="dot"></div> <span id="location-text">Positioning...</span>
                </div>
            </div>

            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="mapSearch" placeholder="Where to?" onkeyup="searchPlaces()">
            </div>

            <div class="view-toggles">
                <button class="view-btn active" onclick="setMapStyle('silver')">Standard</button>
                <button class="view-btn" onclick="setMapStyle('satellite')">Satellite</button>
            </div>

            <div class="quick-filters">
                <button class="filter-chip active" onclick="filterMap('all', this)">All</button>
                <button class="filter-chip" onclick="filterMap('Hotel', this)">Stays</button>
                <button class="filter-chip" onclick="filterMap('History', this)">History</button>
                <button class="filter-chip" onclick="filterMap('Food', this)">Dining</button>
            </div>

            <div class="location-list" id="location-list">
                </div>
            
            <div class="sidebar-footer">
                <button class="btn-primary" onclick="reCenter()">
                    <i class="fas fa-location-arrow"></i> Re-center
                </button>
            </div>
        </aside>

        <div id="map"></div>
    </div>

    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDufwDRwYRQlxg3mT72p5943l6FhvAgFis&callback=initMap&libraries=places" async defer></script>
    
    <script>
        let map, userMarker;
        let markers = [];
        const kigali = { lat: -1.9441, lng: 30.0619 };

        const locations = [
            { id: 1, name: "Kigali Genocide Memorial", lat: -1.9324, lng: 30.0577, type: "History", rating: 4.9, img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Kigali_Genocide_Memorial_Centre.jpg/200px-Kigali_Genocide_Memorial_Centre.jpg" },
            { id: 2, name: "Park Inn by Radisson", lat: -1.9542, lng: 30.0606, type: "Hotel", rating: 4.5, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200" },
            { id: 3, name: "Inzora Rooftop Cafe", lat: -1.9439, lng: 30.0675, type: "Food", rating: 4.8, img: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=200" },
            { id: 4, name: "Question Coffee", lat: -1.9482, lng: 30.0912, type: "Food", rating: 4.9, img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200" }
        ];

        const silverStyle = [
            { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
            { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
            { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
            { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e9e9e9" }] }
        ];

        function initMap() {
            map = new google.maps.Map(document.getElementById("map"), {
                zoom: 14,
                center: kigali,
                styles: silverStyle,
                disableDefaultUI: true,
                zoomControl: true,
            });

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                    userMarker = new google.maps.Marker({
                        position: pos,
                        map: map,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: "#00A859",
                            fillOpacity: 1,
                            strokeColor: "white",
                            strokeWeight: 3
                        }
                    });
                    map.setCenter(pos);
                    document.getElementById('location-text').innerText = "Live";
                });
            }
            renderList('all');
        }

        function setMapStyle(type) {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
            if (type === 'satellite') {
                map.setMapTypeId('hybrid');
                map.setOptions({ styles: [] });
            } else {
                map.setMapTypeId('roadmap');
                map.setOptions({ styles: silverStyle });
            }
        }

        function renderList(filter, searchTerm = "") {
            const list = document.getElementById('location-list');
            list.innerHTML = '';
            markers.forEach(m => m.setMap(null));
            markers = [];

            locations.forEach(loc => {
                const matchesFilter = filter === 'all' || loc.type === filter;
                const matchesSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase());

                if (matchesFilter && matchesSearch) {
                    const marker = new google.maps.Marker({
                        position: { lat: loc.lat, lng: loc.lng },
                        map: map,
                        title: loc.name,
                        animation: google.maps.Animation.DROP
                    });
                    markers.push(marker);

                    const card = document.createElement('div');
                    card.className = 'place-card';
                    card.innerHTML = `
                        <img src="${loc.img}" class="place-thumb">
                        <div class="place-info">
                            <strong>${loc.name}</strong>
                            <small>${loc.type} • ★ ${loc.rating}</small>
                        </div>
                    `;
                    card.onclick = () => {
                        map.panTo({ lat: loc.lat, lng: loc.lng });
                        map.setZoom(17);
                        marker.setAnimation(google.maps.Animation.BOUNCE);
                        setTimeout(() => marker.setAnimation(null), 1500);
                    };
                    list.appendChild(card);
                }
            });
        }

        function filterMap(type, btn) {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            renderList(type, document.getElementById('mapSearch').value);
        }

        function searchPlaces() {
            const activeChip = document.querySelector('.filter-chip.active').innerText;
            const filterMap = { 'Stays': 'Hotel', 'Dining': 'Food', 'History': 'History', 'All': 'all' };
            renderList(filterMap[activeChip] || 'all', document.getElementById('mapSearch').value);
        }

        function reCenter() {
            if (userMarker) map.panTo(userMarker.getPosition());
            else map.panTo(kigali);
        }
    </script>
</body>