// Main function run on mangafire/ page load
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
  var pageMangas = [];
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
    crossRefrencBookmarks(pageMangas, (matched) => {
      Log("Matched Bookmarks:", matched);
      applyAndColorBorders(matched);
 
    

});
  autoSync();
}








/**
 * gets local data userBookmarks and checks if foundMangas has any titles similar.
 * outputs objects with title and status if they are saved && on page
 * @returns An array of titles that are saved(Bookmarked) && on screen through callback
 * @param {Array} foundMangaTitles all found bookmarks on the page
 */
function crossRefrencBookmarks(foundMangaTitles, callback){
  Log(`crossRefrencBookmarks(), foundMangaTitles: ${foundMangaTitles}`)
  chrome.storage.local.get("userBookmarks", (data) => {

    // finds title of mangas on page and croos refrences them with saved bookmarks
    const bookmarks = data.userBookmarks || [];
 
    const matchedBookmarks = bookmarks.filter((bookmark) =>
      foundMangaTitles.includes(bookmark.title)
    )
    Log(`SIMILARITIES: ${matchedBookmarks}`)
    callback(matchedBookmarks); // return via callback
  });
}

/**
 * 
 * @param {Array} mangasToColor - Array of objects; [title: One piece, status: Reading]
 * @param {String} querySelectToTitle - string to find title on page; ".inner .info a"
 */
function applyAndColorBorders(mangasToColor, querySelectToTitle){
  chrome.storage.local.get(
      [
        "CustomBookmarksfeatureEnabled",
        "customBookmarks",
        "CustomBorderSizefeatureEnabled",
        "CustomBorderSize",
        "SyncandMarkReadfeatureEnabled",
      ],
      (data) => {
        Log("massive local storage get done")
        mangasToColor.forEach((bookmark) => {
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

function autoSync(){
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