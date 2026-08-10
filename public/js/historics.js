/* --- 1. REAL RWANDA DATA (With Online Images) --- */
const placesData = [
    {
        id: 1,
        name: "Kigali Genocide Memorial",
        category: "Memorial",
        desc: "The final resting place for more than 250,000 victims of the Genocide against the Tutsi. This site is a place of remembrance and learning.",
        hours: "8:00 AM - 4:00 PM (Open Daily)",
        location: "Gisozi, Kigali",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Kigali_Genocide_Memorial_Centre.jpg/800px-Kigali_Genocide_Memorial_Centre.jpg",
        lat: -1.9301, lng: 30.0605
    },
    {
        id: 2,
        name: "King's Palace Museum",
        category: "Museum",
        desc: "A reconstruction of the traditional royal residence in Nyanza. It highlights the influence of the monarchy and features the 'Inyambo' (royal cows).",
        hours: "8:00 AM - 6:00 PM",
        location: "Nyanza District",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/King%27s_Palace%2C_Nyanza%2C_Rwanda.jpg/800px-King%27s_Palace%2C_Nyanza%2C_Rwanda.jpg",
        lat: -2.3567, lng: 29.7495
    },
    {
        id: 3,
        name: "Campaign Against Genocide Museum",
        category: "Museum",
        desc: "Located at the Parliament building, this museum depicts the military campaign by the RPA to stop the Genocide against the Tutsi in 1994.",
        hours: "8:00 AM - 5:00 PM",
        location: "Kimihurura, Kigali",
        img: "https://live.staticflickr.com/65535/48598424266_5548657685_b.jpg", // Parliament Image
        lat: -1.9536, lng: 30.0965
    },
    {
        id: 4,
        name: "Murambi Genocide Memorial",
        category: "Memorial",
        desc: "A former technical school where approximately 50,000 Tutsi were murdered. It is one of the most graphic memorials serving as evidence.",
        hours: "8:00 AM - 5:00 PM",
        location: "Nyamagabe District",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Murambi_Genocide_Memorial.jpg/800px-Murambi_Genocide_Memorial.jpg",
        lat: -2.4556, lng: 29.5678
    },
    {
        id: 5,
        name: "Ethnographic Museum",
        category: "Museum",
        desc: "Houses one of Africa's finest ethnographic collections, exploring seven centuries of Rwandan history, clothing, and traditional agriculture.",
        hours: "9:00 AM - 6:00 PM",
        location: "Huye (Butare)",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Rwanda_National_Museum.jpg/1024px-Rwanda_National_Museum.jpg",
        lat: -2.5967, lng: 29.7402
    },
    {
        id: 6,
        name: "Nyamata Church Memorial",
        category: "Memorial",
        desc: "A church where 10,000 people sought refuge but were killed. The site displays the clothing of the victims and shrapnel holes.",
        hours: "8:00 AM - 5:00 PM",
        location: "Bugesera District",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Nyamata_Genocide_Memorial.jpg/800px-Nyamata_Genocide_Memorial.jpg",
        lat: -2.1483, lng: 30.0907
    },
    {
        id: 7,
        name: "Rwanda Art Museum",
        category: "Museum",
        desc: "Located in the former Presidential Palace, displaying contemporary Rwandan art and the wreckage of the presidential plane.",
        hours: "8:00 AM - 6:00 PM",
        location: "Kanombe, Kigali",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Kandt_House_Museum_of_Natural_History.jpg/800px-Kandt_House_Museum_of_Natural_History.jpg", // Placeholder for Art Museum (Kandt House)
        lat: -1.9753, lng: 30.1730
    }
];

// --- 2. RENDER CARDS LOGIC ---
const grid = document.getElementById('places-grid');

function renderCards(filter = 'all') {
    grid.innerHTML = '';
    // Fade Out
    grid.style.opacity = '0';
    grid.style.transition = 'opacity 0.3s ease';

    setTimeout(() => {
        placesData.forEach(place => {
            if (filter === 'all' || place.category === filter) {
                const card = document.createElement('div');
                card.className = 'spotlight-card'; // Reusing the nice card style
                card.style.flex = 'none'; // Reset flex for grid
                card.style.height = '300px'; // Slightly smaller for grid

                card.innerHTML = `
                    <img src="${place.img}" alt="${place.name}" class="spotlight-bg">
                    <div class="spotlight-overlay">
                        <span class="badge" style="font-size: 0.7rem;">${place.category}</span>
                        <h3 style="font-size: 1.5rem;">${place.name}</h3>
                    </div>
                `;
                card.addEventListener('click', () => openModal(place));
                grid.appendChild(card);
            }
        });
        // Fade In
        grid.style.opacity = '1';
    }, 200);
}

// --- 3. MODAL & MAPS LOGIC ---
let map;

function openModal(place) {
    const modal = document.getElementById('site-modal');

    // Fill Data
    document.getElementById('modal-img').src = place.img;
    document.getElementById('modal-cat-badge').innerText = place.category;
    document.getElementById('modal-title').innerText = place.name;
    document.getElementById('modal-hours').innerText = place.hours;
    document.getElementById('modal-desc').innerText = place.desc;
    document.getElementById('modal-loc').innerText = place.location;

    // Google Maps Link
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
    document.getElementById('modal-directions').href = googleMapsUrl;

    // Show Modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Initialize Mini Map
    setTimeout(() => {
        if (!map) {
            map = new google.maps.Map(document.getElementById("mini-map"), {
                zoom: 14,
                center: { lat: place.lat, lng: place.lng },
                disableDefaultUI: true
            });
        } else {
            map.setCenter({ lat: place.lat, lng: place.lng });
            map.setZoom(14);
        }
        // Remove old markers if any (simple clear)
        // ideally store marker in var, but for now just add new one
        new google.maps.Marker({
            position: { lat: place.lat, lng: place.lng },
            map: map
        });
    }, 100);
}

function closeModal() {
    document.getElementById('site-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

window.onclick = function (event) {
    if (event.target == document.getElementById('site-modal')) {
        closeModal();
    }
}

// Filter Function
function filterSelection(category) {
    const btns = document.querySelectorAll('.tab');
    btns.forEach(btn => btn.classList.remove('active'));
    // Find the button that was clicked (approximate)
    event.target.classList.add('active');
    renderCards(category);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderCards();
});
// --- PRELOADER LOGIC ---
window.addEventListener("load", function () {
    const preloader = document.getElementById("preloader");

    // Minimal delay so the user actually sees the logo (prevents flickering)
    setTimeout(() => {
        preloader.classList.add("preloader-hidden");

        // Remove it from the DOM entirely after the fade-out animation
        setTimeout(() => {
            preloader.style.display = "none";
        }, 500); // Matches the CSS transition time (0.5s)
    }, 800); // Wait 0.8 seconds before fading out
});