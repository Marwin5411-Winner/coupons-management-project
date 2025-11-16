# Production Deployment Guide

## Server Information
- **VPS IP**: 45.136.237.71
- **Database Server**: 45.144.164.68:5432
- **SSH**: `ssh root@45.136.237.71` (password: 53qKvY$wQN$5)

## Domain Configuration
- **Admin Dashboard**: http://coupons-admin.demo.nexmindit.com
- **Staff App**: http://coupons-staff.demo.nexmindit.com
- **API**: http://coupons-api.demo.nexmindit.com

## Prerequisites
- Bun installed ✓
- PM2 installed ✓
- Nginx installed ✓
- Wildcard DNS `*.demo.nexmindit.com` → 45.136.237.71 ✓

---

## Initial Deployment

### 1. SSH into Server
```bash
ssh root@45.136.237.71
```

### 2. Clone Repository
```bash
cd ~
git clone git@github.com:Marwin5411-Winner/coupons-management-project.git
cd coupons-management-project
```

### 3. Install Dependencies
```bash
bun install
```

### 4. Set Up Production Environment Files

The `.env.production` files are already in the repository. **Important**: Update the JWT_SECRET in `packages/api/.env.production`:

```bash
# Generate a secure JWT secret
openssl rand -base64 32

# Edit the API .env file
nano packages/api/.env.production
# Replace "change-this-to-a-secure-random-32-character-string" with the generated secret
```

### 5. Run Database Migrations
```bash
cd packages/api
bunx prisma migrate deploy
cd ../..
```

### 6. Build Frontend Applications
```bash
# Build Admin Dashboard
cd packages/web
bun run build
cd ../..

# Build Staff App
cd packages/client-web
bun run build
cd ../..
```

### 7. Configure Nginx

Copy the nginx configuration:
```bash
cp ~/coupons-management-project/nginx.conf /etc/nginx/sites-available/coupons

# Create symlink
ln -s /etc/nginx/sites-available/coupons /etc/nginx/sites-enabled/coupons

# Test configuration
nginx -t

# Reload Nginx
nginx -s reload
```

### 8. Start API with PM2
```bash
cd ~/coupons-management-project
pm2 start ecosystem.config.js
pm2 save

# Enable PM2 to start on boot (run once)
pm2 startup
```

### 9. Verify Deployment

Check PM2 status:
```bash
pm2 status
pm2 logs coupon-api
```

Test the endpoints:
```bash
# Test API
curl http://coupons-api.demo.nexmindit.com/health

# Visit in browser:
# http://coupons-admin.demo.nexmindit.com
# http://coupons-staff.demo.nexmindit.com
```

---

## Future Updates/Redeployment

When you push changes to GitHub and want to update production:

```bash
# 1. SSH into server
ssh root@45.136.237.71
cd ~/coupons-management-project

# 2. Pull latest code
git pull origin main

# 3. Install any new dependencies
bun install

# 4. Run migrations (if any schema changes)
cd packages/api
bunx prisma migrate deploy
cd ../..

# 5. Rebuild frontend apps
cd packages/web
bun run build
cd ../..

cd packages/client-web
bun run build
cd ../..

# 6. Restart API
pm2 restart coupon-api

# No need to restart Nginx (static files are updated)
```

---

## Useful Commands

### PM2 Management
```bash
# View all processes
pm2 status

# View logs
pm2 logs coupon-api
pm2 logs coupon-api --lines 100

# Restart API
pm2 restart coupon-api

# Stop API
pm2 stop coupon-api

# Delete process
pm2 delete coupon-api
```

### Nginx Management
```bash
# Test configuration
nginx -t

# Reload configuration
nginx -s reload

# Restart nginx
systemctl restart nginx

# View nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Database Commands
```bash
cd ~/coupons-management-project/packages/api

# View migration status
bunx prisma migrate status

# Apply migrations
bunx prisma migrate deploy

# Access Prisma Studio (database GUI) - optional
bunx prisma studio
```

---

## Troubleshooting

### API not responding
```bash
# Check if API is running
pm2 status

# View API logs for errors
pm2 logs coupon-api --err

# Check if port 3100 is in use
netstat -tulpn | grep 3100

# Restart API
pm2 restart coupon-api
```

### Frontend showing 404 or blank page
```bash
# Check if build directory exists
ls -la ~/coupons-management-project/packages/web/dist
ls -la ~/coupons-management-project/packages/client-web/dist

# Check nginx configuration
nginx -t

# View nginx error logs
tail -f /var/log/nginx/error.log

# Rebuild frontend
cd ~/coupons-management-project/packages/web
bun run build
```

### CORS errors in browser console
- Check that API CORS configuration includes your domains
- Verify in `packages/api/src/index.ts` lines 13-20
- Restart API after CORS changes: `pm2 restart coupon-api`

### Database connection errors
```bash
# Test database connectivity from server
cd ~/coupons-management-project/packages/api
bunx prisma db pull

# Check DATABASE_URL in .env.production
cat packages/api/.env.production
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet Traffic                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  Nginx (Port 80)       │
            │  45.136.237.71         │
            └────────┬───────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
         ▼           ▼           ▼
    ┌────────┐  ┌────────┐  ┌─────────┐
    │ Admin  │  │ Staff  │  │   API   │
    │ Static │  │ Static │  │ Proxy   │
    │ Files  │  │ Files  │  │  :3100  │
    └────────┘  └────────┘  └────┬────┘
                                  │
                                  ▼
                         ┌────────────────┐
                         │  PM2           │
                         │  coupon-api    │
                         │  (Bun/Elysia)  │
                         └────────┬───────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  PostgreSQL             │
                    │  45.144.164.68:5432     │
                    └─────────────────────────┘
```

---

## Security Notes

**Current State**: HTTP only (no SSL)
- Login credentials transmitted in plaintext
- JWT tokens transmitted in plaintext

**To Add SSL Later**:
```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get certificates for all domains
certbot --nginx -d coupons-admin.demo.nexmindit.com \
                 -d coupons-staff.demo.nexmindit.com \
                 -d coupons-api.demo.nexmindit.com

# Auto-renewal is set up automatically
```

---

## Default Credentials

After running migrations and seed:
- **Admin**: admin@coupon.com / admin123
- **Staff**: staff@coupon.com / staff123

**Change these immediately in production!**

---

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs coupon-api`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify all services are running: `pm2 status` and `systemctl status nginx`
