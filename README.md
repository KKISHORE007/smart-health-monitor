# 🛡️ HealthWatch India
### National Smart Community Health Early Warning System

<div align="center">

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-healthwatch--monitor.vercel.app-blue?style=for-the-badge)](https://healthwatch-monitor.vercel.app/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)

</div>

---

## 🔗 Live Website

> **👉 [https://healthwatch-monitor.vercel.app/](https://healthwatch-monitor.vercel.app/)**

---

## 📖 About The Project

**HealthWatch India** is a state-of-the-art, real-time health surveillance platform designed for the **Ministry of Health, Government of India**. Its primary mission is to protect communities from waterborne disease outbreaks through proactive monitoring, district-level data collection, and automated early-warning alerts.

The system acts as a **"digital sentinel"** for public health — bridging the gap between frontline patients and high-level health officials.

---

## 🚀 What The Project Does

| Step | Action |
|------|--------|
| 📋 **Collect** | Patients and health workers report symptoms at the local hospital/district level |
| 🧠 **Detect** | A proprietary algorithm automatically analyzes reports to detect outbreak clusters (e.g., 3+ people in the same area sharing symptoms of a specific waterborne disease) |
| 🚨 **Alert** | The moment a cluster is detected, an Active Outbreak Alert is triggered and dispatched to the local Doctor and State Health Minister |
| 🏥 **Manage** | Doctors track individual patients, manage containment efforts, and officially "resolve" outbreaks once the risk has passed |

---

## ✨ Key Features

### 1. 👥 Multi-Role Ecosystem

- **Patient Portal** — Easy reporting of symptoms and location data
- **Doctor Dashboard** — A command center for managing local outbreaks, viewing detailed patient symptom histories, and resolving alerts
- **Health Minister Dashboard** — High-level oversight for an entire state, featuring real-time outbreak stats and an "Inbox" for historical analysis
- **Super Admin Portal** — Management of all state-level credentials and the ability to "Unlock" health portals for specific states

---

### 2. 🧬 Advanced Outbreak Logic

- **Disease Detection Matrix** — Automatically maps symptoms (Fever, Diarrhea, Dehydration, etc.) to likely waterborne diseases like Cholera, Typhoid, or Dysentery
- **Smart Grouping** — Sophisticated backend logic that ensures new cases trigger fresh alerts even if a similar outbreak occurred in the same district previously
- **Inbox/Active Separation** — Resolved cases are automatically archived into an "Inbox" for the Health Minister, keeping the "Active Alerts" tab clean and focused on emergencies

---

### 3. 📊 Data Visualization & Analytics

- **Real-time Charts** — Integrated `recharts` for visual tracking of disease trends at both state and district levels
- **Patient Sorting** — Doctors can sort patient records by Newest/Oldest submission date or Alphabetically to prioritize care
- **Symptom Breakdown** — Deep-dive views into exactly which symptoms each patient is experiencing

---

### 4. 🎨 Premium UI/UX Design

- **Glassmorphic Interface** — A high-end, dark-themed design using Glassmorphism for a modern, professional look
- **Interactive Branding** — A stunning landing page with animated SVG backgrounds representing hospital facilities, surveillance maps, and health teams in action
- **Responsive Layout** — Optimized for both large-screen dashboard monitoring and mobile symptom reporting

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React.js with Vanilla CSS for custom, high-performance styling |
| **Backend** | Node.js with Vercel Serverless Functions |
| **Database** | Real-time storage of symptom reports, user profiles, and alert states |
| **Charts** | Recharts for data visualization |
| **Deployment** | Vercel with automated CI/CD pipeline integrated with GitHub |

---

## 🌐 Deployment

The project is fully deployed and accessible at:

**[https://healthwatch-monitor.vercel.app/](https://healthwatch-monitor.vercel.app/)**

Powered by a fully automated CI/CD pipeline integrated with GitHub and Vercel — every push to `main` triggers an automatic deployment.

---

<div align="center">

Made with ❤️ for a healthier India 🇮🇳

</div>
