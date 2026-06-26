<div align="center">

<img src="frontend/public/logo-white.png" alt="NimbusCloud Logo" width="100" />

# NimbusCloud

**Il tuo spazio cloud personale. Sicuro, elegante, sempre con te.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Demo](#) · [Segnala un Bug](issues) · [Richiedi una Feature](issues)

</div>

---

## ✨ Panoramica

**NimbusCloud** è una piattaforma cloud personale full-stack che ti permette di caricare, organizzare e condividere file in modo sicuro, direttamente dal tuo server. Progettata con un'interfaccia moderna, animazioni fluide e un'esperienza mobile-first.

> 🔒 **Niente terze parti.** I tuoi file rimangono sui tuoi server.

---

## 🚀 Funzionalità

| Funzionalità | Descrizione |
|---|---|
| 🔐 **Autenticazione JWT** | Login, registrazione e sessioni sicure con token JWT (7 giorni) |
| 🔑 **Reset password via OTP** | Codice OTP inviato via email con scadenza di 15 minuti |
| 👤 **Profilo personalizzabile** | Nome, cognome, data di nascita e foto profilo caricabile |
| 📁 **Gestione file avanzata** | Upload, anteprima, download, rinomina, elimina, cestino (soft delete) |
| 🗂️ **Cartelle nidificate** | Struttura ad albero infinita con drag-and-drop (cut/copy/paste) |
| ⭐ **Preferiti & Cestino** | Aggiungi file/cartelle ai preferiti e ripristina file dal cestino |
| 🖼️ **Miniature Automatiche** | Generazione automatica di thumbnail per immagini caricate |
| 📄 **Syntax Highlighting** | Visualizzatore di codice integrato con formattazione automatica |
| 🔗 **Link di condivisione** | Genera URL pubblici con scadenza opzionale |
| 💬 **Chat di supporto** | Comunicazione real-time tra utente e sviluppatore |
| 📱 **Mobile-first & PWA** | Design responsive nativo e installabile come app PWA |
| 🌓 **Streaming file** | Anteprima di immagini, video e audio direttamente nel browser |
| 📦 **Chunked Uploads** | Supporto per caricamenti di file enormi a blocchi |
| 💳 **Piani e Quota Storage** | Limiti di storage personalizzati (Free: 1GB, Premium: 50GB) |

---

## 🛠️ Stack Tecnologico

### Frontend
```
React 18 + TypeScript · Tailwind CSS · Framer Motion
Zustand (state management) · Axios · React Router v7
Lucide React · Vite 6
```

### Backend
```
Node.js 20 + Express · TypeScript
Prisma ORM · PostgreSQL 15
JWT (jsonwebtoken) · bcrypt · Multer · Nodemailer
```

### Infrastruttura
```
Docker + Docker Compose
Caddy (reverse proxy con HTTPS automatico)
```

---

## 🏗️ Architettura

```
cloud/
├── frontend/                  # React SPA (Vite)
│   ├── src/
│   │   ├── api/               # Client HTTP (axios)
│   │   ├── components/        # Componenti riutilizzabili
│   │   │   ├── Navbar.tsx     # Top bar + Mobile bottom nav
│   │   │   ├── DeveloperChat.tsx
│   │   │   ├── FileViewer.tsx
│   │   │   └── UploadZone.tsx
│   │   ├── pages/             # Pagine dell'app
│   │   │   ├── AuthPage.tsx
│   │   │   ├── HomePage.tsx
│   │   │   ├── FilesPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   └── store/             # Zustand stores
├── backend/                   # Express API
│   ├── src/
│   │   ├── controllers/       # Handler delle richieste
│   │   ├── routes/            # Definizione routes
│   │   ├── middlewares/       # Auth JWT middleware
│   │   ├── services/          # Email service (Nodemailer)
│   │   └── config/            # Multer, config
│   ├── prisma/
│   │   └── schema.prisma      # Schema database
│   └── uploads/               # File caricati dagli utenti
├── docker-compose.yml
└── Caddyfile
```

---

## 📊 Schema Database

```prisma
model User {
  id                String
  email             String    @unique
  password          String    // bcrypt hash
  firstName         String?
  lastName          String?
  dateOfBirth       DateTime?
  avatarPath        String?
  files             File[]
  folders           Folder[]
  chatMessages      ChatMessage[]
  passwordResetOtps PasswordResetOtp[]
}

model File {
  id         String
  name       String
  size       Int
  mimeType   String
  folderId   String?   // nullable = root
  shares     Share[]
}

model Folder {
  id       String
  name     String
  parentId String?   // albero infinito
  files    File[]
  children Folder[]
}

model Share {
  token     String    @unique
  expiresAt DateTime?
}
```

---

## ⚡ Avvio Rapido

### Prerequisiti
- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- [Node.js 20+](https://nodejs.org/) (solo per sviluppo frontend)

### 1. Clona il repository

```bash
git clone https://github.com/tuo-username/nimbuscloud.git
cd nimbuscloud
```

### 2. Avvia il backend (Docker)

```bash
docker compose up -d --build
```

Il backend sarà disponibile su `http://localhost:5000`.

> Al primo avvio, esegui la migrazione del database:
> ```bash
> docker exec cloud_backend npx prisma db push
> ```

### 3. Avvia il frontend (sviluppo)

```bash
cd frontend
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

### 📱 Accesso da Mobile

Per accedere dall'app sul telefono (stessa rete Wi-Fi):

```bash
# Trova il tuo IP locale
ip route get 1.1.1.1 | awk '{print $7}'

# Poi apri dal telefono:
# http://<IP-LOCALE>:3000
```

---

## ⚙️ Variabili d'Ambiente

### Backend (`docker-compose.yml`)

| Variabile | Default | Descrizione |
|---|---|---|
| `DATABASE_URL` | postgresql://... | Connessione PostgreSQL |
| `JWT_SECRET` | *(imposta un valore sicuro)* | Segreto per firmare i token JWT |
| `PORT` | `5000` | Porta del server Express |
| `SMTP_HOST` | — | Host SMTP per le email OTP |
| `SMTP_PORT` | `587` | Porta SMTP |
| `SMTP_USER` | — | Username SMTP |
| `SMTP_PASS` | — | Password SMTP |
| `SMTP_FROM` | — | Indirizzo mittente |

> **Nota:** Senza configurazione SMTP, i codici OTP vengono stampati nei log del container anziché inviati via email.

### Frontend (`.env` opzionale)

| Variabile | Descrizione |
|---|---|
| `VITE_DEVELOPER_EMAIL` | Email dello sviluppatore per abilitare la vista admin nella chat |

---

## 📡 API Reference

### Autenticazione
| Metodo | Endpoint | Descrizione |
|---|---|---|
| `POST` | `/api/auth/register` | Registra un nuovo utente |
| `POST` | `/api/auth/login` | Login, ritorna JWT |
| `POST` | `/api/auth/forgot-password` | Invia OTP via email |
| `POST` | `/api/auth/verify-otp` | Verifica il codice OTP |
| `POST` | `/api/auth/reset-password` | Reimposta la password |

### Profilo Utente
| Metodo | Endpoint | Descrizione |
|---|---|---|
| `GET` | `/api/users/me` | Ottieni dati profilo |
| `PATCH` | `/api/users/me` | Aggiorna nome/cognome/data |
| `POST` | `/api/users/me/avatar` | Carica foto profilo (multipart) |
| `GET` | `/api/users/me/avatar` | Scarica avatar corrente |

### File
| Metodo | Endpoint | Descrizione |
|---|---|---|
| `POST` | `/api/files/upload` | Upload file (multipart) |
| `GET` | `/api/files/list` | Lista tutti i file |
| `GET` | `/api/files/:id/stream` | Streaming/anteprima file |
| `GET` | `/api/files/:id/download` | Download file |
| `PATCH` | `/api/files/:id` | Rinomina / sposta file |
| `DELETE` | `/api/files/:id` | Elimina file |

### Cartelle
| Metodo | Endpoint | Descrizione |
|---|---|---|
| `POST` | `/api/folders` | Crea cartella |
| `GET` | `/api/folders` | Lista cartelle |
| `PATCH` | `/api/folders/:id` | Rinomina cartella |
| `DELETE` | `/api/folders/:id` | Elimina cartella |

### Condivisione
| Metodo | Endpoint | Descrizione |
|---|---|---|
| `POST` | `/api/shares` | Crea link di condivisione |
| `GET` | `/api/shares/download/:token` | Scarica file condiviso |

### Chat
| Metodo | Endpoint | Descrizione |
|---|---|---|
| `GET` | `/api/chat/messages` | Messaggi della propria chat |
| `POST` | `/api/chat/messages` | Invia messaggio |
| `GET` | `/api/chat/conversations` | Lista conversazioni (solo dev) |
| `GET` | `/api/chat/messages/:userId` | Messaggi utente specifico (solo dev) |

---

## 🗺️ Roadmap

- [x] PWA (installabile come app su Android/iOS)
- [x] Quota storage per utente
- [ ] Drag & drop upload con progress bar avanzata
- [ ] Condivisione con password e scadenza personalizzata
- [ ] Tema scuro (dark mode)
- [ ] Notifiche push
- [ ] Anteprima PDF nel browser
- [ ] 2FA (autenticazione a due fattori)

---

## 🤝 Contribuire

I contributi sono i benvenuti! Per proporre una modifica:

1. Fai un **fork** del repository
2. Crea un branch: `git checkout -b feature/nuova-feature`
3. Committa le modifiche: `git commit -m 'feat: aggiungi nuova feature'`
4. Pusha il branch: `git push origin feature/nuova-feature`
5. Apri una **Pull Request**

---

## 📄 Licenza

Distribuito sotto licenza **MIT**. Vedi [`LICENSE`](LICENSE) per maggiori dettagli.

---

<div align="center">

Fatto con ❤️ da **Alessio**

*NimbusCloud — Il tuo cloud, sempre con te.*

</div>
