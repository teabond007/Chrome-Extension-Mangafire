// Main function run on mangafire/ page load
function applyContainerStyles() {
  //doesnt run on pages that are loaded multiple times because of scrapers
  if (window.location.pathname === "/user/bookmark") {
    return;
  } else if (window.location.pathname === "/user/reading") {
    return;
  } else if (window.location.pathname === "/home") {
    applyContainerStylesHomePage();
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
    applyAndColorBorders(matched, ".inner .info a", ".inner");
  });
  autoSync();
}


function applyContainerStylesHomePageOnLoad(){
//second part
Log("Homepage script executing");
    const topTrendingMangas = [];
    const mostViewedMangasDay = [];
    const mostViewedMangasWeek = [];
    const mostViewedMangasMonth = [];
    const newReleasesMangas = [];
    document.querySelectorAll(".swiper-slide").forEach((el) => {
      if (el.closest("#top-trending")) {
        
        //el.querySelector(".swiper-inner .info").style.setProperty("border-left", "4px solid darkblue", "important");
        let title = el
          .querySelector(".swiper-inner .info .above a")
          .textContent.trim();
        if (!topTrendingMangas.includes(title)) {
          topTrendingMangas.push(title);
          Log(`topTrending title: ${title}`);
        }
      } else if (el.closest("#most-viewed")) {
        if (el.closest('.tab-content[data-name="day"]')) {
          let title = el.querySelector("a span").textContent.trim();
          if (!mostViewedMangasDay.includes(title)) {
            mostViewedMangasDay.push(title);
            Log(`day title: ${title}`);
          }
        } else if (el.closest('.tab-content[data-name="week"]')) {
          let title = el.querySelector("a span").textContent.trim();
          if (!mostViewedMangasWeek.includes(title)) {
            mostViewedMangasWeek.push(title);
            Log(`week title: ${title}`);
          }
        } else if (el.closest('.tab-content[data-name="month"]')) {
          let title = el.querySelector("a span").textContent.trim();
          if (!mostViewedMangasMonth.includes(title)) {
            mostViewedMangasMonth.push(title);
            Log(`month title: ${title}`);
          }
        }
      } else {
        let title = el.querySelector("a span").textContent.trim();
        if (!newReleasesMangas.includes(title)) {
          newReleasesMangas.push(title);
          Log(`new release title: ${title}`);
        }
      }
    });

    crossRefrencBookmarks(topTrendingMangas, (matched) => {
      Log("crossRefrencBookmarks() for top trending mangas");
      applyAndColorBordersForTopTrendingMangas(
        matched,
      );
    });
    crossRefrencBookmarks(mostViewedMangasDay, (matched) => {
      Log("crossRefrencBookmarks()");
      applyAndColorBorders(
        matched,
        '.tab-content[data-name="day"] a span',
        "a"
      );
    });
    crossRefrencBookmarks(mostViewedMangasWeek, (matched) => {
      Log("crossRefrencBookmarks()");
      applyAndColorBorders(
        matched,
        '.tab-content[data-name="week"] a span',
        "a"
      );
    });
    crossRefrencBookmarks(mostViewedMangasMonth, (matched) => {
      Log("crossRefrencBookmarks()");
      applyAndColorBorders(
        matched,
        '.tab-content[data-name="month"] a span',
        "a"
      );
    });
    crossRefrencBookmarks(newReleasesMangas, (matched) => {
      Log("crossRefrencBookmarks()");
      applyAndColorBorders(matched, ".swiper.completed a span", "a");
    });
}
/**
 *
 */
function applyContainerStylesHomePage() {
  Log("applyContainerStylesHomePage() called");
  var pageMangas = [];

  //get titles for midlle mangas: recently updated
  var container = document.querySelector('.tab-content[data-name="all"]');
  if (container) {
    var mangaDivs = container.querySelectorAll(".unit");
    mangaDivs.forEach((item) => {
      const title = item.querySelector(".info a").textContent.trim();
      if (title && !pageMangas.includes(title)) {
        pageMangas.push(title);
        Log(`Title recently updated found: ${title}`);
      }
    });
    crossRefrencBookmarks(pageMangas, (matched) => {
      Log("--------------Matched Bookmarks:", matched);
      applyAndColorBorders(
        matched,
        '.tab-content[data-name="all"] .info a',
        ".inner"
      );
    });
    pageMangas = [];
  }

}

/**
 * gets local data userBookmarks and checks if foundMangas has any titles similar.
 * outputs objects with title and status if they are saved && on page
 * @returns An array of titles that are saved(Bookmarked) && on screen through callback
 * @param {Array} foundMangaTitles all found bookmarks on the page
 */
function crossRefrencBookmarks(foundMangaTitles, callback) {
  Log(`crossRefrencBookmarks(), foundMangaTitles: ${foundMangaTitles}`);
  chrome.storage.local.get("userBookmarks", (data) => {
    // finds title of mangas on page and croos refrences them with saved bookmarks
    const bookmarks = data.userBookmarks || [];

    const matchedBookmarks = bookmarks.filter((bookmark) =>
      foundMangaTitles.includes(bookmark.title)
    );
    matchedBookmarks.forEach((item) => {
      Log(`Title: ${item.title}, Status: ${item.status}`);
    });
    callback(matchedBookmarks); // return via callback
  });
}

/**
 *@param {String} elementClosestSelector - String to find the correct div to color from where title is; ".inner"
 * @param {Array} mangasToColor - Array of objects; [title: One piece, status: Reading]
 * @param {String} querySelectToTitle - string to find title on page; ".inner .info a"
 */
