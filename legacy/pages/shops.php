<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kigali Markets & Shops</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', system-ui, sans-serif;
        }

        body {
            background-color: #e9e5d9;
            color: #1c1c1c;
            line-height: 1.6;
            max-width: 1400px;
            margin: 0 auto;
            padding: 30px 20px 0;
        }

        .search-section {
            margin-bottom: 40px;
            padding: 0 10px;
        }

        .search-container {
            display: flex;
            gap: 15px;
            margin-bottom: 25px;
        }

        .search-box {
            flex: 1;
            padding: 18px 24px;
            border: 2px solid #5f6c37;
            border-radius: 8px;
            font-size: 1.1rem;
            background-color: white;
            color: #323031;
            outline: none;
            transition: border-color 0.3s;
        }

        .search-box:focus {
            border-color: #273617;
        }

        .search-btn {
            background-color: #5f6c37;
            color: #e9e5d9;
            border: none;
            border-radius: 8px;
            padding: 0 30px;
            cursor: pointer;
            font-size: 1.1rem;
            transition: background-color 0.3s;
        }

        .search-btn:hover {
            background-color: #273617;
        }

        .filter-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 15px;
        }

        .filter-tag {
            background-color: transparent;
            border: 1px solid #5f6c37;
            color: #5f6c37;
            padding: 8px 18px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.95rem;
            transition: all 0.2s ease;
        }

        .filter-tag:hover, .filter-tag.active {
            background-color: #5f6c37;
            color: #e9e5d9;
        }

        .container {
            display: grid;
            grid-template-columns: 1fr 3fr;
            gap: 40px;
        }

        .kigali-intro {
            padding: 30px;
            background-color: #273617;
            color: #e9e5d9;
            border-radius: 8px;
            height: fit-content;
            position: sticky;
            top: 30px;
        }

        .kigali-intro h1 {
            font-size: 2.5rem;
            font-weight: 300;
            letter-spacing: 0.5px;
            margin-bottom: 20px;
            line-height: 1.2;
        }

        .kigali-intro p {
            font-size: 1.05rem;
            margin-bottom: 20px;
            opacity: 0.9;
        }

        .highlight {
            display: inline-block;
            background-color: #5f6c37;
            padding: 5px 10px;
            border-radius: 4px;
            margin-top: 10px;
        }

        .shops-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 30px;
        }

        .shop-card {
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .shop-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .shop-header {
            height: 180px;
            background-color: #5f6c37;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #e9e5d9;
            font-size: 3.5rem;
            position: relative;
        }

        .shop-type {
            position: absolute;
            top: 15px;
            right: 15px;
            background-color: #273617;
            color: #e9e5d9;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85rem;
        }

        .shop-content {
            padding: 25px;
        }

        .shop-title {
            font-size: 1.5rem;
            margin-bottom: 10px;
            color: #323031;
            font-weight: 500;
        }

        .shop-area {
            color: #5f6c37;
            font-size: 1rem;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .shop-description {
            color: #323031;
            margin-bottom: 20px;
            opacity: 0.85;
            line-height: 1.5;
        }

        .shop-details {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid rgba(50, 48, 49, 0.1);
        }

        .shop-hours, .shop-location {
            font-size: 0.9rem;
            color: #5f6c37;
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .result-count {
            margin: 30px 0 20px;
            color: #5f6c37;
            font-size: 1.1rem;
            padding: 0 10px;
        }

        .no-results {
            grid-column: 1 / -1;
            text-align: center;
            padding: 60px 20px;
            color: #323031;
            font-size: 1.2rem;
        }

        .no-results i {
            font-size: 3rem;
            color: #5f6c37;
            margin-bottom: 20px;
        }

        @media (max-width: 1100px) {
            .container {
                grid-template-columns: 1fr;
            }
            
            .kigali-intro {
                position: static;
            }
        }

        @media (max-width: 800px) {
            .shops-grid {
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            }
            
            .search-container {
                flex-direction: column;
            }
            
            .search-btn {
                padding: 15px;
            }
        }

        @media (max-width: 600px) {
            .shops-grid {
                grid-template-columns: 1fr;
            }
            
            .kigali-intro h1 {
                font-size: 2rem;
            }
            
            body {
                padding: 20px 15px 0;
            }
        }
    </style>
</head>
<body>
    <div class="search-section">
        <div class="search-container">
            <input type="text" class="search-box" id="searchInput" placeholder="Search Kigali markets and shops...">
            <button class="search-btn" id="searchBtn">
                <i class="fas fa-search"></i> Search
            </button>
        </div>
        
        <div class="filter-tags">
            <button class="filter-tag active" data-filter="all">All</button>
            <button class="filter-tag" data-filter="market">Markets</button>
            <button class="filter-tag" data-filter="craft">Crafts</button>
            <button class="filter-tag" data-filter="food">Food & Produce</button>
            <button class="filter-tag" data-filter="clothing">Clothing</button>
            <button class="filter-tag" data-filter="art">Art & Design</button>
            <button class="filter-tag" data-filter="souvenir">Souvenirs</button>
        </div>
    </div>

    <div class="container">
        <div class="kigali-intro">
            <h1>Kigali's Markets & Shops</h1>
            <p>Discover the vibrant shopping culture of Rwanda's capital. From bustling traditional markets to contemporary boutiques, Kigali offers unique shopping experiences that reflect the country's rich culture and craftsmanship.</p>
            <p>Each market and shop tells a story of Rwanda's journey, blending tradition with modern aesthetics.</p>
            <div class="highlight">"Visit, explore, and take home a piece of Rwanda"</div>
        </div>

        <div>
            <div class="result-count" id="resultCount">Showing 12 shops & markets in Kigali</div>
            
            <div class="shops-grid" id="shopsGrid">
                <!-- Shop data will be populated by JavaScript -->
            </div>
        </div>
    </div>

    <script>
        // Kigali shops and markets data
        const kigaliShops = [
            {
                id: 1,
                name: "Kimironko Market",
                type: "market",
                area: "Kimironko",
                icon: "fas fa-basket-shopping",
                description: "Kigali's largest and most vibrant market offering fresh produce, textiles, crafts, and household goods. A true local experience.",
                hours: "Daily: 7am-7pm",
                location: "Kimironko Sector",
                category: ["market", "food", "craft"]
            },
            {
                id: 2,
                name: "Caplaki Craft Village",
                type: "craft",
                area: "Gacuriro",
                icon: "fas fa-hands",
                description: "A cooperative of artisans selling traditional Rwandan crafts, including baskets, wood carvings, paintings, and jewelry.",
                hours: "Mon-Sat: 9am-6pm",
                location: "Gacuriro Road",
                category: ["craft", "art", "souvenir"]
            },
            {
                id: 3,
                name: "Nyamirambo Women's Center Market",
                type: "market",
                area: "Nyamirambo",
                icon: "fas fa-people-group",
                description: "Community market run by local women offering traditional crafts, textiles, and guided tours of the Nyamirambo neighborhood.",
                hours: "Mon-Fri: 8am-5pm",
                location: "Nyamirambo",
                category: ["market", "craft", "clothing"]
            },
            {
                id: 4,
                name: "Question Coffee Café & Shop",
                type: "food",
                area: "Kacyiru",
                icon: "fas fa-mug-hot",
                description: "Specialty coffee shop selling premium Rwandan coffee beans and accessories. Offers coffee tasting sessions.",
                hours: "Daily: 7am-8pm",
                location: "Kacyiru",
                category: ["food", "souvenir"]
            },
            {
                id: 5,
                name: "Rwanda Clothing",
                type: "clothing",
                area: "City Center",
                icon: "fas fa-tshirt",
                description: "Boutique featuring contemporary Rwandan fashion designers. Modern clothing with traditional influences.",
                hours: "Mon-Sat: 10am-7pm",
                location: "City Center",
                category: ["clothing", "art"]
            },
            {
                id: 6,
                name: "Inema Arts Center",
                type: "art",
                area: "Kacyiru",
                icon: "fas fa-palette",
                description: "Contemporary art gallery and studio showcasing works by Rwandan artists. Also offers art workshops.",
                hours: "Tue-Sun: 9am-6pm",
                location: "Kacyiru",
                category: ["art", "craft"]
            },
            {
                id: 7,
                name: "Simba Supermarket",
                type: "market",
                area: "Multiple Locations",
                icon: "fas fa-store",
                description: "Popular supermarket chain offering both local and imported goods. Known for its fresh produce section.",
                hours: "Daily: 8am-9pm",
                location: "Citywide",
                category: ["market", "food"]
            },
            {
                id: 8,
                name: "Gahaya Links Gift Shop",
                type: "souvenir",
                area: "Kacyiru",
                icon: "fas fa-gift",
                description: "Specializes in traditional Rwandan baskets and woven products made by women's cooperatives across the country.",
                hours: "Mon-Sat: 9am-6pm",
                location: "Kacyiru",
                category: ["souvenir", "craft"]
            },
            {
                id: 9,
                name: "Union Trade Center",
                type: "market",
                area: "City Center",
                icon: "fas fa-building",
                description: "Multi-level shopping center with a variety of shops selling electronics, clothing, books, and more.",
                hours: "Daily: 8am-8pm",
                location: "City Center",
                category: ["market", "clothing"]
            },
            {
                id: 10,
                name: "Azizi Life Boutique",
                type: "craft",
                area: "Gikondo",
                icon: "fas fa-gem",
                description: "Fair trade shop offering handmade crafts, jewelry, and home decor made by Rwandan artisans.",
                hours: "Mon-Fri: 8:30am-5:30pm",
                location: "Gikondo",
                category: ["craft", "souvenir", "art"]
            },
            {
                id: 11,
                name: "Nyabugogo Market",
                type: "market",
                area: "Nyabugogo",
                icon: "fas fa-truck-moving",
                description: "Major transport hub and market known for fresh food, spices, and affordable clothing. Very busy atmosphere.",
                hours: "Daily: 6am-8pm",
                location: "Nyabugogo",
                category: ["market", "food", "clothing"]
            },
            {
                id: 12,
                name: "Rwanda Art Museum Shop",
                type: "art",
                area: "Kanombe",
                icon: "fas fa-museum",
                description: "Museum shop offering art books, prints, and reproductions of works in the Rwanda Art Museum collection.",
                hours: "Tue-Sun: 9am-5pm",
                location: "Kanombe",
                category: ["art", "souvenir"]
            },
            {
                id: 13,
                name: "Bourbon Coffee Shop & Store",
                type: "food",
                area: "Multiple Locations",
                icon: "fas fa-coffee",
                description: "Rwanda's premier coffee chain with several locations. Sells premium Rwandan coffee beans and brewing equipment.",
                hours: "Daily: 7am-10pm",
                location: "Citywide",
                category: ["food", "souvenir"]
            },
            {
                id: 14,
                name: "Kimihurura Fabric Market",
                type: "clothing",
                area: "Kimihurura",
                icon: "fas fa-vest",
                description: "Specialized market for traditional and modern fabrics. Tailors available for custom clothing orders.",
                hours: "Mon-Sat: 8am-6pm",
                location: "Kimihurura",
                category: ["clothing", "market"]
            },
            {
                id: 15,
                name: "Mamba Club Grocery",
                type: "food",
                area: "Kicukiro",
                icon: "fas fa-carrot",
                description: "Well-stocked grocery with a focus on organic and locally-sourced produce. Includes a deli and bakery.",
                hours: "Daily: 7am-9pm",
                location: "Kicukiro",
                category: ["food", "market"]
            },
            {
                id: 16,
                name: "Rwanda Craftworks",
                type: "craft",
                area: "Remera",
                icon: "fas fa-hammer",
                description: "Workshop and store featuring handmade furniture, home decor, and accessories by local craftsmen.",
                hours: "Mon-Sat: 9am-5pm",
                location: "Remera",
                category: ["craft", "art"]
            },
            {
                id: 17,
                name: "Kigali Heights Shopping Mall",
                type: "market",
                area: "Kimihurura",
                icon: "fas fa-shopping-cart",
                description: "Modern shopping mall with international brands, restaurants, cinema, and a supermarket.",
                hours: "Daily: 9am-9pm",
                location: "Kimihurura",
                category: ["market", "clothing", "food"]
            },
            {
                id: 18,
                name: "Ikirezi Perfumery & Shop",
                type: "souvenir",
                area: "Kacyiru",
                icon: "fas fa-spray-can-sparkles",
                description: "Unique shop selling essential oils and perfumes made from Rwandan botanicals. Offers perfume-making workshops.",
                hours: "Mon-Fri: 9am-5pm",
                location: "Kacyiru",
                category: ["souvenir", "craft"]
            },
            {
                id: 19,
                name: "City Market",
                type: "market",
                area: "City Center",
                icon: "fas fa-city",
                description: "Traditional market in the heart of Kigali, offering fresh produce, meats, spices, and household items.",
                hours: "Daily: 7am-7pm",
                location: "City Center",
                category: ["market", "food"]
            },
            {
                id: 20,
                name: "Rwanda Fashion Week Boutique",
                type: "clothing",
                area: "Nyarutarama",
                icon: "fas fa-vest-patches",
                description: "Showcases collections from Rwanda Fashion Week designers. High-end contemporary African fashion.",
                hours: "Tue-Sat: 10am-6pm",
                location: "Nyarutarama",
                category: ["clothing", "art"]
            }
        ];

        // DOM elements
        const shopsGrid = document.getElementById('shopsGrid');
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const filterTags = document.querySelectorAll('.filter-tag');
        const resultCount = document.getElementById('resultCount');

        // Current filter state
        let currentFilter = 'all';
        let currentSearch = '';

        // Initialize the shop display
        function displayShops(shops) {
            shopsGrid.innerHTML = '';
            
            if (shops.length === 0) {
                shopsGrid.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <h3>No shops or markets found</h3>
                        <p>Try adjusting your search or filter criteria</p>
                    </div>
                `;
                resultCount.textContent = `No results found`;
                return;
            }
            
            shops.forEach(shop => {
                const shopCard = document.createElement('div');
                shopCard.className = 'shop-card';
                shopCard.setAttribute('data-category', shop.type);
                
                shopCard.innerHTML = `
                    <div class="shop-header">
                        <i class="${shop.icon}"></i>
                        <div class="shop-type">${shop.type.charAt(0).toUpperCase() + shop.type.slice(1)}</div>
                    </div>
                    <div class="shop-content">
                        <h3 class="shop-title">${shop.name}</h3>
                        <div class="shop-area">
                            <i class="fas fa-map-pin"></i> ${shop.area}
                        </div>
                        <p class="shop-description">${shop.description}</p>
                        <div class="shop-details">
                            <div class="shop-hours"><i class="far fa-clock"></i> ${shop.hours}</div>
                            <div class="shop-location"><i class="fas fa-map-marker-alt"></i> ${shop.location}</div>
                        </div>
                    </div>
                `;
                
                shopsGrid.appendChild(shopCard);
            });
            
            resultCount.textContent = `Showing ${shops.length} shops & markets in Kigali`;
        }

        // Filter and search shops
        function filterShops() {
            let filteredShops = kigaliShops;
            
            // Apply category filter
            if (currentFilter !== 'all') {
                filteredShops = filteredShops.filter(shop => 
                    shop.category.includes(currentFilter)
                );
            }
            
            // Apply search filter
            if (currentSearch.trim() !== '') {
                const searchTerm = currentSearch.toLowerCase();
                filteredShops = filteredShops.filter(shop => 
                    shop.name.toLowerCase().includes(searchTerm) ||
                    shop.description.toLowerCase().includes(searchTerm) ||
                    shop.area.toLowerCase().includes(searchTerm) ||
                    shop.type.toLowerCase().includes(searchTerm)
                );
            }
            
            displayShops(filteredShops);
        }

        // Event listeners for filter tags
        filterTags.forEach(tag => {
            tag.addEventListener('click', function() {
                filterTags.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.getAttribute('data-filter');
                filterShops();
            });
        });

        // Event listeners for search
        searchBtn.addEventListener('click', function() {
            currentSearch = searchInput.value;
            filterShops();
        });

        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                currentSearch = searchInput.value;
                filterShops();
            }
        });

        // Initial display
        displayShops(kigaliShops);
        
        // Add subtle entrance animation for shop cards
        setTimeout(() => {
            const cards = document.querySelectorAll('.shop-card');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50 + (index * 50));
            });
        }, 100);
    </script>
</body>
</html>