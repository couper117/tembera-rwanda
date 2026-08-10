<div id="preloader">
    <div class="loader-content">
        <h1 class="loader-text">
            <span>Visit</span>
            <span class="stroke-text">Rwanda</span>
        </h1>
        <div class="loader-line"></div>
    </div>
</div>

<style>
    /* 1. Base Preloader Setup */
    #preloader {
        position: fixed;
        inset: 0;
        background: #1D1C1C; /* Black Matte Background */
        z-index: 9999999;
        display: flex;
        justify-content: center;
        align-items: center;
        /* The exit animation logic */
        transition: transform 0.8s cubic-bezier(0.76, 0, 0.24, 1);
    }

    #preloader.loaded {
        transform: translateY(-100%); /* Slides up like a curtain */
    }

    .loader-content {
        text-align: center;
        position: relative;
    }

    /* 2. Typography & Animation */
    .loader-text {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: clamp(3rem, 8vw, 6rem);
        font-weight: 800;
        line-height: 1;
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
    }

    /* "Visit" is filled white */
    .loader-text span:first-child {
        color: white;
        opacity: 0;
        transform: translateY(20px);
        animation: fadeUp 0.8s ease forwards 0.2s;
    }

    /* "Rwanda" is outlined (Stroke) */
    .stroke-text {
        color: transparent;
        -webkit-text-stroke: 2px #606C38; /* Olive Green Outline */
        position: relative;
        opacity: 0;
        transform: translateY(20px);
        animation: fadeUp 0.8s ease forwards 0.4s;
    }

    /* "Rwanda" fills with color */
    .stroke-text::before {
        content: 'Rwanda';
        position: absolute;
        top: 0; left: 0;
        width: 0%; height: 100%;
        color: #606C38; /* Fill Color */
        border-right: 4px solid #fff; /* The "Cursor" effect */
        overflow: hidden;
        animation: fillText 1.5s cubic-bezier(0.19, 1, 0.22, 1) forwards 1s;
    }

    /* 3. Loading Line at Bottom */
    .loader-line {
        width: 0%;
        height: 4px;
        background: white;
        margin: 30px auto 0;
        border-radius: 2px;
        animation: lineGrow 2.2s ease-in-out forwards;
    }

    /* KEYFRAMES */
    @keyframes fadeUp {
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fillText {
        to { width: 100%; }
    }

    @keyframes lineGrow {
        0% { width: 0%; opacity: 0; }
        50% { opacity: 1; }
        100% { width: 60%; opacity: 1; }
    }
</style>

<script>
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        // Wait for animations to finish (approx 3s total)
        setTimeout(() => {
            preloader.classList.add('loaded');
            
            // Remove from DOM after slide-up finishes
            setTimeout(() => {
                preloader.remove();
            }, 900);
        }, 3000);
    });
</script>