function applyAndColorBorders(
  mangasToColor,
  querySelectToTitle,
  elementClosestSelector
) {
  chrome.storage.local.get(
    [
      "CustomBookmarksfeatureEnabled",
      "customBookmarks",
      "CustomBorderSizefeatureEnabled",
      "CustomBorderSize",
      "SyncandMarkReadfeatureEnabled",
    ],
    (data) => {
      Log("massive local storage get done");
      Log(
        `querySelectToTitle: ${querySelectToTitle};    elementClosestSelector: ${elementClosestSelector}`
      );
      mangasToColor.forEach((bookmark) => {
        const status = bookmark.status.trim().toLowerCase(); //".inner .info a"
        const element = [...document.querySelectorAll(querySelectToTitle)].find(
          (el) => el.textContent.trim() === bookmark.title
        );

        if (element) {
          //  Log(`applyColors title: ${bookmark.title}`)
          // at end of chain colors the border with set size 4px if true; custom size if false

          var borderColor;
          var borderStyle = "solid";
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
          } else if (status === "read" && data.SyncandMarkReadfeatureEnabled) {
            borderColor = "grey";
          }
          if (data.CustomBookmarksfeatureEnabled) {
            const customBookmarks = data.customBookmarks || [];
            customBookmarks.forEach((custombookmark) => {
              if (custombookmark.name == status) {
                borderColor = custombookmark.color;
                borderStyle = custombookmark.style;
              }
            });
          }

          if (data.CustomBorderSizefeatureEnabled) {
            element.closest(
              elementClosestSelector
            ).style.border = `${borderSize}px ${borderStyle} ${borderColor}`;
          } else {
            element.closest(
              elementClosestSelector
            ).style.border = `4px ${borderStyle} ${borderColor}`;
          }
        }
      });
    }
  );
}
/**
 * 
 * @param {Array} mangasToColor 
 */
function applyAndColorBordersForTopTrendingMangas(mangasToColor) {
    chrome.storage.local.get(
    [
      "CustomBookmarksfeatureEnabled",
      "customBookmarks",
      "CustomBorderSizefeatureEnabled",
      "CustomBorderSize",
      "SyncandMarkReadfeatureEnabled",
    ],
    (data) => {
      Log("applyAndColorBordersForTopTrendingMangas()");
      mangasToColor.forEach((bookmark) => {
        const status = bookmark.status.trim().toLowerCase(); //".inner .info a"
        const element = [...document.querySelectorAll("#top-trending .swiper-inner .info .above a")].find(
          (el) => el.textContent.trim() === bookmark.title
        );
        Log("1")
        Log("bookmark title: " + bookmark.title);
        if (element) {
          //  Log(`applyColors title: ${bookmark.title}`)
          // at end of chain colors the border with set size 4px if true; custom size if false

          var borderColor;
          var borderStyle;
          const borderSize = data.CustomBorderSize;
          Log("2")
          
          if (data.CustomBookmarksfeatureEnabled) {
            const customBookmarks = data.customBookmarks || [];
            customBookmarks.forEach((custombookmark) => {
              if (custombookmark.name === status) {
                borderColor = custombookmark.color;
                borderStyle = custombookmark.style;
              }
            });
          } else if (status === "reading") {
            borderColor = "green";
          } else if (status === "dropped") {
            borderColor = "darkred";
          } else if (status === "completed") {
            borderColor = "blue";
          } else if (status === "on-hold") {
            borderColor = "orange";
          } else if (status === "plan to read") {
            borderColor = "lightgreen";
          } else if (status === "read" && data.SyncandMarkReadfeatureEnabled) {
            borderColor = "grey";
          }
         Log("3")
          if (data.CustomBorderSizefeatureEnabled) {
            element.closest(
              ".info"
            ).style.setProperty("border-left", `${borderSize}px ${borderStyle} ${borderColor}`, "important");
          } else {
            let gej = element.closest(
              ".swiper-inner"
            )
            gej.querySelector(".info").style.setProperty("border-left", `4px solid red`, "important");
          }
          Log("4")
        }
      });
    }
  );
}

window.addEventListener("load", () => {
  if (window.location.pathname === "/home") {
    chrome.storage.local.get(
      ["MarkHomePagefeatureEnabled"],
      (data) => {
        if (data.MarkHomePagefeatureEnabled) {
          applyContainerStylesHomePageOnLoad();
          applyContainerStylesHomePage();
        }
      }
    );
   
    
    

    var mostViewedTab = document.getElementsByClassName(
      "trending-button-next"
    )[0];
    mostViewedTab.addEventListener("click", applyContainerStylesHomePage);
    mostViewedTab = document.getElementsByClassName("trending-button-prev")[0];
    mostViewedTab.addEventListener("click", applyContainerStylesHomePage);

    const tabs = document.querySelectorAll(".tabs");
    tabs.forEach((tab) => {
      tab.addEventListener("click", applyContainerStylesHomePage);
    });
    //second part
    
  } else {
    applyContainerStyles();
  }

  // Capture reading history if on a reader page
  if (window.location.pathname.startsWith("/read/")) {
    const currentUrl = window.location.href;
    chrome.storage.local.get(["userbookmarkshistory"], (data) => {
      let history = data.userbookmarkshistory || [];
      // Remove if already exists to move to top
      history = history.filter(url => url !== currentUrl);
      // Add to front
      history.unshift(currentUrl);
      // Keep only 10
      if (history.length > 10) history = history.slice(0, 10);
      
      chrome.storage.local.set({ userbookmarkshistory: history });
    });
  }
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

function autoSync() {
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
