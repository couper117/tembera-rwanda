
<link rel="stylesheet" href="assets/css/booking.css">

<body class="booking-page">
    <?php include __DIR__ . '/../include/preloader.php'; ?>
    <?php include __DIR__ . '/../include/nav.php'; ?>

    <div class="booking-container">
        <div class="booking-main">
            <header class="booking-header">
                <span class="step-indicator">Step 1 of 3</span>
                <h1>Reserve Your <span class="green-text">Experience</span></h1>
            </header>

            <form id="bookingForm">
                <div class="form-section">
                    <h3>1. Select Your Wonder</h3>
                    <div class="experience-selector">
                        <label class="exp-card">
                            <input type="radio" name="experience" value="Gorilla Trekking" data-price="1500" checked>
                            <div class="exp-content">
                                <i class="fas fa-gorilla"></i>
                                <span>Gorilla Trekking</span>
                                <small>$1,500/pp</small>
                            </div>
                        </label>
                        <label class="exp-card">
                            <input type="radio" name="experience" value="Akagera Safari" data-price="150">
                            <div class="exp-content">
                                <i class="fas fa-hippo"></i>
                                <span>Akagera Safari</span>
                                <small>$150/pp</small>
                            </div>
                        </label>
                        <label class="exp-card">
                            <input type="radio" name="experience" value="Nyungwe Canopy" data-price="60">
                            <div class="exp-content">
                                <i class="fas fa-bridge"></i>
                                <span>Canopy Walk</span>
                                <small>$60/pp</small>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label>Preferred Date</label>
                        <input type="date" id="bookDate" required>
                    </div>
                    <div class="form-group">
                        <label>Guests</label>
                        <div class="guest-picker">
                            <button type="button" onclick="changeGuests(-1)">-</button>
                            <input type="number" id="guestCount" value="1" min="1" readonly>
                            <button type="button" onclick="changeGuests(1)">+</button>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>2. Contact Details</h3>
                    <div class="form-group">
                        <input type="text" placeholder="Full Name" required>
                    </div>
                    <div class="form-group">
                        <input type="email" placeholder="Email Address" required>
                    </div>
                </div>

                <button type="submit" class="btn-confirm">Proceed to Payment</button>
            </form>
        </div>

        <aside class="booking-summary">
            <div class="summary-card">
                <h2>Booking Summary</h2>
                <div class="summary-row">
                    <span>Experience</span>
                    <strong id="sumExp">Gorilla Trekking</strong>
                </div>
                <div class="summary-row">
                    <span>Date</span>
                    <strong id="sumDate">Select a date</strong>
                </div>
                <div class="summary-row">
                    <span>Price per Person</span>
                    <strong id="sumPrice">$1,500</strong>
                </div>
                <div class="summary-row">
                    <span>Guests</span>
                    <strong id="sumGuests">x1</strong>
                </div>
                <hr>
                <div class="total-row">
                    <span>Total Amount</span>
                    <h2 id="totalPrice">$1,500</h2>
                </div>
                <div class="safety-badge">
                    <i class="fas fa-shield-check"></i> Secure & Official Rwandan Booking
                </div>
            </div>
        </aside>
    </div>

    <script>
        const bookingForm = document.getElementById('bookingForm');
        
        function updateSummary() {
            const selected = document.querySelector('input[name="experience"]:checked');
            const guests = document.getElementById('guestCount').value;
            const date = document.getElementById('bookDate').value;
            const pricePer = selected.dataset.price;

            document.getElementById('sumExp').innerText = selected.value;
            document.getElementById('sumPrice').innerText = '$' + pricePer;
            document.getElementById('sumGuests').innerText = 'x' + guests;
            document.getElementById('sumDate').innerText = date || "Select a date";
            document.getElementById('totalPrice').innerText = '$' + (pricePer * guests);
        }

        function changeGuests(val) {
            const input = document.getElementById('guestCount');
            let current = parseInt(input.value);
            if (current + val >= 1) {
                input.value = current + val;
                updateSummary();
            }
        }

        document.querySelectorAll('input[name="experience"]').forEach(radio => {
            radio.addEventListener('change', updateSummary);
        });

        document.getElementById('bookDate').addEventListener('change', updateSummary);

        updateSummary();
    </script>
</body>