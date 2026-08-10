
<link rel="stylesheet" href="assets/css/historic.css">
<style>
    /* --- 1. RESET & FONTS --- */
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;800&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    background-color: #FFFFFF;
    color: #111;
    font-family: 'Montserrat', sans-serif;
    overflow-x: hidden;
}

/* --- 2. HERO SECTION --- */
.parallax-hero {
    height: 70vh;
    background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1544476301-9515da1cb753?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
    background-attachment: fixed;
    background-position: center;
    background-size: cover;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: white;
    margin-top: -80px; /* Pull behind navbar */
    padding-top: 80px;
}

.hero-content h1 { font-size: 3.5rem; margin: 10px 0; font-weight: 800; }
.highlight { color: #00A859; }

/* --- 3. SPOTLIGHT SECTION --- */
.spotlight-section { padding: 60px 0; background: #FAFAFA; }
.section-header { padding: 0 40px; margin-bottom: 20px; }
.section-header h2 { font-size: 2rem; margin-bottom: 5px; }

.spotlight-wrapper {
    display: flex; overflow-x: auto; gap: 20px; padding: 20px 40px 40px 40px;
    scroll-snap-type: x mandatory; scrollbar-width: none;
}
.spotlight-wrapper::-webkit-scrollbar { display: none; }

.spotlight-card {
    flex: 0 0 350px; height: 450px; position: relative;
    border-radius: 20px; overflow: hidden; scroll-snap-align: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); cursor: pointer; transition: transform 0.3s;
}
.spotlight-card:hover { transform: translateY(-5px); }

.spotlight-bg { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
.spotlight-card:hover .spotlight-bg { transform: scale(1.1); }

.spotlight-overlay {
    position: absolute; bottom: 0; left: 0; width: 100%; padding: 30px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent); color: white;
}

.badge {
    background: #00A859; color: white; padding: 5px 12px;
    border-radius: 20px; font-size: 0.75rem; font-weight: bold;
    text-transform: uppercase; display: inline-block; margin-bottom: 10px;
}

/* --- 4. THE GRID --- */
.section-divider { text-align: center; margin: 60px 0 30px; }
.filter-tabs { display: flex; justify-content: center; gap: 10px; margin-top: 20px; }

.tab {
    padding: 10px 25px; border-radius: 30px; border: none; background: #F0F0F0;
    font-weight: 600; cursor: pointer; transition: 0.3s;
}
.tab.active, .tab:hover { background: #111; color: #fff; }

.places-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 30px; max-width: 1400px; margin: 0 auto; padding: 0 40px 80px 40px;
}

/* --- 5. MODAL --- */
.modal-overlay {
    display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px);
    z-index: 10000; justify-content: center; align-items: center; padding: 20px;
}

