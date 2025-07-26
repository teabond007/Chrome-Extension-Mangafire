// Colors Borders of saved mangas
async function applyContainerStyles() {
  //doesnt run on pages that are loaded multiple times because of scrapers
  if (window.location.pathname === "/user/bookmark") {
    return;
  } else if (window.location.pathname === "/user/reading") {
    return;
  }

  //Every Log is displayed on settings.html
  //settings page has to be open to register logs
  //dev tools dont work on mangafire.to this is alternative of console.log
  Log("applyContainerStyles() called");
  const pageMangas = [];

  chrome.storage.local.get("userBookmarks", (data) => {
    // finds title of mangas on page and croos refrences them with saved bookmarks
    const bookmarks = data.userBookmarks || [];
    const container = document.querySelector(".original.card-lg");
    if (container) {
      const mangaDivs = container.querySelectorAll(":scope > div");
      mangaDivs.forEach((item) => {
        const title = item.querySelector(".inner .info a").textContent.trim();
        if (title) {
          pageMangas.push(title);
          Log(`Title found: ${title}`);
        }
      });
    }
    // saves only mangas that are on the page and in the bookmarks
    const matchedBookmarks = bookmarks.filter((bookmark) =>
      pageMangas.includes(bookmark.title)
    );
    chrome.storage.local.get(
      [
        "CustomBookmarksfeatureEnabled",
        "customBookmarks",
        "CustomBorderSizefeatureEnabled",
        "CustomBorderSize",
        "SyncandMarkReadfeatureEnabled",
      ],
      (data) => {
        matchedBookmarks.forEach((bookmark) => {
          const status = bookmark.status.trim().toLowerCase();
          const element = [...document.querySelectorAll(".inner .info a")].find(
            (el) => el.textContent.trim() === bookmark.title
          );

          if (element) {
            // at end of chain colors the border with set size 4px if true; custom size if false
            const nothingwrong = true;
            var borderColor;
            const borderSize = data.CustomBorderSize;

            if (status === "reading") {
              borderColor = "green";
            } else if (status === "dropped") {
              borderColor = "darkred";
            } else if (status === "completed") {
              borderColor = "blue";
            } else if (status === "on-hold") {
              borderColor = "orange";
            } else if (status === "plan to read") {
              borderColor = "lightgreen";
            } else if (
              status === "read" &&
              data.SyncandMarkReadfeatureEnabled
            ) {
              borderColor = "grey";
            } else if (data.CustomBookmarksfeatureEnabled) {
              const customBookmarks = data.customBookmarks || [];
              customBookmarks.forEach((custombookmark) => {
                if (custombookmark.name == status) {
                  borderColor = custombookmark.color;
                }
              });
            } else {
              nothing = false;
            }
            if (nothingwrong) {
              if (data.CustomBorderSizefeatureEnabled) {
                element.closest(
                  ".inner"
                ).style.border = `${borderSize}px solid ${borderColor}`;
              } else {
                element.closest(
                  ".inner"
                ).style.border = `4px solid ${borderColor}`;
              }
            }
          }
        });
      }
    );
  });

  chrome.storage.local.get(
    ["AutoSyncfeatureEnabled", "SyncLastDate", "SyncEverySetDate"],
    (data) => {
      datebool = data.AutoSyncfeatureEnabled ?? false;
      if (datebool) {
        if (
          Date.now() - data.SyncLastDate >=
          data.SyncEverySetDate * 24 * 60 * 60 * 1000
        ) {
          chrome.runtime.sendMessage({ type: "scrapeBookmarks", value: 1 });
        }
      }
    }
  );
}

window.addEventListener("load", () => {
  applyContainerStyles();
});

function Log(txt) {
  chrome.runtime.sendMessage({ type: "log", text: txt });
}

function waitForMessage(filterFn) {
  return new Promise((resolve) => {
    function handler(msg, sender, sendResponse) {
      if (!filterFn || filterFn(msg, sender)) {
        chrome.runtime.onMessage.removeListener(handler);
        resolve(msg);
      }
    }
    chrome.runtime.onMessage.addListener(handler);
  });
}
