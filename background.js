chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("settings.html") });
});

// to run function chrome.runtime.sendMessage({ type: "scrapeBookmarks" });
/**
 * 
 * @param {int} pageIdentefier 
 */
function scrapeBookmarksFromUnopenedTab(pageIdentefier) {
  Log('scrapeBookmarksFromUnopenedTab() called');
  pageurl = `https://mangafire.to/user/bookmark?page=${pageIdentefier}`;
  Log(`Page URL: ${pageurl}`);
  chrome.tabs.create({ url: pageurl, active: false }, (tab) => {
    Log(`New tab created with ID: ${tab.id}`);

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          args: [pageIdentefier],
          func: (pageIdentefier) => {
            chrome.runtime.sendMessage({ type: "log", text: "executing script" });
            const bookmarks = [];
            const container = document.querySelector('.original.card-xs');
            if(!container) {
              return chrome.runtime.sendMessage({ type: "log", text: "!!!Container not found. Are you logged In Mangafire?" });
            }
            const mangaDivs = container.querySelectorAll(':scope > div');
            if (mangaDivs.length === 0) {
              chrome.runtime.sendMessage({ type: "bookmarksExtracted"});
              chrome.runtime.sendMessage({ type: "scrapeBookmarks", value: 0 });
              return;
            }

            mangaDivs.forEach(item => {
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
  chrome.storage.local.get('userBookmarks', data => {
      const existing = Array.isArray(data.userBookmarks) ? data.userBookmarks : [];
      const combined = existing.concat(bookmarks);
      chrome.storage.local.set({ userBookmarks: combined }, () => {
        chrome.runtime.sendMessage({ type: "log", text: `bookmarks saved. Array length: ${combined.length}` });
        chrome.runtime.sendMessage({ type: "bookmarksExtracted" });
        const pagevalue = pageIdentefier + 1;
        chrome.runtime.sendMessage({ type: "log", text: `Next page value: ${pagevalue}` });
        chrome.runtime.sendMessage({ type: "scrapeBookmarks", value: pagevalue });
      });
    });
}
          
        });

  });
  
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "scrapeBookmarks") {
    if (msg.value === 0) {
      Log('Message received: scrapeBookmarks. msg.value is 0. stopping further execution');
    } else if (msg.value === 1){
      chrome.storage.local.remove('userBookmarks');
      Log('Removed userBookmarks for a fresh restart');
      Log(`Message received: scrapeBookmarks, value: ${msg.value}`);
      scrapeBookmarksFromUnopenedTab(msg.value);
      Log(`Next page value: ${msg.value + 1}`);
    } else {
      Log(`Message received: scrapeBookmarks, value: ${msg.value}`);
      scrapeBookmarksFromUnopenedTab(msg.value);
      Log(`Next page value: ${msg.value + 1}`);
    }
  }
  if (msg.type === "bookmarksExtracted") {
    chrome.tabs.remove(sender.tab.id);
    Log('Tab closed after scraping');
  }
});

function Log(txt) {
  chrome.runtime.sendMessage({ type: "log", text: txt });
}
