
<link rel="stylesheet" href="assets/css/wonders.css">

<body class="wonders-page">
    <?php include __DIR__ . '/../include/preloader.php'; ?>
    <?php include __DIR__ . '/../include/nav.php'; ?>

    <header class="wonders-hero">
        <div class="hero-overlay"></div>
        <div class="hero-content">
            <span class="tagline">Explore the Remarkable</span>
            <h1>Rwanda <span class="green-text">Wonders</span></h1>
            <p>From the home of the mountain gorillas to the shores of the Great Rift Valley.</p>
        </div>
    </header>

    <main class="container">
        <div class="filter-bar">
            <button class="filter-btn active" onclick="filterWonders('all')">All Wonders</button>
            <button class="filter-btn" onclick="filterWonders('National Park')">National Parks</button>
            <button class="filter-btn" onclick="filterWonders('Water')">Lakes & Rivers</button>
            <button class="filter-btn" onclick="filterWonders('Wildlife')">Wildlife</button>
        </div>

        <div class="wonders-grid" id="wondersGrid">
            </div>
    </main>

    <div id="wonderModal" class="modal-overlay" onclick="closeWonder()">
        <div class="modal-card" onclick="event.stopPropagation()">
            <button class="close-x" onclick="closeWonder()">&times;</button>
            <div class="modal-split">
                <div class="modal-img" id="modalImg"></div>
                <div class="modal-info">
                    <h2 id="modalTitle"></h2>
                    <span class="modal-tag" id="modalTag"></span>
                    <p id="modalDesc"></p>
                    <div class="modal-action">
                        <a href="transport" class="btn-book">Plan Transport</a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <?php include __DIR__ . '/../include/footer.php'; ?>

    <script>
       const wonders = [
    { 
        name: "Volcanoes National Park", 
        type: "National Park", 
        desc: "The mist-covered home of the mountain gorillas and the dramatic Virunga volcano range.", 
        img: "http://googleusercontent.com/image_collection/image_retrieval/16059656606262893531_0" 
    },
    { 
        name: "Akagera National Park", 
        type: "National Park", 
        desc: "A sprawling savannah where the Big Five roam across lakes, swamps, and open plains.", 
        img: "http://googleusercontent.com/image_collection/image_retrieval/13952493864587426278_0" 
    },
    { 
        name: "Nyungwe Forest National Park", 
        type: "National Park", 
        desc: "One of the oldest rainforests in Africa, famous for chimpanzee trekking and the high canopy walk.", 
        img: "http://googleusercontent.com/image_collection/image_retrieval/2977566872927862920_0" 
    },
    { 
        name: "Lake Kivu", 
        type: "Water", 
        desc: "An emerald-blue inland sea perfect for sunset boat rides and exploring the lakeside towns of Rubavu and Karongi.", 
        img: "http://googleusercontent.com/image_collection/image_retrieval/210355924026499005_0" 
    },
    { 
        name: "Twin Lakes (Burera & Ruhondo)", 
        type: "Water", 
        desc: "Stunning blue lakes at the base of the volcanoes, offering some of the most scenic views in the country.", 
        img: "http://googleusercontent.com/image_collection/image_retrieval/14471468351131662477_0" 
    }
];

        function renderWonders(filter = 'all') {
            const grid = document.getElementById('wondersGrid');
            grid.innerHTML = '';
            wonders.forEach(w => {
                if (filter === 'all' || w.type === filter) {
                    const card = document.createElement('div');
                    card.className = 'wonder-card fade-in';
                    card.innerHTML = `
                        <div class="card-img-wrap">
                            <img src="${w.img}" alt="${w.name}">
                            <div class="card-overlay">
                                <h3>${w.name}</h3>
                                <span>${w.type}</span>
                            </div>
                        </div>
                    `;
                    card.onclick = () => openWonder(w);
                    grid.appendChild(card);
                }
            });
        }

        function openWonder(w) {
            document.getElementById('modalTitle').innerText = w.name;
            document.getElementById('modalTag').innerText = w.type;
            document.getElementById('modalDesc').innerText = w.desc;
            document.getElementById('modalImg').style.backgroundImage = `url(${w.img})`;
            document.getElementById('wonderModal').classList.add('active');
        }

        function closeWonder() {
            document.getElementById('wonderModal').classList.remove('active');
        }

        function filterWonders(type) {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
            renderWonders(type);
        }

        window.onload = () => renderWonders();
    </script>
</body>