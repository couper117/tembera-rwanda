
<link rel="stylesheet" href="assets/css/homes.css">

<body>
    <?php include __DIR__ . '/../include/preloader.php'; ?>
        <?php include __DIR__ . '/../include/nav.php'; ?>

    <div class="parallax-hero">
        <div class="hero-overlay"></div>
        <div class="hero-content reveal">
            <span class="tag-line">Stay in Style</span>
            <h1>Find Your <br><span class="highlight">Home Away From Home</span></h1>
            <p>From luxury hotels to cozy apartments.<br>Experience Rwanda like a local.</p>
            
            <div class="hero-search-bar">
                <div class="search-item">
                    <label>Location</label>
                    <input type="text" placeholder="Kigali, Rwanda">
                </div>
                <div class="search-item">
                    <label>Check in</label>
                    <input type="date">
                </div>
                <div class="search-item">
                    <label>Type</label>
                    <select id="hero-type-select" onchange="filterSelection(this.value)">
                        <option value="all">Any Type</option>
                        <option value="Hotel">Hotels</option>
                        <option value="Apartment">Apartments</option>
                        <option value="Villa">Villas</option>
                    </select>
                </div>
                <button class="btn-search" onclick="document.getElementById('listings-grid').scrollIntoView({behavior: 'smooth'})">
                    <i class="fas fa-search"></i>
                </button>
            </div>
        </div>
    </div>

    <div class="homes-container">
        
        <div class="category-scroll-wrapper">
            <div class="category-tabs">
                <button class="cat-btn active" onclick="filterSelection('all')">
                    <i class="fas fa-th"></i> <span>All</span>
                </button>
                <button class="cat-btn" onclick="filterSelection('Hotel')">
                    <i class="fas fa-hotel"></i> <span>Hotels</span>
                </button>
                <button class="cat-btn" onclick="filterSelection('Apartment')">
                    <i class="fas fa-building"></i> <span>Apartments</span>
                </button>
                <button class="cat-btn" onclick="filterSelection('Villa')">
                    <i class="fas fa-home"></i> <span>Villas</span>
                </button>
                <button class="cat-btn" onclick="filterSelection('Luxury')">
                    <i class="fas fa-gem"></i> <span>Luxe</span>
                </button>
            </div>
        </div>

        <div class="section-header">
            <h2>50+ Places to Stay</h2>
            <p>Top rated listings based on guest reviews.</p>
        </div>

        <div class="listings-grid" id="listings-grid">
            </div>

    </div>

    <div id="stay-modal" class="modal-overlay">
        <div class="modal-card">
            <button class="close-btn" onclick="closeModal()"><i class="fas fa-times"></i></button>
            
            <div class="modal-gallery">
                <img id="modal-img" src="" alt="Stay Image">
                <div class="gallery-badge" id="modal-type">Hotel</div>
            </div>

            <div class="modal-content-scroll">
                <div class="modal-header">
                    <div>
                        <h2 id="modal-title">Luxury Villa</h2>
                        <span class="modal-location"><i class="fas fa-map-marker-alt"></i> <span id="modal-loc">Kigali</span></span>
                    </div>
                    <div class="modal-price-box">
                        <span class="price-big" id="modal-price">$120</span>
                        <span class="price-period">/ night</span>
                    </div>
                </div>

                <div class="rating-row">
                    <i class="fas fa-star text-star"></i> <span id="modal-rating">4.92</span> · <span class="reviews">128 Reviews</span> · <span class="superhost">🏆 Superhost</span>
                </div>

                <hr class="divider">

                <div class="modal-desc">
                    <h3>About this place</h3>
                    <p id="modal-desc">Description...</p>
                </div>

                <div class="amenities-grid">
                    <h3>What this place offers</h3>
                    <div class="amenities-list">
                        <div class="amenity"><i class="fas fa-wifi"></i> Fast Wifi</div>
                        <div class="amenity"><i class="fas fa-swimming-pool"></i> Pool</div>
                        <div class="amenity"><i class="fas fa-parking"></i> Free Parking</div>
                        <div class="amenity"><i class="fas fa-tv"></i> 4K TV</div>
                        <div class="amenity"><i class="fas fa-snowflake"></i> AC</div>
                        <div class="amenity"><i class="fas fa-utensils"></i> Kitchen</div>
                    </div>
                </div>

                <div class="modal-footer">
                    <div class="total-price">
                        <span>Total (3 nights)</span>
                        <strong id="modal-total">$360</strong>
                    </div>
                    <button class="btn-reserve">Reserve</button>
                </div>
            </div>
        </div>
    </div>

    <?php include __DIR__ . '/../include/footer.php'; ?>

    <script>
    // --- 1. DATA GENERATOR ---
    // Instead of writing 50 items manually, we generate them from templates
    const titles = ["Serena Heights", "Kigali View Apt", "The Retreat", "Urban Loft", "Green Hills Villa", "Downtown Suite", "Lake Kivu Resort", "Nyarutarama Home", "Zen Garden", "Skyline Hotel"];
    const types = ["Hotel", "Apartment", "Hotel", "Apartment", "Villa", "Apartment", "Hotel", "Villa", "Apartment", "Hotel"];
    const images = [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", // Hotel
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80", // Apt
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80", // Resort
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80", // Loft
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80", // Villa
    ];

    let listingsData = [];

    // Loop to create 50 Items
    for (let i = 0; i < 50; i++) {
        // Pick random template data
        const tIndex = i % 10; // Cycles through 0-9
        const imgIndex = i % 5; // Cycles through 0-4
        
        // Randomize price and rating slightly
        const price = 50 + Math.floor(Math.random() * 250); // $50 - $300
        const rating = (4.0 + Math.random()).toFixed(2); // 4.00 - 4.99
        
        listingsData.push({
            id: i,
            title: titles[tIndex] + " " + (i + 1), // Adds number to make unique
            type: types[tIndex],
            price: price,
            rating: rating,
            location: "Kigali, Rwanda",
            img: images[imgIndex],
            desc: "Experience world-class service and comfort. Located in the heart of the city, this " + types[tIndex] + " offers stunning views, modern amenities, and easy access to local attractions.",
            isSuperhost: rating > 4.8 // Auto-badge high rated ones
        });
    }

    // --- 2. RENDER FUNCTION ---
    function renderListings(filter = 'all') {
        const grid = document.getElementById('listings-grid');
        grid.innerHTML = '';

        listingsData.forEach(item => {
            // Smart Filter Logic
            let match = false;
            if (filter === 'all') match = true;
            else if (filter === 'Luxury' && item.price > 200) match = true;
            else if (item.type === filter) match = true;

            if (match) {
                const card = document.createElement('div');
                card.className = 'stay-card fade-in';
                
                // HTML for the Card
                card.innerHTML = `
                    <div class="card-img-wrap">
                        <img src="${item.img}" alt="${item.title}">
                        <button class="wishlist-btn"><i class="far fa-heart"></i></button>
                        ${item.isSuperhost ? '<span class="superhost-badge">Guest Favorite</span>' : ''}
                    </div>
                    <div class="card-details">
                        <div class="card-row">
                            <h3 class="card-title">${item.title}</h3>
                            <div class="card-rating"><i class="fas fa-star"></i> ${item.rating}</div>
                        </div>
                        <p class="card-loc text-muted">${item.type} in ${item.location}</p>
                        <p class="card-dates text-muted">Oct 22 - 27</p>
                        <div class="card-price">
                            <strong>$${item.price}</strong> <span class="text-muted">night</span>
                        </div>
                    </div>
                `;
                
                // Click to Open Modal
                card.onclick = (e) => {
                    // Prevent modal opening if clicking the heart button
                    if(!e.target.closest('.wishlist-btn')) {
                        openModal(item);
                    }
                };
                
                grid.appendChild(card);
            }
        });
    }

    // --- 3. FILTER FUNCTION ---
    function filterSelection(category) {
        // Update Buttons UI
        document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
        if(event && event.currentTarget) event.currentTarget.classList.add('active');
        
        renderListings(category);
    }

    // --- 4. MODAL LOGIC ---
    function openModal(item) {
        const modal = document.getElementById('stay-modal');
        document.getElementById('modal-img').src = item.img;
        document.getElementById('modal-type').innerText = item.type;
        document.getElementById('modal-title').innerText = item.title;
        document.getElementById('modal-price').innerText = "$" + item.price;
        document.getElementById('modal-rating').innerText = item.rating;
        document.getElementById('modal-desc').innerText = item.desc;
        document.getElementById('modal-total').innerText = "$" + (item.price * 3); // Fake 3 night calc

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        document.getElementById('stay-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Close on outside click
    window.onclick = function(event) {
        if (event.target == document.getElementById('stay-modal')) {
            closeModal();
        }
    }

    // --- INIT ---
    document.addEventListener('DOMContentLoaded', () => {
        renderListings();
    });
    </script>
</body>