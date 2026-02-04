# Privacy Policy & Terms of Service

**Last Updated:** February 4, 2026

## Privacy Policy

### 1. Data Collection
This Chrome Extension ("MangaFire & Multi-Site Content Manager") is designed with a strictly **local-first** and **privacy-first** architecture.
- **We do not collect, store, or transmit any personal data.**
- **We do not use third-party analytics or tracking scripts.**
- **We do not monitor your browsing activity** outside of the specific supported domains (e.g., MangaFire.to, MangaDex.org) strictly for the purpose of highlighting content you have already interacted with.

### 2. Data Storage
- **Local Storage**: Your library (bookmarks, reading history, settings) is stored entirely on your local device using the browser's `chrome.storage.local` API.
- **Google Drive Sync (Optional)**: If you choose to enable Cloud Sync, your data is uploaded directly from your browser to your personal Google Drive "App Data" folder.
    - This data is **private** and accessible only by you.
    - The extension developers have **no access** to this data.
    - You can delete this data at any time via the extension settings or your Google Drive management.

### 3. Permissions
The extension requests the minimum permissions necessary to function:
- `storage`: To save your library locally.
- `identity`: To allow you to sign in with your Google Account for sync.
- `host_permissions` (e.g., `*://mangafire.to/*`): To modify the page appearance (inject status borders) on supported sites.

---

## Terms of Service

### 1. License & Usage
This software is provided for **personal, non-commercial use only**.
- You are free to use, modify, and inspect the source code for personal purposes.
- You are **strictly prohibited** from selling, reselling, repackaging, or commercially exploiting this extension or its source code.
- You may not redistribute this software claiming it as your own work.

### 2. Liability
The software is provided "as is", without warranty of any kind, express or implied.
- The developers are not responsible for any data loss, corruption, or other issues arising from the use of this software.
- Users are responsible for backing up their own data (e.g., using the built-in JSON Export feature).

### 3. Third-Party Services
This extension interacts with third-party websites (e.g., MangaFire, MangaDex, AniList).
- We are not affiliated with these services.
- Your use of those websites is subject to their respective Terms of Service and Privacy Policies.

### 4. Governing Law
These terms shall be governed by and construed in accordance with the laws of **Slovenia**.

### 5. Contact
For questions or support, please open an issue in the project's GitHub repository.
