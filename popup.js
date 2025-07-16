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
const toggle4 = document.getElementById("MarkHomePage");
const toggle5 = document.getElementById("SyncandMarkRead");

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
chrome.storage.local.get("MarkHomePagefeatureEnabled", (data) => {
  toggle4.checked = data.MarkHomePagefeatureEnabled ?? false;
});
chrome.storage.local.get("SyncandMarkReadfeatureEnabled", (data) => {
  toggle5.checked = data.SyncandMarkReadfeatureEnabled ?? false;
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
toggle4.addEventListener("change", () => {
  chrome.storage.local.set({ MarkHomePagefeatureEnabled: toggle4.checked });
});

toggle5.addEventListener("change", () => {
  chrome.storage.local.set({ SyncandMarkReadfeatureEnabled: toggle5.checked });
});

