<?php include __DIR__ . '/../include/head.php'; ?>
<style>
    /* --- THEME VARIABLES --- */
    :root {
        --cream: #E9E5D9;
        --olive: #606C38;
        --dark-forest: #283618;
        --black-matte: #1D1C1C;
        --white: #ffffff;
        --transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
    }

    body {
        font-family: 'Plus Jakarta Sans', sans-serif;
        background: var(--cream);
        color: var(--black-matte);
        overflow-x: hidden;
    }

    /* --- HERO SECTION --- */
    .hero {
        position: relative;
        height: 70vh;
        background: url('https://images.unsplash.com/photo-1548695607-9c73430ba065?q=80&w=2000') center/cover fixed no-repeat;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        margin-bottom: 5rem;
    }

    .hero-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(29, 28, 28, 0.4), var(--cream));
    }

    .hero-content {
        position: relative;
        z-index: 2;
        max-width: 800px;
        padding: 0 20px;
        animation: fadeInUp 1s ease forwards;
    }

    .hero-content h1 {
        font-size: clamp(3rem, 6vw, 5rem);
        font-weight: 800;
        color: var(--dark-forest);
        margin-bottom: 1rem;
        line-height: 1.1;
    }

    .hero-content p {
        font-size: 1.2rem;
        color: var(--black-matte);
        font-weight: 500;
        opacity: 0.9;
    }

    /* --- STORY SECTION --- */
    /* .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 25px 80px;
    } */

    .story-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 60px;
        align-items: center;
        margin-bottom: 100px;
    }

    .story-text h2 {
        font-size: 2.5rem;
        color: var(--olive);
        margin-bottom: 20px;
        font-weight: 800;
    }

    .story-text p {
        font-size: 1.1rem;
        line-height: 1.8;
        color: #555;
        margin-bottom: 20px;
    }

    .story-img {
        position: relative;
        border-radius: 30px;
        overflow: hidden;
        box-shadow: 0 40px 80px rgba(40, 54, 24, 0.15);
        transform: rotate(2deg);
        transition: var(--transition);
    }
    
    .story-img:hover { transform: rotate(0deg) scale(1.02); }
    .story-img img { width: 100%; display: block; }

    /* --- VALUES GRID --- */
    .values-section {
        margin-top: 50px;
    }

    .section-header {
        text-align: center;
        margin-bottom: 60px;
    }
    .section-header h2 { font-size: 2.5rem; font-weight: 800; color: var(--dark-forest); }
    .underline { width: 60px; height: 4px; background: var(--olive); margin: 15px auto; border-radius: 2px; }

    .card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 30px;
    }

    .value-card {
        background: var(--white);
        padding: 40px 30px;
        border-radius: 24px;
        border: 1px solid rgba(0,0,0,0.03);
        transition: var(--transition);
        position: relative;
        overflow: hidden;
    }

    .value-card:hover {
        transform: translateY(-15px);
        box-shadow: 0 30px 60px rgba(40, 54, 24, 0.1);
        border-color: rgba(96, 108, 56, 0.2);
    }

    .icon-box {
        width: 60px; height: 60px;
        background: rgba(96, 108, 56, 0.1);
        color: var(--olive);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.5rem;
        margin-bottom: 25px;
        transition: 0.4s;
    }

    .value-card:hover .icon-box { background: var(--olive); color: white; transform: scale(1.1); }

    .value-card h3 {
        font-size: 1.4rem;
        font-weight: 700;
        color: var(--dark-forest);
        margin-bottom: 15px;
    }

    .value-card p {
        font-size: 0.95rem;
        color: #666;
        line-height: 1.6;
    }

    /* --- STATS BAR --- */
    .stats-bar {
        background: var(--dark-forest);
        color: var(--cream);
        border-radius: 30px;
        padding: 60px;
        display: flex;
        justify-content: space-around;
        flex-wrap: wrap;
        gap: 30px;
        text-align: center;
        margin-top: 80px;
    }

    .stat-item h3 { font-size: 3rem; font-weight: 800; margin-bottom: 5px; color: var(--olive); }
    .stat-item p { font-size: 1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

    /* --- ANIMATION KEYFRAMES --- */
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(40px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 900px) {
        .story-grid { grid-template-columns: 1fr; }
        .hero { height: 60vh; }
        .hero-content h1 { font-size: 3rem; }
        .story-img { transform: rotate(0); margin-top: 30px; }
    }
</style>

<body>
    <?php include __DIR__ . '/../include/preloader.php'; ?>
    <?php include __DIR__ . '/../include/nav.php'; ?>

    <header class="hero">
        <div class="hero-overlay"></div>
        <div class="hero-content">
            <h1>We Are <br>Visit Rwanda.</h1>
            <p>Bridging the gap between culture, technology, and exploration.</p>
        </div>
    </header>

    <!-- <main class="container"> -->
        
        <section class="story-grid">
            <div class="story-text">
                <h2>Our Mission</h2>
                <p>
                    Rwanda is known as the "Land of a Thousand Hills," but for many travelers and locals alike, discovering the hidden gems within those hills can be a challenge.
                </p>
                <p>
                    Our mission is to democratize discovery. We use open data and modern mapping technology to highlight everything from the smallest local coffee shop to the grandest national park, ensuring that the beauty of Rwanda is accessible to everyone.
                </p>
            </div>
            <div class="story-img">
                <img src="https://images.unsplash.com/photo-1643367750096-0f9215fdd0ae?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Rwanda Landscape">
            </div>
        </section>

        <section class="values-section">
            <div class="section-header">
                <h2>Why We Exist</h2>
                <div class="underline"></div>
            </div>

            <div class="card-grid">
                <div class="value-card">
                    <div class="icon-box"><i class="fas fa-map-marked-alt"></i></div>
                    <h3>Smart Navigation</h3>
                    <p>
                        We replace confusion with clarity. Our real-time maps help you navigate Kigali's vibrant streets and the countryside's winding roads with confidence.
                    </p>
                </div>

                <div class="value-card">
                    <div class="icon-box"><i class="fas fa-heart"></i></div>
                    <h3>Local Culture</h3>
                    <p>
                        We don't just show you tourist traps. We connect you to local churches, markets, and communities that define the true spirit of Rwanda.
                    </p>
                </div>

                <div class="value-card">
                    <div class="icon-box"><i class="fas fa-code"></i></div>
                    <h3>Open Technology</h3>
                    <p>
                        Built on modern web standards using Leaflet and OpenStreetMap, ensuring that our data is free, fast, and constantly evolving.
                    </p>
                </div>

                <div class="value-card">
                    <div class="icon-box"><i class="fas fa-eye"></i></div>
                    <h3>Future Vision</h3>
                    <p>
                        We envision a digitally connected Rwanda where every business, no matter how small, can be discovered by the world.
                    </p>
                </div>
            </div>
        </section>

        <section class="stats-bar">
            <div class="stat-item">
                <h3>30+</h3>
                <p>Provinces Mapped</p>
            </div>
            <div class="stat-item">
                <h3>150+</h3>
                <p>Hidden Gems</p>
            </div>
            <div class="stat-item">
                <h3>10k+</h3>
                <p>Happy Travelers</p>
            </div>
        </section>

    </main>

    <?php include __DIR__ . '/../include/footer.php'; ?>
    
    <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>
</body>