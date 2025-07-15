

async function applyContainerStyles() {
  if (window.location.pathname === "/user/bookmark") {
  return;
}
  Log('applyContainerStyles() called');
  const pageMangas = [];


  chrome.storage.local.get('userBookmarks', data => {
  const bookmarks = data.userBookmarks || [];
  const container = document.querySelector('.original.card-lg');
  if (container) {
    const mangaDivs = container.querySelectorAll(':scope > div');
    mangaDivs.forEach(item => {
    const title = item.querySelector('.inner .info a').textContent.trim()
    if (title) {
    pageMangas.push(title);
    Log(`Title found: ${title}`);
    }
  });
  }


const matchedBookmarks = bookmarks.filter(bookmark =>
  pageMangas.includes(bookmark.title)
);

matchedBookmarks.forEach(bookmark => {
  Log(`Bookmark found: ${bookmark.title} with status: ${bookmark.status}`);
  const status = bookmark.status.trim().toLowerCase();
  const element = [...document.querySelectorAll('.inner .info a')]
  .find(el => el.textContent.trim() === bookmark.title);

  if (element) {
    let borderColor;

            if (status === 'reading') {
              borderColor = 'green'
            } else if (status === 'dropped') {
              borderColor = 'red'
            } else if (status === 'completed') {
              borderColor = 'blue'
            } else if (status === 'on-hold') {
              borderColor = 'orange'
            } else if (status === 'plan to read') {
              borderColor = 'grey'
            } else {
                chrome.storage.local.get('CustomBookmarksfeatureEnabled', data => {
                if (data.CustomBookmarksfeatureEnabled) {
                  Log(`Custom bookmarks feature is enabled, checking for custom colors for status: ${status}`);
                  chrome.storage.local.get('customBookmarks', data => {
                  const customBookmarks = data.customBookmarks || [];
                  Log(`Custom bookmarks loaded: ${customBookmarks.length} items`);
                    customBookmarks.forEach(custombookmark => {
                      Log(`Checking custom bookmark: ${custombookmark.name} with status: ${status}`);
                      if( custombookmark.name == status){
                        borderColor = custombookmark.color;
                        Log(`Custom color found for status ${status}: ${borderColor}`);
                        element.closest('.inner').style.border = `4px solid ${borderColor}`;
                      }
                    });
                  })
                }
                });
              }
            
    

    element.closest('.inner').style.border = `4px solid ${borderColor}`;
  }
});



});


}

window.addEventListener('load', () => {
  applyContainerStyles();
});

function Log(txt) {
  chrome.runtime.sendMessage({ type: "log", text: txt });
}

function waitForMessage(filterFn) {
  return new Promise(resolve => {
    function handler(msg, sender, sendResponse) {
      if (!filterFn || filterFn(msg, sender)) {
        chrome.runtime.onMessage.removeListener(handler);
        resolve(msg);
      }
    }
    chrome.runtime.onMessage.addListener(handler);
  });
}