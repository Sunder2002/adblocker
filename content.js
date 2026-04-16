let adWasHandled = false;

// The Burst Unmute: Forces React UI to sync volume state
const triggerAggressiveUnmute = () => {
    const burst = [0, 500, 1000, 1500]; 
    
    burst.forEach(delay => {
        setTimeout(() => {
            const v = document.querySelector('video');
            if (v) {
                v.muted = false;
                if (v.volume === 0) v.volume = 1.0;
                // Dispatch events that modern frontends use to update their mute icons
                v.dispatchEvent(new Event('volumechange', { bubbles: true }));
                v.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }, delay);
    });
};

const handleAds = () => {
    const url = window.location.href;
    const video = document.querySelector('video');

    // ==========================================
    // YOUTUBE LOGIC
    // ==========================================
    if (url.includes('youtube.com')) {
        
        // 1. Auto-Close YouTube's Anti-Adblock Warning Modal
        const ytAntiAdblockModal = document.querySelector('tp-yt-paper-dialog:has(#dismiss-button)');
        if (ytAntiAdblockModal && ytAntiAdblockModal.style.display !== 'none') {
            const dismissBtn = ytAntiAdblockModal.querySelector('#dismiss-button');
            if (dismissBtn) dismissBtn.click();
        }

        // 2. Click standard Skip buttons
        const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button');
        if (skipBtn) skipBtn.click();
        
        // 3. Fast-forward unskippable video ads
        if (video && document.querySelector('.ad-showing')) {
            video.playbackRate = 16.0;
            if (isFinite(video.duration) && video.currentTime < video.duration - 0.1) {
                video.currentTime = video.duration - 0.1;
            }
        }
    }

    // ==========================================
    // JIOHOTSTAR LOGIC
    // ==========================================
    if (url.includes('hotstar.com')) {
        
        // 1. Visually hide Upsell Traps & Auto-click real skips
        document.querySelectorAll('button, a, span, div').forEach(el => {
            const text = (el.innerText || '').trim();
            if (text === 'Go Ads free' || text === 'Upgrade') {
                el.style.display = 'none';
            }
            if (text === 'Skip Ad' || text === 'Skip') {
                el.click();
            }
        });

        if (video) {
            const isLiveStream = url.includes('/live/');
            
            // --- MOVIE PROTECTION GATE ---
            // If the video is longer than 3 minutes, it's the main show. Abort ad logic.
            if (isFinite(video.duration) && video.duration > 180 && !isLiveStream) {
                if (adWasHandled) {
                    adWasHandled = false;
                    video.playbackRate = 1.0;
                    triggerAggressiveUnmute();
                }
                return; 
            }

            // --- AD DETECTION ---
            const isShortVideoAd = isFinite(video.duration) && video.duration > 0 && video.duration < 65;
            let hasAdTimer = false;
            document.querySelectorAll('span, div').forEach(el => {
                if ((el.innerText || '').trim().match(/^\d+ of \d+$/)) hasAdTimer = true;
            });

            const adIsCurrentlyPlaying = isShortVideoAd || hasAdTimer;

            // --- AD EXECUTION STATE MACHINE ---
            if (adIsCurrentlyPlaying) {
                adWasHandled = true; 
                
                if (!isLiveStream) {
                    // VOD: Mute the 16x fast-forward noise and scrub
                    video.muted = true;
                    video.playbackRate = 16.0;
                    if (isFinite(video.duration) && video.currentTime < video.duration - 1) {
                        video.currentTime = video.duration - 0.1;
                    }
                } else {
                    // Live Stream: Just mute it
                    video.muted = true;
                }
            } 
            else if (!adIsCurrentlyPlaying && adWasHandled) {
                // THE AD FINISHED: Restore State
                adWasHandled = false;
                video.playbackRate = 1.0;
                triggerAggressiveUnmute();
            }
        }
    }
};

// Run the core engine 5 times a second
setInterval(handleAds, 200);
