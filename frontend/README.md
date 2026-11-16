# Captora Photography & Films

Responsive React/Vite photography website with a MongoDB Atlas-backed admin dashboard.

## Local development

- Set `MONGO_URI` (MongoDB Atlas) in `backend/.env`.
- Configure the database and initial admin account in `backend/.env`, then run `npm install` and `npm run create-admin` from `backend`.
- Run `npm install` and `npm run dev` from `frontend`.
- Run `npm install` and `npm run dev` from `backend` in a separate terminal.
- Visit `/admin/login` to manage services and gallery content.

See the root [`README.md`](../README.md) for setup and live deployment settings. Do not commit `backend/.env` or uploaded media.
