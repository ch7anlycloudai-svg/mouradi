# WWenatou Shopping

Premium women's e-commerce store for Mauritania. Built with React + Express.js + PostgreSQL.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js (Node.js 18+/22)
- **Database**: PostgreSQL 13+
- **Auth**: JWT + bcrypt
- **Uploads**: Local filesystem (multer)

## Project Structure

```
├── app.js                  # Production startup file
├── package.json            # Root dependencies
├── database.sql            # PostgreSQL schema + seed data
├── .env.example            # Environment variables template
├── uploads/                # Uploaded images (auto-created)
├── backend/
│   ├── .env                # Backend environment variables
│   └── src/
│       ├── server.js       # Express server
│       ├── config/
│       │   └── database.js # PostgreSQL connection pool
│       ├── middleware/
│       │   ├── auth.js     # JWT authentication
│       │   ├── upload.js   # File upload handling
│       │   └── validate.js # Request validation
│       ├── routes/
│       │   ├── admin.js    # Admin CRUD routes
│       │   ├── auth.js     # Login/verify routes
│       │   └── public.js   # Public API routes
│       └── utils/
│           └── seed.js     # Database seed script
└── frontend/
    ├── src/                # React source code
    └── dist/               # Built frontend (generated)
```

---

## Deployment Guide — DZSecurity Starter (cPanel + Node.js 22)

### 1. GitHub Repository

Push the project to a GitHub repository. Make sure `.env`, `node_modules/`, and `uploads/` are in `.gitignore` (they already are).

### 2. Create PostgreSQL Database in cPanel

1. Log in to cPanel
2. Go to **PostgreSQL Databases**
3. Create a new database (e.g., `youruser_wwenatou`)
4. Create a new PostgreSQL user with a strong password
5. Add the user to the database with **ALL PRIVILEGES**

### 3. Run the Database Schema

1. In cPanel, go to **phpPgAdmin** (or use a PostgreSQL client)
2. Select your new database
3. Open the SQL tab
4. Copy and paste the contents of `database.sql`
5. Execute the SQL — this creates all 14 tables, indexes, triggers, and seed data

The seed data creates:
- Default admin: `admin@wwenatou.com` / `admin123`
- Default store settings

### 4. Clone the Repository

SSH into your hosting or use cPanel's **Terminal**:

```bash
cd /home/youruser
git clone https://github.com/youruser/mouradi.git yourapp
```

Or use cPanel **Git Version Control** to clone the repo.

### 5. Create Node.js Application in cPanel

1. Go to **Setup Node.js App** in cPanel
2. Click **Create Application**
3. Set:
   - **Node.js version**: 22.x
   - **Application mode**: Production
   - **Application root**: `yourapp` (the directory where you cloned the repo)
   - **Application URL**: your domain or subdomain
   - **Application startup file**: `app.js`
4. Click **Create**

### 6. Set Environment Variables

In the Node.js app settings, add environment variables:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | *(leave empty or use the assigned port)* |
| `DATABASE_URL` | `postgresql://user:password@localhost:5432/youruser_wwenatou` |
| `JWT_SECRET` | *(generate a strong random string, 32+ characters)* |
| `JWT_EXPIRES_IN` | `7d` |

**Or** use individual PG variables instead of `DATABASE_URL`:

| Variable | Value |
|----------|-------|
| `PGHOST` | `localhost` |
| `PGPORT` | `5432` |
| `PGDATABASE` | `youruser_wwenatou` |
| `PGUSER` | `youruser_dbuser` |
| `PGPASSWORD` | `your_db_password` |

### 7. Install Dependencies

In cPanel's Node.js app interface, click **Run NPM Install**.

Or via terminal:

```bash
cd /home/youruser/yourapp
source /home/youruser/nodevenv/yourapp/22/bin/activate
npm install
```

### 8. Build the Frontend

```bash
npm run build
```

This compiles the React frontend into `frontend/dist/`.

### 9. Create Uploads Directory

```bash
mkdir -p uploads/products uploads/categories uploads/banners uploads/promos uploads/settings
chmod 755 uploads
```

The app auto-creates these directories, but explicit creation ensures correct permissions.

### 10. Start the Application

In cPanel's Node.js app interface, click **Restart**.

Or via terminal:

```bash
npm start
```

### 11. Verify Deployment

1. **Visit the site**: Open your domain — you should see the store homepage
2. **Test API**: Visit `https://yourdomain.com/api/health` — should return `{"status":"ok"}`
3. **Test admin login**: Go to `https://yourdomain.com/admin` and log in with `admin@wwenatou.com` / `admin123`
4. **Change the admin password** immediately after first login
5. **Test image uploads**: In the admin dashboard, try creating a product with images
6. **Test order placement**: Place a test order from the storefront

### 12. Connecting Domain/Subdomain

1. In cPanel, go to **Domains** or **Subdomains**
2. Point the domain to your application root
3. The Node.js app in cPanel handles the routing

### 13. Checking Logs

In cPanel, go to **Errors** or check the application's `stderr.log`:

```bash
cat /home/youruser/yourapp/stderr.log
```

Or in the Node.js app interface, click **View Logs**.

---

## Troubleshooting

### "Cannot connect to database"
- Verify `DATABASE_URL` or `PG*` variables are correct
- Make sure the PostgreSQL user has access to the database
- Check that `database.sql` was executed successfully

### "502 Bad Gateway" or "Application not running"
- Check the startup file is set to `app.js`
- Check Node.js version is 22.x
- Check the error logs for details
- Restart the application in cPanel

### "Images not loading"
- Ensure the `uploads/` directory exists with proper permissions (755)
- Check that image URLs start with `/uploads/`

### "CORS errors"
- Set `CORS_ORIGIN` to your domain if frontend and backend are on different origins
- In same-origin setups (default), CORS is auto-allowed

### "JWT errors after restart"
- `JWT_SECRET` must remain the same across restarts
- If changed, all existing tokens will be invalidated (users must re-login)

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up backend/.env with your local PostgreSQL credentials

# 3. Run the database schema
psql -U youruser -d wwenatou -f database.sql

# 4. Seed the database (optional, schema already includes seeds)
npm run seed

# 5. Start development (backend + frontend concurrently)
npm run dev
```

Frontend: http://localhost:3000
Backend API: http://localhost:5000

---

## Default Admin Credentials

- **Email**: admin@wwenatou.com
- **Password**: admin123

**Change immediately after first login!**
