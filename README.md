# Monisha Security Agency Website

Static website for Monisha Security Agency with a small Node.js server for local hosting and enquiry email delivery.

## Run Locally

```powershell
npm install
npm start
```

Open:

```text
http://127.0.0.1:5176
```

## Email Setup

Create a local `.env` file with SMTP settings:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

The `.env` file is ignored by Git and should not be committed.

## Git LFS

Large media files such as videos are tracked with Git LFS.
