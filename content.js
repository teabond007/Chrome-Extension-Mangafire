function applyContainerStyles() {
  const container = document.querySelector('.original.card-lg');

  if (container) {
    container.style.background = '#fce4ec';
    container.style.padding = '5px';
    container.style.borderRadius = '3px';
    console.log('✅ Styled container');
    
    
const mangaDivs = container.querySelectorAll(':scope > div');

  mangaDivs.forEach(div => {
    div.style.border = '3px solid #1976d2'; // Blue border
    div.style.borderRadius = '6px';

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

