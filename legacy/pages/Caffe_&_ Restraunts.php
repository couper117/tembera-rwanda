
    <style>

        /* --- HERO SLIDER --- */
        .hero { position: relative; height: 90vh; background: var(--black-matte); overflow: hidden; }
        
        .corner-nearby-btn {
            position: absolute; top: 30px; right: 30px; z-index: 100;
            background: var(--olive); color: var(--cream); padding: 12px 24px; border-radius: 50px;
            text-decoration: none; font-weight: 800; font-size: 0.85rem;
            display: flex; align-items: center; gap: 8px; transition: var(--transition);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        .corner-nearby-btn:hover { background: var(--dark-forest); transform: translateY(-3px); }

        .slide {
            position: absolute; inset: 0; opacity: 0; 
            transition: opacity 2s ease-in-out, transform 3s ease;
            background-size: cover; background-position: center;
            display: flex; align-items: center; padding: 0 10%;
            transform: scale(1.1);
        }
        .slide.active { opacity: 1; transform: scale(1); z-index: 1; }
        .slide::after { content: ''; position: absolute; inset: 0; background: rgba(0,0,0,0.5); }

        .content { position: relative; z-index: 10; color: var(--cream); max-width: 700px; }
        .content h1 { font-size: clamp(3rem, 8vw, 5rem); font-weight: 800; line-height: 1.1; margin-bottom: 20px; }
        
        .route-trigger {
            background: var(--olive); color: var(--cream); border: none;
            padding: 18px 40px; border-radius: 50px; font-weight: 800;
            cursor: pointer; display: flex; align-items: center; gap: 10px;
            transition: var(--transition); text-decoration: none; width: fit-content;
        }
        .route-trigger:hover { background: var(--dark-forest); transform: scale(1.05); }

        /* --- POPULAR SECTION --- */
        /* .container { max-width: 1250px; margin: 100px auto; padding: 0 25px; } */
        .section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 50px; }
        
        .toggle-btn {
            background: transparent; border: 2px solid var(--olive); color: var(--olive);
            padding: 12px 30px; border-radius: 50px; font-weight: 800;
            cursor: pointer; transition: var(--transition);
        }
        .toggle-btn:hover { background: var(--olive); color: var(--cream); }

        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
        
        .card { 
            background: white; border-radius: 30px; overflow: hidden; 
            cursor: pointer; transition: var(--transition); 
            box-shadow: 0 10px 30px rgba(0,0,0,0.03);
            display: none; opacity: 0; transform: translateY(40px);
        }
        .card.visible { display: block; }
        .card.reveal { opacity: 1; transform: translateY(0); }
        .card:hover { transform: translateY(-12px); box-shadow: 0 30px 60px rgba(40,54,24,0.15); }

        .card-img { height: 260px; overflow: hidden; color: white;}
        .card-img img { width: 100%; height: 100%; object-fit: cover; transition: 0.8s; }
        .card-info { padding: 25px; background: white; }
        .card-info h3 { font-size: 1.4rem; color: var(--dark-forest); margin-bottom: 5px; }
        .card-info p { color: #888; font-weight: 500; font-size: 0.9rem; }

        /* --- IPAD STYLE MODAL --- */
        .modal-overlay { 
            position: fixed; inset: 0; background: rgba(29, 28, 28, 0.85); 
            backdrop-filter: blur(12px); z-index: 2000; 
            display: none; align-items: center; justify-content: center; opacity: 0; transition: 0.4s;
        }
        .modal-overlay.active { display: flex; opacity: 1; }

        .modal-card { 
            background: white; width: 92%; max-width: 950px; 
            display: flex; border-radius: 40px; overflow: hidden; 
            box-shadow: 0 50px 100px rgba(0,0,0,0.4);
            transform: scale(0.9); transition: 0.5s;
        }
        .modal-overlay.active .modal-card { transform: scale(1); }

        .modal-left { flex: 1; background-size: cover; background-position: center; min-height: 550px; }
        .modal-right { flex: 1.2; padding: 50px; display: flex; flex-direction: column; position: relative; background: #fff; }
        
        .close-btn { 
            position: absolute; top: 25px; right: 25px; width: 42px; height: 42px; 
            background: #f5f5f5; border-radius: 50%; border: none; cursor: pointer; 
            display: flex; align-items: center; justify-content: center; transition: 0.3s;
        }
        .close-btn:hover { background: #e0e0e0; transform: rotate(90deg); }

        .modal-title { font-size: 3rem; font-weight: 800; color: var(--dark-forest); margin-bottom: 5px; }
        .modal-rating { color: var(--olive); font-size: 1.6rem; font-weight: 800; margin-bottom: 30px; display: flex; align-items: center; gap: 8px; }

        .info-row { display: flex; justify-content: space-between; padding: 18px 0; border-bottom: 1px solid #eee; font-size: 1.05rem; }
        .info-row span:first-child { color: #777; }
        .info-row span:last-child { font-weight: 700; color: var(--charcoal); }

        .quote-box { 
            margin: 30px 0; padding: 30px; background: #F8F9F7; 
            border-radius: 25px; color: #555; font-style: italic; line-height: 1.7; border-left: 5px solid var(--olive);
        }

        .modal-route-btn { 
            background: var(--olive); color: var(--cream); text-align: center; 
            padding: 22px; border-radius: 20px; text-decoration: none; 
            font-weight: 800; font-size: 1.1rem; transition: 0.3s;
        }
        .modal-route-btn:hover { background: var(--dark-forest); transform: translateY(-3px); }

        .dots { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); display: flex; gap: 12px; z-index: 100; }
        .dot { width: 45px; height: 4px; background: rgba(233, 229, 217, 0.3); border-radius: 10px; cursor: pointer; transition: 0.4s; }
        .dot.active { background: var(--olive); width: 65px; }

        @media (max-width: 850px) { .modal-card { flex-direction: column; } .modal-left { min-height: 250px; } }
    </style>
<<<<<<<< HEAD:pages/Caffe_&_ Restraunts.php
</head>
<body>
    
========

>>>>>>>> main:pages/restuarants.php
    <section class="hero">
        <a href="pages/Caffe & Restraunts map.php" class="corner-nearby-btn">📍 FIND NEARBY</a>
        <div id="heroSlider"></div>
        <div class="dots" id="heroDots"></div>
    </section>

    <main class="container">
        <div class="section-header">
            <div>
                <p style="font-weight: 800; letter-spacing: 2px; margin-bottom: 10px;">EXPLORE</p>
                <h2 style="font-size: 3rem; font-weight: 800; color: white;">Popular in Kigali</h2>
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
                <div class="modal-rating" id="modalRating"></div>
                
                <div class="info-row"><span>Atmosphere</span><span>Excellent</span></div>
                <div class="info-row"><span>Service</span><span>5-Star</span></div>
                <div class="info-row"><span>Wait Time</span><span>15-20 mins</span></div>

                <div class="quote-box" id="modalQuote"></div>

                <a href="#" class="modal-route-btn" id="modalLink">Route Directly</a>
            </div>
        </div>
    </div>

    

    <script>
        const places = [
            { name: "Inzora Rooftop", rate: "4.8", quote: "The view of the city hills is unbeatable. Try their house-made granola.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085" },
            { name: "Question Coffee", rate: "4.9", quote: "A masterpiece of Rwandan coffee culture. The best bourbon beans in town.", img: "https://images.unsplash.com/photo-1542332213-31f87348057f" },
            { name: "Heaven Garden", rate: "4.7", quote: "Lush greenery and amazing cocktails. A true urban escape.", img: "https://images.unsplash.com/photo-1559339352-11d035aa65de" },
            { name: "The Bistro", rate: "4.9", quote: "Elegance on a plate. The service is as good as the food.", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4" },
            { name: "Rubia Roasters", rate: "4.8", quote: "Modern, clean, and incredible precision in every roast.", img: "https://images.unsplash.com/photo-1442512595331-e89e73853f31" },
            { name: "Pili Pili", rate: "4.7", quote: "Poolside vibes and the best grilled tilapia in Kigali.", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836" },
            { name: "Repub Lounge", rate: "4.8", quote: "Authentic Rwandan flavors with a world-class view of the city lights.", img: "https://images.unsplash.com/photo-1552566626-52f8b828add9" },
            { name: "Soy Asian", rate: "4.6", quote: "Exquisite fusion. A must-visit for anyone craving authentic Asian spices.", img: "https://images.unsplash.com/photo-1512058564366-18510be2db19" }
        ];

        // Hero Slider Initialization
        const slider = document.getElementById('heroSlider');
        const dotsBox = document.getElementById('heroDots');
        places.slice(0, 6).forEach((p, i) => {
            slider.innerHTML += `
                <div class="slide ${i===0?'active':''}" style="background-image: url('${p.img}?q=80&w=2000')">
                    <div class="content">
                        <h1 style= "color: white;">${p.name}</h1>
                        <a href="pages/Caffe & Restraunts map.php?target=${encodeURIComponent(p.name)}" class="route-trigger" style="color: white;">📍 GET DIRECTIONS</a>
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
        setInterval(() => showSlide((currentSlide + 1) % 6), 35000); // 35s Timer

        // Popular Grid Initialization
        const grid = document.getElementById('placesGrid');
        places.forEach((p, i) => {
            const card = document.createElement('div');
            card.className = `card ${i < 4 ? 'visible reveal' : ''}`;
            card.onclick = () => openModal(p);
            card.innerHTML = `<div class="card-img"><img src="${p.img}?w=600"></div><div class="card-info"><h3>${p.name}</h3><p>Kigali, Rwanda</p></div>`;
            grid.appendChild(card);
        });

        // Show More Logic
        let isExpanded = false;
        function toggleMore() {
            isExpanded = !isExpanded;
            const cards = document.querySelectorAll('.card');
            cards.forEach((card, i) => {
                if (i >= 4) {
                    if (isExpanded) {
                        card.classList.add('visible');
                        setTimeout(() => card.classList.add('reveal'), (i-4) * 150);
                    } else {
                        card.classList.remove('reveal');
                        setTimeout(() => card.classList.remove('visible'), 500);
                    }
                }
            });
            document.getElementById('toggleBtn').innerText = isExpanded ? "Show Less" : "Show More";
        }

        // Modal Controls
        function openModal(p) {
            document.getElementById('modalTitle').innerText = p.name;
            document.getElementById('modalRating').innerHTML = `★ ${p.rate} Rating`;
            document.getElementById('modalQuote').innerText = `"${p.quote}"`;
            document.getElementById('modalImg').style.backgroundImage = `url(${p.img}?w=1000)`;
            document.getElementById('modalLink').href = `Caffe & Restraunts.html?target=${encodeURIComponent(p.name)}`;
            document.getElementById('modalOverlay').classList.add('active');
        }

        function closeModal() { document.getElementById('modalOverlay').classList.remove('active'); }
    </script>
