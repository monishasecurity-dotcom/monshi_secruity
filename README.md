# Monisha Security Agency Website

Static website for Monisha Security Agency with a small Node.js server for local hosting and a Web3Forms-powered enquiry form.

## Run Locally

```powershell
npm install
npm start
```

Open:

```text
http://127.0.0.1:5176
```

## Web3Forms Setup

1. Create a free account at `https://web3forms.com/`
2. Create a form access key
3. Open `src/main.js` and replace:

```js
const web3FormsKey = 'YOUR_WEB3FORMS_ACCESS_KEY'
```

with your real access key.

The `.env` file is still ignored by Git and should not be committed.
