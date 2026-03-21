# LinkShield URL Shortener

## Make QR Work On Mobile (No localhost links)

If a short link is generated as `http://localhost:5000/...`, it will only work on the same machine.
For Google Lens and mobile devices, the link must be public.

### 1) Configure backend public URL

Create `backend/.env` from `backend/.env.example` and set:

SHORTENER_BASE_URL=https://your-public-domain.com

This value is used to generate:
- short links
- QR code target URL

### 2) Configure frontend API/link base

Create `frontend/.env` from `frontend/.env.example` and set:

VITE_API_BASE_URL=https://your-public-domain.com
VITE_SHORTENER_BASE_URL=https://your-public-domain.com

### 3) Restart servers

- Backend: `npm run start` (inside `backend`)
- Frontend: `npm run dev` (inside `frontend`)

### 4) Create a new short URL

Old URLs created with localhost will remain localhost.
Create new URLs after updating env so QR uses your public domain.

## Quick public URL option (without deployment)

Use ngrok to expose local backend:

1. Start backend on port `5000`
2. Run: `ngrok http 5000`
3. Copy ngrok `https` URL and set it as:
	- `SHORTENER_BASE_URL`
	- `VITE_API_BASE_URL`
	- `VITE_SHORTENER_BASE_URL`
4. Restart backend/frontend and create a new short URL