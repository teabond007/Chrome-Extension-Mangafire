document.getElementById("oppenSettingsBtn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById("SyncBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "scrapeBookmarks", value: 1 });
});
CustomBookmarks;

const toggle1 = document.getElementById("AutoSync");
const toggle2 = document.getElementById("CustomBookmarks");
const toggle3 = document.getElementById("CustomBorderSize");

// Load saved state on load
chrome.storage.local.get("AutoSyncfeatureEnabled", (data) => {
  toggle1.checked = data.AutoSyncfeatureEnabled ?? false;
});
chrome.storage.local.get("CustomBookmarksfeatureEnabled", (data) => {
  toggle2.checked = data.CustomBookmarksfeatureEnabled ?? false;
});
chrome.storage.local.get("CustomBorderSizefeatureEnabled", (data) => {
  toggle3.checked = data.CustomBorderSizefeatureEnabled ?? false;
});

// Save state when changed
toggle1.addEventListener("change", () => {
  chrome.storage.local.set({ AutoSyncfeatureEnabled: toggle1.checked });
});
toggle2.addEventListener("change", () => {
  chrome.storage.local.set({ CustomBookmarksfeatureEnabled: toggle2.checked });
});
toggle3.addEventListener("change", () => {
  chrome.storage.local.set({ CustomBorderSizefeatureEnabled: toggle3.checked });
});
