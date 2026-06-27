*Adamvilla** is an academic lab-experiment sharing platform — basically a place where students in a lab course can upload, organize, and share their experiment files (screenshots, code, documents) by group and subject, plus a few extra tools built on top.

Here's what it offers:

**📁 Public Share (Repository)** — the core feature. You pick a **Group** (A or B) and a **Lab** (DBMS or OS), then see a list of numbered experiments. Inside each experiment you can upload single files or whole folders. Files automatically group themselves by **device** — so if you upload from your phone and then from your laptop, they show up as separate "Device 1" / "Device 2" sections instead of mixing together. There's also a "Random Experiments" area for ad-hoc uploads that don't belong to a numbered lab experiment.

**🤖 AI Folder Preview** — inside any folder of images, hit the green sparkle button and the AI looks at all the screenshots, figures out what order they were actually taken in (even if you uploaded them out of order), and gives you back clean, ready-to-run SQL/terminal commands/code — stripping out error messages, console clutter, and repeated attempts.

**🧘 Vigneshwara Swami** — a standalone AI oracle page (no chat, just upload-and-extract). Drop in images or a whole folder, pick a mode (DBMS/SQL, Linux/OS, C, or Python), and it returns the ordered, executable code. You can copy it or send it straight into an existing or brand-new experiment.

**💬 Lab Chat** — a live, real-time discussion room. Join with your name or stay anonymous.

**📧 Direct Send** — send multiple lab files to someone via email instantly, no need to log into the repository.

**🎮 Play Game** — a side feature, "Shadow Survival," a quick arcade-style dodge game for when you need a break.

**🔒 Admin Panel** — a restricted, login-gated control room (username/password protected) where an admin can add or remove labs and groups, create/delete experiments, wipe chat history, and delete any uploaded file.

**☁️ Storage** — everything's backed by Cloudinary for file hosting and MongoDB for all the structured data (experiments, files, chat), so uploads are durable and fast to load anywhere.

In short: it's a lightweight lab-portal + AI code-extraction tool + light social features (chat, game), wrapped in one dashboard.


Technical Stack Overview

### Frontend
| | |
|---|---|
| **Language** | JavaScript (JSX) |
| **Framework** | React 18.2 (Create React App / `react-scripts` 5.0.1) |
| **Styling** | Tailwind CSS 3.4 + inline CSS-in-JS |
| **HTTP Client** | Axios 1.6 |
| **Realtime** | Socket.io-client 4.7 (live lab chat room) |
| **Icons** | Lucide React |
| **Notifications** | react-hot-toast |
| **OCR (unused/legacy)** | Tesseract.js |
| **Email** | EmailJS browser SDK |
| **Hosting** | Render (static site) |

### Backend
| | |
|---|---|
| **Language** | Node.js (JavaScript) |
| **Framework** | Express 4.18 |
| **Database** | MongoDB Atlas (via Mongoose 8.0) |
| **File Storage** | Cloudinary (CDN + image hosting) + Multer + multer-storage-cloudinary |
| **Realtime** | Socket.io 4.6 (chat server) |
| **Auth/Security** | bcryptjs, jsonwebtoken, helmet, express-rate-limit |
| **Email** | Nodemailer |
| **Hosting** | Render (Node server) |

### AI / ML
| | |
|---|---|
| **Vision-capable LLM** | Groq API — `meta-llama/llama-4-scout-17b-16e-instruct` |
| **Use cases** | • Single-image AI preview (extract/explain content)<br>• Multi-image **Folder AI Preview** (auto-orders screenshots, extracts clean code)<br>• **Vigneshwara Swami** — standalone AI oracle page for SQL/Linux/C/Python extraction |
| **Architecture** | Frontend → own Express backend (`/api/swami-analyze`, `/api/folder-ai`) → Groq API. Browser never calls Groq directly (avoids CORS + hides API key) |

### Custom Engineering Highlights
- **Hardware fingerprinting** for device-grouping — hashes `navigator.platform`, screen dimensions, `devicePixelRatio`, CPU cores, RAM, touch points, timezone, color depth (FNV-1a-style hash) → same ID across all browsers on one physical device, different ID per device
- **Folder-based file organization** with drag/drop, nested device grouping, per-device color tagging
- **Admin panel** — credential-gated CRUD for labs, groups, experiments, chat logs, files
- **Real-time multi-user lab chat** via Socket.io rooms
- **Mini-game** (Shadow Survival) — separate canvas-based diversion feature

### Data Model (MongoDB collections)
- `File` — fileName, fileUrl, publicId, group, lab, experiment ref, deviceId, folderName
- `Experiment` — title, group, lab, experimentNumber, isRandom
- `ChatMessage` — username, message, 
