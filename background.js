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
            const container = document.querySelector('.original.card-xs');
            const mangaDivs = container.querySelectorAll(':scope > div');

            mangaDivs.forEach(item => {
              chrome.runtime.sendMessage({ type: "log", text: "forEach item run" });
              const inner = item.querySelector('.inner');
              if (inner) {
                inner.style.border = '1px solid rgb(0, 255, 8)'; // Green border to check if the script found the element

                const title = inner.querySelector('.info a');
                chrome.runtime.sendMessage({ type: "log", text: `title: ${title.textContent.trim()}` });

                const statusBtn = inner.querySelector('.info .dropdown.width-limit.favourite button');
                chrome.runtime.sendMessage({ type: "log", text: `status: ${statusBtn.textContent.trim()}` });

                if (title && statusBtn) {
                  bookmarks.push({
                    title: title.textContent.trim(),
                    status: statusBtn.textContent.trim(),
                  });
                  chrome.runtime.sendMessage({ type: "log", text: `data pushed into Array. Array lenght: ${bookmarks.length}` }); 
                } else {
                    chrome.runtime.sendMessage({ type: "log", text: "title or statusBtn not found" });
                }



              }
    
  });
  chrome.runtime.sendMessage({ type: "log", text: "bookmarks scraped" });
  chrome.storage.local.set({ userBookmarks: bookmarks });
  chrome.runtime.sendMessage({ type: "log", text: `bookmarks saved. Array lenght: ${bookmarks.length}` });
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