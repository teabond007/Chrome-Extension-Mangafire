function extractBookmarks() {
  const bookmarks = [];

  const units = document.querySelectorAll('.unit');

  units.forEach(unit => {
    const info = unit.querySelector('.info a');
    const statusBtn = unit.querySelector('.dropdown.width-limit.favourite button');

    if (info && statusBtn) {
      const title = info.textContent.trim();
      const href = info.getAttribute('href');
      const status = statusBtn.textContent.trim().toLowerCase(); // e.g., "reading", "dropped"

      bookmarks.push({ title, href, status });
    }
  });

  // Optional: save to storage
  chrome.storage.local.set({ userBookmarks: bookmarks }, () => {
    console.log('✅ Bookmarks with status saved', bookmarks);
  });

  return bookmarks;
}