// A basic observer to zap ad elements as they appear
const adSelectors = [
  ".ad-showing", 
  ".ytp-ad-overlay-container", 
  "#player-ads",
  ".hotstar-ads-container" // Hypothetical selector for Hotstar
];

const observer = new MutationObserver(() => {
  adSelectors.forEach(selector => {
    const ads = document.querySelectorAll(selector);
    ads.forEach(ad => ad.remove());
  });

  // Specifically for YouTube video ads:
  const video = document.querySelector('video');
  const skipBtn = document.querySelector('.ytp-ad-skip-button');
  
  if (skipBtn) {
    skipBtn.click();
  }
  
  if (video && document.querySelector('.ad-interrupting')) {
    video.currentTime = video.duration; // Fast-forward to the end of the ad
  }
});

observer.observe(document.body, { childList: true, subtree: true });
