<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visit Rwanda - Experience the Remarkable</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/index_v2.css">
</head>

<body>
    <?php include 'include/preloader.php'; ?>
    <?php include 'include/nav.php'; ?>
    

    <header class="landing-hero">
        <div class="hero-bg-zoom"></div>
        <div class="hero-overlay-gradient"></div>

        <div class="hero-content-center reveal">
            <span class="pill-badge">The Land of a Thousand Hills</span>
            <h1>Experience <br> The <span class="highlight">Remarkable</span></h1>
            <p>Your all-in-one pocket guide to Rwanda. From the misty Virunga mountains to the vibrant heartbeat of Kigali.</p>

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
                    <p>Rwanda is a story of resilience, beauty, and rebirth. Ranked as one of the safest countries in the world, we offer a travel experience that blends luxury eco-tourism with deep cultural heritage.</p>
                    <p>This app helps you navigate it all—finding the best <strong>Museums</strong>, the coziest <strong>Homes</strong>, and the safest <strong>Transport</strong>.</p>
                </div>
                <div class="intro-stats">
                    <div class="stat-box"><h3>1k+</h3><p>Hills to Climb</p></div>
                    <div class="stat-box"><h3>4</h3><p>National Parks</p></div>
                    <div class="stat-box"><h3>26°C</h3><p>Perfect Weather</p></div>
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
                <?php
                // FETCH CARDS FROM DATABASE
                $sql = "SELECT * FROM travel_categories ORDER BY id ASC";
                $result = $conn->query($sql);

                if ($result->num_rows > 0) {
                    while($row = $result->fetch_assoc()) {
                        // Handle image path (check if it's a URL or a local upload)
                        $imgSrc = (strpos($row['image_url'], 'http') === 0) ? $row['image_url'] : 'admin/' . $row['image_url'];
                        ?>
                        
                        <a href="pages/<?php echo $row['page_link']; ?>.php" class="category-card reveal">
                            <div class="cat-img">
                                <img src="<?php echo $imgSrc; ?>" alt="<?php echo $row['title']; ?>">
                            </div>
                            <div class="cat-content">
                                <div class="icon-circle"><i class="<?php echo $row['icon_class']; ?>"></i></div>
                                <h3><?php echo $row['title']; ?></h3>
                                <p><?php echo $row['description']; ?></p>
                                <span class="link-text"><?php echo $row['cta_text']; ?> <i class="fas fa-arrow-right"></i></span>
                            </div>
                        </a>

                        <?php
                    }
                } else {
                    echo "<p>No categories found. Please add them in the Admin Panel.</p>";
                }
                ?>
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
<?php require_once 'include/footer.php'; ?>
    <script src="assets/js/main.js"></script>
    <script>
        window.addEventListener('scroll', reveal);
        function reveal() {
            var reveals = document.querySelectorAll('.reveal');
            for(var i = 0; i < reveals.length; i++) {
                var windowheight = window.innerHeight;
                var revealtop = reveals[i].getBoundingClientRect().top;
                var revealpoint = 150;
                if(revealtop < windowheight - revealpoint) {
                    reveals[i].classList.add('active');
                }
            }
        }
    </script>
</body>
</html>