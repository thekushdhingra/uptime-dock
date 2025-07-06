# 🚢 Uptime Dock

**Uptime Dock** is a self-hosted monitoring tool that keeps an eye on your URLs and gives you beautiful, easy-to-read charts so you always know what’s up (literally). It pings your URLs every 30 minutes and lets you track uptime history — all wrapped in a slick UI.

---

## ⚡ Features

- 🔗 **URL Monitoring** — Add and manage URLs to keep tabs on.
- 📈 **Historical Charts** — Visualize uptime and errors with clear, color-coded graphs.
- 🔄 **Auto Pings** — Runs health checks every 30 minutes, no manual refresh needed.
- 💅 **Pretty UI** — Built with modern React and styled to be actually nice to look at.
- 🧠 **Self-Hosted** — You own everything. No third-party data leaks.

---

## 🛠️ Tech Stack

- **Backend**: Python + FastAPI
- **Frontend**: React + Tailwind (or whatever you’re using for styling)
- **Database**: SQLite / PostgreSQL (depending on your setup)
- **Ping Logic**: Custom scheduler with 30-minute intervals

---

## Usage Guide

### Make sure you have docker installed!

**Run this**

```
docker run --name uptime-dock -p 8000:8000 kushdhingra/uptime-dock:latest
```
