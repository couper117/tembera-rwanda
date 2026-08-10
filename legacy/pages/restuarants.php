
<style>
    /* --- UNIFIED THEME (Olive & Cream) --- */
    :root {
        --cream: #E9E5D9;
        --olive: #606C38;
        --dark-forest: #283618;
        --black-matte: #1D1C1C;
        --transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    }

    body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--cream); color: var(--black-matte); overflow-x: hidden; }

    /* --- HERO SECTION --- */
    .hero { position: relative; height: 85vh; background: var(--black-matte); overflow: hidden; }
    
    .corner-nearby-btn {
        position: absolute; top: 120px; right: 30px; z-index: 100;
        background: var(--olive); color: var(--cream); padding: 12px 24px; border-radius: 50px;
        text-decoration: none; font-weight: 800; font-size: 0.85rem;
        display: flex; align-items: center; gap: 8px; transition: var(--transition);
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    }
    .corner-nearby-btn:hover { background: var(--dark-forest); transform: translateY(-3px); }

    .slide {
        position: absolute; inset: 0; opacity: 0; 
        transition: opacity 1.5s ease-in-out, transform 3s ease;
        background-size: cover; background-position: center;
        display: flex; align-items: center; padding: 0 10%;
        transform: scale(1.1);
    }
    .slide.active { opacity: 1; transform: scale(1); z-index: 1; }
    /* Dark overlay for readability */
    .slide::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.2)); }

    .content { position: relative; z-index: 10; color: #fff; max-width: 700px; }
    .content h1 { font-size: clamp(2.5rem, 8vw, 4.5rem); font-weight: 800; line-height: 1.1; margin-bottom: 20px; text-shadow: 0 4px 10px rgba(0,0,0,0.3); }
    
    .route-trigger {
        background: var(--olive); color: white; border: none;
        padding: 16px 35px; border-radius: 50px; font-weight: 800;
        cursor: pointer; display: inline-flex; align-items: center; gap: 10px;
        transition: var(--transition); text-decoration: none;
    }
    .route-trigger:hover { background: white; color: var(--dark-forest); transform: translateY(-3px); }

    /* --- GRID SECTION --- */
    /* .container { max-width: 1250px; margin: 80px auto; padding: 0 25px; } */
    
    .section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
    .section-header h2 { font-size: 2.5rem; font-weight: 800; color: var(--dark-forest); margin: 0; }
    .section-header p { color: var(--olive); font-weight: 800; letter-spacing: 2px; margin-bottom: 5px; font-size: 0.9rem; }

    .toggle-btn {
        background: transparent; border: 2px solid var(--olive); color: var(--olive);
        padding: 10px 25px; border-radius: 50px; font-weight: 800;
        cursor: pointer; transition: var(--transition);
    }
    .toggle-btn:hover { background: var(--olive); color: white; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
    
    .card { 
        background: white; border-radius: 24px; overflow: hidden; 
        cursor: pointer; transition: var(--transition); 
        box-shadow: 0 10px 30px rgba(0,0,0,0.03);
        display: none; opacity: 0; transform: translateY(30px);
        border: 1px solid rgba(0,0,0,0.05);
    }
    .card.visible { display: block; }
    .card.reveal { opacity: 1; transform: translateY(0); }
    
    .card:hover { transform: translateY(-12px); box-shadow: 0 25px 50px rgba(40,54,24,0.15); }

    .card-img { height: 240px; overflow: hidden; position: relative; }
    .card-img img { width: 100%; height: 100%; object-fit: cover; transition: 0.8s; }
    .card:hover .card-img img { transform: scale(1.1); }
    
    .card-info { padding: 22px; background: white; }
    .card-info h3 { font-size: 1.35rem; color: var(--dark-forest); margin-bottom: 5px; font-weight: 700; }
    .card-info p { color: #888; font-size: 0.9rem; font-weight: 500; }

    /* --- MODAL --- */
    .modal-overlay { 
        position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); 
        backdrop-filter: blur(12px); z-index: 3000; 
        display: none; align-items: center; justify-content: center; opacity: 0; transition: 0.4s;
    }
    .modal-overlay.active { display: flex; opacity: 1; }

    .modal-card { 
        background: white; width: 90%; max-width: 900px; 
        display: flex; border-radius: 30px; overflow: hidden; 
        transform: scale(0.9); transition: 0.5s;
        box-shadow: 0 50px 100px rgba(0,0,0,0.5);
    }
    .modal-overlay.active .modal-card { transform: scale(1); }

    .modal-left { flex: 1; background-size: cover; background-position: center; min-height: 450px; }
    .modal-right { flex: 1.2; padding: 50px; display: flex; flex-direction: column; position: relative; }
    
    .close-btn { 
        position: absolute; top: 25px; right: 25px; width: 40px; height: 40px; 
        background: #f5f5f5; border-radius: 50%; border: none; cursor: pointer; 
        display: flex; align-items: center; justify-content: center; transition: 0.3s;
    }
    .close-btn:hover { background: var(--olive); color: white; transform: rotate(90deg); }

    .modal-title { font-size: 2.8rem; font-weight: 800; color: var(--dark-forest); line-height: 1; margin-bottom: 10px; }
    .modal-meta { color: var(--olive); font-weight: 700; margin-bottom: 20px; font-size: 1.1rem; }

    .quote-box { 
        margin: 20px 0; padding: 25px; background: #F8F9F7; 
        border-radius: 20px; font-style: italic; border-left: 5px solid var(--olive); color: #555;
    }

    .modal-route-btn {
        margin-top: auto; background: var(--dark-forest); color: white; 
        text-align: center; padding: 20px; border-radius: 18px; 
        text-decoration: none; font-weight: 800; font-size: 1.1rem; transition: 0.3s;
    }
    .modal-route-btn:hover { background: var(--olive); transform: translateY(-3px); }

    /* Slider Dots */
    .dots { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 100; }
    .dot { width: 40px; height: 4px; background: rgba(255, 255, 255, 0.3); border-radius: 10px; cursor: pointer; transition: 0.4s; }
    .dot.active { background: var(--olive); width: 60px; }

    @media (max-width: 850px) { .modal-card { flex-direction: column; } .modal-left { min-height: 250px; } }
</style>

<body>
    <?php include __DIR__ . '/../include/preloader.php'; ?>
    <?php include __DIR__ . '/../include/nav.php'; ?>

    <section class="hero">
        <div id="heroSlider"></div>
        <div class="dots" id="heroDots"></div>
    </section>

    <main class="container">
        <div class="section-header">
            <div>
                <p>TASTE OF KIGALI</p>
                <h2>Popular Dining</h2>
            </div>
            <button class="toggle-btn" id="toggleBtn" onclick="toggleMore()">Show More</button>
        </div>
        <div class="grid" id="placesGrid"></div>
    </main>

    <div class="modal-overlay" id="modalOverlay" onclick="closeModal()">
        <div class="modal-card" onclick="event.stopPropagation()">
            <div class="modal-left" id="modalImg"></div>
            <div class="modal-right">
                <button class="close-btn" onclick="closeModal()">✕</button>
                <h2 class="modal-title" id="modalTitle"></h2>
                <div class="modal-meta" id="modalRating"></div>
                
                <div class="quote-box" id="modalQuote"></div>
                
                <div class="info-row" style="display:flex; justify-content:space-between; padding:15px 0; border-bottom:1px solid #eee;">
                    <span style="color:#777;">Atmosphere</span>
                    <span style="font-weight:700; color:var(--black-matte);">Excellent</span>
                </div>
                <div class="info-row" style="display:flex; justify-content:space-between; padding:15px 0; margin-bottom:20px;">
                    <span style="color:#777;">Service</span>
                    <span style="font-weight:700; color:var(--black-matte);">5-Star</span>
                </div>

                <a href="#" class="modal-route-btn" id="modalLink">Route Directly <i class="fas fa-arrow-right"></i></a>
            </div>
        </div>
    </div>

    <script>
        // EXPANDED DATA WITH REAL COORDINATES
        const places = [
            { name: "Inzora Rooftop", rate: "4.8", quote: "Unbeatable views. Try the house-made granola.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085", lat: -1.9439, lng: 30.0675 },
            { name: "Question Coffee", rate: "4.9", quote: "A masterpiece of Rwandan coffee culture.", img: "https://images.unsplash.com/photo-1542332213-31f87348057f", lat: -1.9482, lng: 30.0912 },
            { name: "Soy Asian Table", rate: "4.7", quote: "Exquisite Asian fusion in a modern garden setting.", img: "https://images.unsplash.com/photo-1512058564366-18510be2db19", lat: -1.9441, lng: 30.0892 },
            { name: "The Bistro", rate: "4.9", quote: "Elegance on a plate. Top-tier service.", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4", lat: -1.9455, lng: 30.0611 },
            { name: "Rubia Roasters", rate: "4.8", quote: "Clean, modern design with precision roasts.", img: "https://images.unsplash.com/photo-1442512595331-e89e73853f31", lat: -1.9515, lng: 30.0824 },
            { name: "Pili Pili", rate: "4.7", quote: "Poolside vibes and the best grilled tilapia.", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836", lat: -1.9322, lng: 30.1245 },
            { name: "Repub Lounge", rate: "4.8", quote: "Authentic flavors with a view of the city lights.", img: "https://images.unsplash.com/photo-1552566626-52f8b828add9", lat: -1.9501, lng: 30.0622 },
            { name: "Poivre Noir", rate: "4.6", quote: "French-Belgian fusion with a cozy, artistic vibe.", img: "https://images.unsplash.com/photo-1559339352-11d035aa65de", lat: -1.9460, lng: 30.0600 },
            { name: "Meze Fresh", rate: "4.5", quote: "The best Mexican burritos in Kigali. Fast and fresh.", img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47", lat: -1.9490, lng: 30.0630 },
            { name: "Camellia Tea", rate: "4.4", quote: "A bustling local favorite for tea and quick bites.", img: "https://images.unsplash.com/photo-1576489022157-76984da21907", lat: -1.9440, lng: 30.0620 }
        ];

        // 1. HERO SLIDER LOGIC
        const slider = document.getElementById('heroSlider');
        const dotsBox = document.getElementById('heroDots');
        
        places.slice(0, 5).forEach((p, i) => {
            slider.innerHTML += `
                <div class="slide ${i===0?'active':''}" style="background-image: url('${p.img}?q=80&w=2000')">
                    <div class="content">
                        <h1>${p.name}</h1>
                        <a href="map.php?name=${encodeURIComponent(p.name)}&lat=${p.lat}&lng=${p.lng}" class="route-trigger">
                            📍 GET DIRECTIONS
                        </a>
                    </div>
                </div>`;
            
            const dot = document.createElement('div');
            dot.className = `dot ${i===0?'active':''}`;
            dot.onclick = () => showSlide(i);
            dotsBox.appendChild(dot);
        });

        let currentSlide = 0;
        function showSlide(index) {
            const allSlides = document.querySelectorAll('.slide');
            const allDots = document.querySelectorAll('.dot');
            
            allSlides[currentSlide].classList.remove('active');
            allDots[currentSlide].classList.remove('active');
            
            currentSlide = index;
            
            allSlides[currentSlide].classList.add('active');
            allDots[currentSlide].classList.add('active');
        }
        setInterval(() => showSlide((currentSlide + 1) % 5), 5000);

        // 2. GRID RENDER LOGIC
        const grid = document.getElementById('placesGrid');
        places.forEach((p, i) => {
            const card = document.createElement('div');
            card.className = `card ${i < 4 ? 'visible reveal' : ''}`; // Show first 4 initially
            card.onclick = () => openModal(p);
            
            card.innerHTML = `
                <div class="card-img"><img src="${p.img}?w=600"></div>
                <div class="card-info">
                    <h3>${p.name}</h3>
                    <p>Kigali, Rwanda</p>
                </div>`;
            grid.appendChild(card);
        });

        // 3. SHOW MORE / LESS LOGIC
        let isExpanded = false;
        function toggleMore() {
            isExpanded = !isExpanded;
            const cards = document.querySelectorAll('.card');
            
            cards.forEach((card, i) => {
                if (i >= 4) { // Only affect items after the 4th one
                    if (isExpanded) {
                        card.classList.add('visible');
                        // Staggered reveal animation
                        setTimeout(() => card.classList.add('reveal'), (i-4) * 100);
                    } else {
                        card.classList.remove('reveal');
                        setTimeout(() => card.classList.remove('visible'), 400);
                    }
                }
            });
            document.getElementById('toggleBtn').innerText = isExpanded ? "Show Less" : "Show More";
        }

        // 4. MODAL LOGIC
        function openModal(p) {
            document.getElementById('modalTitle').innerText = p.name;
            document.getElementById('modalRating').innerHTML = `★ ${p.rate} Rating`;
            document.getElementById('modalQuote').innerText = `"${p.quote}"`;
            document.getElementById('modalImg').style.backgroundImage = `url(${p.img}?w=1000)`;
            
            // LINK TO MAP PAGE WITH COORDINATES
            document.getElementById('modalLink').href = `map.php?name=${encodeURIComponent(p.name)}&lat=${p.lat}&lng=${p.lng}`;
            
            document.getElementById('modalOverlay').classList.add('active');
        }

        function closeModal() { document.getElementById('modalOverlay').classList.remove('active'); }
    </script>
</body>