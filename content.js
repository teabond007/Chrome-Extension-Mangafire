function applyContainerStyles() {
  const container = document.querySelector('.original.card-lg');

  if (container) {
const mangaDivs = container.querySelectorAll(':scope > div');

mangaDivs.forEach(item => {
    const inner = item.querySelector('.inner');

    if (inner) {
  inner.style.border = '1px solid rgb(0, 255, 8)'; // Green border


    }
  });
    
    return true;
  }

  return false;
}

// Watch for dynamic content loading
const observer = new MutationObserver(() => {
  if (applyContainerStyles()) {
    observer.disconnect(); // Stop once it's found and styled
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Just in case it loads immediately (rare)
window.addEventListener('load', () => {
  applyContainerStyles();
});

