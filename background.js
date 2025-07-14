chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("settings.html") });
});

// to run function chrome.runtime.sendMessage({ type: "scrapeBookmarks" });
function scrapeBookmarksFromUnopenedTab() {
  Log('scrapeBookmarksFromUnopenedTab() called');
  chrome.tabs.create({ url: "https://mangafire.to/user/bookmark", active: false }, (tab) => {
    Log(`New tab created with ID: ${tab.id}`);

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
    
            chrome.runtime.sendMessage({ type: "log", text: "executing script" });
            const bookmarks = [];
chrome.runtime.sendMessage({ type: "log", text: "5" });
const container = document.querySelector('.original.card-xs');
            chrome.runtime.sendMessage({ type: "log", text: "6" });
            const mangaDivs = container.querySelectorAll(':scope > div');
chrome.runtime.sendMessage({ type: "log", text: "executing script2" });
            mangaDivs.forEach(item => {
              chrome.runtime.sendMessage({ type: "log", text: "item run" });
    const inner = item.querySelector('.inner');
    if (inner) {
  inner.style.border = '1px solid rgb(0, 255, 8)'; // Green border
  chrome.runtime.sendMessage({ type: "log", text: "color to green" });
    }
    
  });
  


              document.querySelectorAll('.unit').forEach(unit => {
              chrome.runtime.sendMessage({ type: "log", text: "1" });
    // Title and manga URL
            const title = unit.querySelectorAll('.info a');
    // Status
            const statusBtn = unit.querySelector('.dropdown.width-limit.favourite button');
    // Current chapter (optional)
            const chapterSpan = unit.querySelector('.richdata span');
            const readingLink = unit.querySelector('.richdata a.reading');

    if (titleLink && statusBtn) {
      bookmarks.push({
        title: title.textContent.trim(),
        status: statusBtn.textContent.trim(),
        chapter: chapterSpan ? chapterSpan.textContent.trim() : null,
        readingUrl: readingLink ? readingLink.getAttribute('href') : null
      });
    }
  });
  chrome.storage.local.set({ userBookmarks: bookmarks });
  chrome.runtime.sendMessage({ type: "log", text: "bookmarks scraped" });
  chrome.runtime.sendMessage({ type: "bookmarksExtracted" });
}
          
          });

        });
  
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "scrapeBookmarks") 
    {Log('Message received: scrapeBookmarks');
    scrapeBookmarksFromUnopenedTab();
     
  }
  if (msg.type === "bookmarksExtracted") {
    chrome.tabs.remove(sender.tab.id);
    Log('Tab closed after scraping');
  }
});

function Log(txt) {
  chrome.runtime.sendMessage({ type: "log", text: txt });
}