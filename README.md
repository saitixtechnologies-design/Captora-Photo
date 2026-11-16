# Captora website and admin dashboard

The website remains a Vite/React app. The admin API is a separate Node service that uses MongoDB Atlas (via Mongoose) for admin accounts, services, gallery, enquiries and feedback. Uploaded files are served by the API under `/api/uploads`.

## Local setup

Requirements: Node.js 20.19+ or 22.12+, npm, and a MongoDB Atlas cluster.

1. In MongoDB Atlas: create a database user, allow your IP under **Network Access**, then copy the connection string (Connect → Drivers).
2. Paste it as `MONGO_URI` in `backend/.env` (put the database name, e.g. `captora`, before the `?`). Collections are created automatically on first use. Keep that file private; it is ignored by Git. Configure `ADMIN_EMAIL` and a temporary `ADMIN_PASSWORD` of at least 10 characters in that file.
3. In a terminal, from `backend`, run `npm install` and then `npm run create-admin`. After the account is created, remove `ADMIN_PASSWORD` from the environment file. Keep `ADMIN_EMAIL` if you want it available for password recovery.
The setup command creates the admin account with the display name `Captora Admin`. If it cannot connect, check `MONGO_URI` and Atlas Network Access.
4. In a second terminal, from `frontend`, run `npm install` and `npm run dev`.
5. In a third terminal, from `backend`, run `npm run dev`.
6. Open the Vite address and go to `/admin/login`. The API password reset page shows a development-only reset link when SMTP is not configured.

Configure SMTP in `backend/.env` to email reset links. Production does not return reset tokens in API responses.

## Admin features

- `/admin/login`, `/admin/forgot-password`, and `/admin/reset-password`
- HttpOnly JWT session cookie; passwords are bcrypt hashed
- Services and gallery CRUD, active/inactive status, ordering, and upload previews
- Active services and gallery media are fetched by the public website
- Gallery video cards autoplay muted, loop, and play inline; the viewer supports controls
- Image uploads accept JPG, PNG, WebP, and AVIF. Video uploads accept MP4, WebM, and MOV. Admin uploads have no size limit (the database's free space is the only limit). `MAX_UPLOAD_MB` only limits the public feedback photo.

## Going live

- Deploy the frontend and API behind the same HTTPS origin. Route `/api` (including `/api/uploads`) to the Node API and serve the built frontend for the rest of the site. The Vite proxy only applies during local development.
- Use a Node-capable host and set the production environment variables from `backend/.env.example` in the host's secret/environment settings. Use a random `JWT_SECRET` with at least 32 characters, set `NODE_ENV=production`, set the exact public site origin in `FRONTEND_ORIGIN`, and set `RESET_LINK_DEV_MODE=false`.
- Configure SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`) before enabling password recovery in production.
- Uploaded photos and videos are stored in MongoDB (GridFS bucket `media`) and served from `/api/media/:id`. Photos are converted to WebP (max 2560px) before saving, and the site requests smaller widths with `?w=`. `UPLOAD_DIR` is only a temporary folder during uploads. Atlas free (M0) clusters hold 512 MB in total, so keep videos short or upgrade the cluster.
- Set `MONGO_URI` on the host and allow the host's outbound IPs in Atlas → Network Access (or `0.0.0.0/0` if the host has no fixed IP). The Atlas user only needs read/write on the Captora database.
