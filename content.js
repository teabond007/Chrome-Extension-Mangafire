

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
              borderColor = 'green';
            } else if (status === 'dropped') {
              borderColor = 'red';
            } else if (status === 'completed') {
              borderColor = 'blue';
            } else if (status === 'on-hold') {
              borderColor = 'orange';
            }

    element.closest('.inner').style.border = `4px solid ${borderColor}`;
  }
});



});



/*mangaDivs.forEach(item => {
    const inner = item.querySelector('.inner');
    if (inner) {
  inner.style.border = '1px solid rgb(0, 255, 8)'; // Green border
    }
  });
  */
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