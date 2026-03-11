<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visit Rwanda - Experience the Remarkable</title>
    <!-- <link rel="stylesheet" href="../assets/css/style.css"> -->
    <link rel="stylesheet" href="../assets/css/historic.css">
</head>

<body>
    <?php
    // This finds the real path to the 'include' folder, no matter where you are
    include __DIR__ . '/../include/preloader.php';
    include __DIR__ . '/../include/header.php';
    ?>

    <header class="landing-hero">
        <div class="hero-bg-zoom"></div>
        <div class="hero-overlay-gradient"></div>

        <div class="hero-content-center reveal">
            <span class="pill-badge">The Land of a Thousand Hills</span>
            <h1>Experience <br> The <span class="highlight">Remarkable</span></h1>
            <p>Your all-in-one pocket guide to Rwanda. From the misty Virunga mountains to the vibrant heartbeat of
                Kigali.</p>

            <div class="hero-buttons">
                <a href="#explore" class="btn-primary-lg">Start Exploring <i class="fas fa-arrow-down"></i></a>

            </div>
        </div>
    </header>

    <section class="intro-section" id="about">
        <div class="container reveal">
            <div class="intro-grid">
                <div class="intro-text">
                    <h2>More Than Just A Destination</h2>
                    <p>Rwanda is a story of resilience, beauty, and rebirth. Ranked as one of the safest countries in
                        the world, we offer a travel experience that blends luxury eco-tourism with deep cultural
                        heritage.</p>
                    <p>This app helps you navigate it all—finding the best <strong>Museums</strong>, the coziest
                        <strong>Homes</strong>, and the safest <strong>Transport</strong>.
                    </p>
                </div>
                <div class="intro-stats">
                    <div class="stat-box">
                        <h3>1k+</h3>
                        <p>Hills to Climb</p>
                    </div>
                    <div class="stat-box">
                        <h3>4</h3>
                        <p>National Parks</p>
                    </div>
                    <div class="stat-box">
                        <h3>26°C</h3>
                        <p>Perfect Weather</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="explore-grid-section" id="explore">
        <div class="container">
            <div class="section-header center-text reveal">
                <h2>Plan Your Journey</h2>
                <p>Select a category to begin your adventure.</p>
            </div>

            <div class="category-grid">

                <a href="historics" class="category-card reveal">
                    <div class="cat-img">
                        <img src="https://images.unsplash.com/photo-1728288578026-6ef60d0fb202?q=80&w=1198&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="History">
                    </div>
                    <div class="cat-content">
                        <div class="icon-circle"><i class="fas fa-landmark"></i></div>
                        <h3>History & Museums</h3>
                        <p>Explore the Kings' Palaces, Genocide Memorials, and Art Museums.</p>
                        <span class="link-text">View 9 Sites <i class="fas fa-arrow-right"></i></span>
                    </div>
                </a>

                <a href="homes" class="category-card reveal">
                    <div class="cat-img">
                        <img src="https://images.unsplash.com/photo-1667504320745-eade6c25e053?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="Stays">
                    </div>
                    <div class="cat-content">
                        <div class="icon-circle"><i class="fas fa-bed"></i></div>
                        <h3>Stays & Homes</h3>
                        <p>From luxury hotels in Kigali to eco-lodges in the volcanoes.</p>
                        <span class="link-text">Find Accommodation <i class="fas fa-arrow-right"></i></span>
                    </div>
                </a>

                <a href="wonders" class="category-card reveal">
                    <div class="cat-img">
                        <img src="https://images.unsplash.com/photo-1676102818778-7dedb5cdad46?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="Nature">
                    </div>
                    <div class="cat-content">
                        <div class="icon-circle"><i class="fas fa-hiking"></i></div>
                        <h3>Nature & Activities</h3>
                        <p>Gorilla trekking, canopy walks, and Lake Kivu boat rides.</p>
                        <span class="link-text">See Activities <i class="fas fa-arrow-right"></i></span>
                    </div>
                </a>
                
                <a href="transport" class="category-card reveal">
                    <div class="cat-img">
                        <img src="https://images.unsplash.com/photo-1641295437743-2ea0b8453392?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="Transport">
                    </div>
                    <div class="cat-content">
                        <div class="icon-circle"><i class="fas fa-bus"></i></div>
                        <h3>Transport & Safety</h3>
                        <p>Hospitals, emergency contacts, and how to get around.</p>
                        <span class="link-text">Travel Guide <i class="fas fa-arrow-right"></i></span>
                    </div>
                </a>
                <a href="churches" class="category-card reveal">
                    <div class="cat-img">
                        <img src="https://images.unsplash.com/photo-1620763935115-3e08804489ca?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="Transport">
                    </div>
                    <div class="cat-content">
                        <div class="icon-circle"><i class="fas fa-bus"></i></div>
                        <h3>Churches</h3>
                        <p>Find a church to go to on your stay.</p>
                        <span class="link-text">Churches <i class="fas fa-arrow-right"></i></span>
                    </div>
                </a>

            </div>
        </div>
    </section>

    <section class="cta-section">
        <div class="cta-bg"></div>
        <div class="cta-content reveal">
            <h2>Ready to visit Rwanda?</h2>
            <p>Download the full itinerary or book your flight today.</p>
            <button class="btn-white-lg">Book Now</button>
        </div>
    </section>

    <script src="js/historics.js"></script>
</body>

</html>