.modal-card {
    background: #fff; width: 100%; max-width: 1000px; height: 85vh;
    border-radius: 24px; display: flex; overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-visuals { width: 45%; position: relative; background: #f0f0f0; }
.modal-visuals img { width: 100%; height: 100%; object-fit: cover; }
.modal-details { width: 55%; padding: 40px; overflow-y: auto; }

/* Modal Components */
.close-btn {
    position: absolute; top: 20px; left: 20px; width: 40px; height: 40px;
    background: rgba(255, 255, 255, 0.9); border-radius: 50%; border: none;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: 0.2s; z-index: 10;
}
.close-btn:hover { transform: scale(1.1); background: #fff; }

.status-row { display: flex; gap: 10px; margin-bottom: 20px; }
.status-pill {
    padding: 6px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 600;
    display: flex; align-items: center; gap: 6px;
}
.status-pill.open { background: #E6F4EA; color: #1E8E3E; }
.status-pill.location { background: #F1F3F4; color: #5F6368; }

.info-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;
    background: #F9F9F9; padding: 15px; border-radius: 10px;
}
.btn-action {
    background: #111; color: white; text-decoration: none; padding: 15px 25px;
    border-radius: 16px; display: flex; justify-content: space-between;
    align-items: center; transition: 0.3s;
}
.btn-action:hover { background: #00A859; }

@keyframes modalSlideUp {
    from { opacity: 0; transform: translateY(50px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Mobile */
@media (max-width: 768px) {
    .modal-card { flex-direction: column; height: 95vh; overflow-y: scroll; }
    .modal-visuals { width: 100%; height: 250px; flex-shrink: 0; }
    .modal-details { width: 100%; padding: 25px; overflow-y: visible; }
}
</style>
<body>
    <?php include __DIR__ . '/../include/preloader.php'; ?>

    <div class="parallax-hero">
        <div class="hero-content reveal">
            <span class="tag-line">Visit Rwanda</span>
            <h1>Explore Our <br><span class="highlight">Heritage Sites</span></h1>
            <p>Discover museums, palaces, and memorials that shape our nation.<br>Plan your journey today.</p>
        </div>
    </div>

    <div class="rwanda-history-container">
        
        <div class="spotlight-section reveal">
            <div class="section-header">
                <h2>Must-Visit Destinations</h2>
                <p>Top-rated cultural sites chosen by travelers.</p>
            </div>
            
            <div class="spotlight-wrapper">
                <div class="spotlight-card" onclick="openModalById(2)">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3dVglEND80F2pSPiGUhR2sWYnDYE3YQI9Qg&s" class="spotlight-bg">
                    <div class="spotlight-overlay">
                        <span class="badge">Cultural Gem</span>
                        <h3>King's Palace Nyanza</h3>
                    </div>
                </div>
                <div class="spotlight-card" onclick="openModalById(1)">
                    <img src="https://i.assetzen.net/i/j6wGs3oQ8F9T/w:1165/h:480/q:70.jpg" class="spotlight-bg">
                    <div class="spotlight-overlay">
                        <span class="badge">Top Rated</span>
                        <h3>Kigali Memorial</h3>
                    </div>
                </div>
                <div class="spotlight-card" onclick="openModalById(3)">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtVPPx_9JKRP7XUEBektwuKCRBAGnyeGYO5w&s" class="spotlight-bg">
                    <div class="spotlight-overlay">
                        <span class="badge">Best Museum</span>
                        <h3>Ethnographic Museum</h3>
                    </div>
                </div>
                 <div class="spotlight-card" onclick="openModalById(4)">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQw7xCExDEsN-Ux3fUMuhfwYkugmneZDAx7XQ&s" class="spotlight-bg">
                    <div class="spotlight-overlay">
                        <span class="badge">History</span>
                        <h3>Kandt House Museum</h3>
                    </div>
                </div>
            </div>
        </div>

        <div class="section-divider reveal">
            <h2>Find Your Next Stop</h2>
            <div class="filter-tabs">
                <button class="tab active" onclick="filterSelection('all')">Show All</button>
                <button class="tab" onclick="filterSelection('Memorial')">Memorials</button>
                <button class="tab" onclick="filterSelection('Museum')">Museums</button>
            </div>
        </div>

        <div class="places-grid" id="places-grid"></div>

    </div>

    <div id="site-modal" class="modal-overlay">
        <div class="modal-card">
            <div class="modal-visuals">
                <img id="modal-img" src="" alt="Place Image">
                <button class="close-btn" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-badges">
                    <span id="modal-cat-badge" class="badge-blur">Category</span>
                </div>
            </div>
            <div class="modal-details">
                <div class="modal-header-row">
                    <h2 id="modal-title">Location Title</h2>
                    <div class="rating-box">
                        <i class="fas fa-star text-warning"></i> <span>4.8</span>
                    </div>
                </div>
                <div class="status-row">
                    <span class="status-pill open"><i class="fas fa-clock"></i> Open Now</span>
                    <span class="status-pill location"><i class="fas fa-map-pin"></i> <span id="modal-loc">Kigali</span></span>
                </div>
                <hr class="divider">
                <div class="modal-description">
                    <h3>About this place</h3>
                    <p id="modal-desc">Description...</p>
                </div>
                <div class="info-box">
                    <div class="info-row">
                        <div class="icon-box"><i class="fas fa-calendar-alt"></i></div>
                        <div><strong>Opening Hours</strong><p id="modal-hours">8:00 AM - 5:00 PM</p></div>
                    </div>
                </div>
                <div class="map-action-area">
                    <div id="mini-map"></div>
                    <a href="#" id="modal-directions" target="_blank" class="btn-action">
                        <div class="btn-text"><span>Get Directions</span><small>Open in Google Maps</small></div>
                        <div class="btn-icon"><i class="fas fa-location-arrow"></i></div>
                    </a>
                </div>
            </div>
        </div>
    </div>

    <?php include __DIR__ . '/../include/footer.php'; ?>

    <script>
    /* --- DATA --- */
    const placesData = [
        {
            id: 1,
            name: "Kigali Genocide Memorial",
            category: "Memorial",
            desc: "The final resting place for more than 250,000 victims of the Genocide against the Tutsi.",
            hours: "8:00 AM - 4:00 PM (Open Daily)",
            location: "Gisozi, Kigali",
            img: "https://i.assetzen.net/i/j6wGs3oQ8F9T/w:1165/h:480/q:70.jpg",
            lat: -1.9301, lng: 30.0605
        },
        {
            id: 2,
            name: "King's Palace Museum",
            category: "Museum",
            desc: "A reconstruction of the traditional royal residence in Nyanza.",
            hours: "8:00 AM - 6:00 PM",
            location: "Nyanza District",
            img: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/King%27s_Palace%2C_Nyanza%2C_Rwanda.jpg/800px-King%27s_Palace%2C_Nyanza%2C_Rwanda.jpg",
            lat: -2.3567, lng: 29.7495
        },
        {
            id: 3,
            name: "Ethnographic Museum",
            category: "Museum",
            desc: "Houses one of Africa's finest ethnographic collections.",
            hours: "9:00 AM - 6:00 PM",
            location: "Huye (Butare)",
            img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Rwanda_National_Museum.jpg/1024px-Rwanda_National_Museum.jpg",
            lat: -2.5967, lng: 29.7402
        },
        {
            id: 4,
            name: "Kandt House Museum",
            category: "Museum",
            desc: "Discover the colonial history and evolution of Kigali.",
            hours: "8:00 AM - 6:00 PM",
            location: "Kanombe, Kigali",
            img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Kandt_House_Museum_of_Natural_History.jpg/800px-Kandt_House_Museum_of_Natural_History.jpg",
            lat: -1.9753, lng: 30.1730
        },
        {
            id: 5,
            name: "Murambi Memorial",
            category: "Memorial",
            desc: "A powerful memorial located in the Southern Province.",
            hours: "8:00 AM - 5:00 PM",
            location: "Nyamagabe",
            img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Murambi_Genocide_Memorial.jpg/800px-Murambi_Genocide_Memorial.jpg",
            lat: -2.4556, lng: 29.5678
        },
        {
            id: 6,
            name: "Campaign Against Genocide",
            category: "Museum",
            desc: "Located at the Parliament building, depicting the campaign to stop the genocide.",
            hours: "8:00 AM - 5:00 PM",
            location: "Kimihurura, Kigali",
            img: "https://live.staticflickr.com/65535/48598424266_5548657685_b.jpg",
            lat: -1.9536, lng: 30.0965
        }
    ];

    // --- RENDER GRID ---
    function renderCards(filter = 'all') {
        const grid = document.getElementById('places-grid');
        if(!grid) return;
        
        grid.innerHTML = '';
        
        placesData.forEach(place => {
            if (filter === 'all' || place.category === filter) {
                const card = document.createElement('div');
                card.className = 'spotlight-card'; 
                card.style.flex = 'none'; 
                card.style.height = '300px'; 
                
                card.innerHTML = `
                    <img src="${place.img}" alt="${place.name}" class="spotlight-bg">
                    <div class="spotlight-overlay">
                        <span class="badge" style="font-size: 0.7rem;">${place.category}</span>
                        <h3 style="font-size: 1.5rem;">${place.name}</h3>
                    </div>
                `;
                card.onclick = function() { openModal(place); };
                grid.appendChild(card);
            }
        });
    }

    // --- FILTER ---
    function filterSelection(category) {
        const btns = document.querySelectorAll('.tab');
        btns.forEach(btn => btn.classList.remove('active'));
        // Safely add active class
        if(event && event.target) {
            event.target.classList.add('active');
        }
        renderCards(category);
    }

    // --- MODAL ---
    function openModal(place) {
        document.getElementById('modal-img').src = place.img;
        document.getElementById('modal-title').innerText = place.name;
        document.getElementById('modal-desc').innerText = place.desc;
        document.getElementById('modal-cat-badge').innerText = place.category;
        document.getElementById('modal-loc').innerText = place.location;
        document.getElementById('modal-hours').innerText = place.hours;
        
        // Google Maps Link
        const mapLink = "https://www.google.com/maps/search/?api=1&query=" + place.lat + "," + place.lng;
        document.getElementById('modal-directions').href = mapLink;
        
        document.getElementById('site-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // Helper for spotlight cards to open modal by ID
    function openModalById(id) {
        const place = placesData.find(p => p.id === id);
        if(place) openModal(place);
    }

    function closeModal() {
        document.getElementById('site-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    window.onclick = function(event) {
        if (event.target == document.getElementById('site-modal')) {
            closeModal();
        }
    }

    // Init Grid
    document.addEventListener('DOMContentLoaded', () => {
        renderCards();
    });
    </script>
    
    <script async defer src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap"></script>
</body>