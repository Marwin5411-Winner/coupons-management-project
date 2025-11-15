# Quick Start Guide

## Prerequisites
- Bun (v1.0+)
- Docker (for PostgreSQL)

## Setup Steps

### 1. Install Dependencies
```bash
bun install
```

### 2. Start Database
```bash
# Start PostgreSQL in Docker
bun run db:start

# Or manually with docker-compose
docker-compose up -d
```

### 3. Setup Database
```bash
# Run migrations and seed data
bun run db:setup

# This will create:
# - Database tables
# - Admin user: admin@coupon.com / admin123
# - Staff user: staff@coupon.com / staff123
# - Sample campaign
```

### 4. Start Development Servers
```bash
# Start both API and Web (recommended)
bun run dev

# Or start separately:
bun run dev:api  # Backend on http://localhost:3000
bun run dev:web  # Frontend on http://localhost:5173
```

### 5. Access the Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Docs:** http://localhost:3000 (shows available endpoints)

## Test Accounts

### Admin Account
- Email: `admin@coupon.com`
- Password: `admin123`
- Access: Full dashboard, campaign management, coupon generation

### Staff Account
- Email: `staff@coupon.com`
- Password: `staff123`
- Access: QR Scanner only

## Common Commands

```bash
# Database
bun run db:start      # Start PostgreSQL
bun run db:stop       # Stop PostgreSQL
bun run db:migrate    # Run migrations
bun run db:seed       # Seed test data
bun run db:setup      # Full setup (migrate + seed)

# Development
bun run dev          # Start both API and Web
bun run dev:api      # Start API only
bun run dev:web      # Start Web only

# Build
bun run build:api    # Build API
bun run build:web    # Build Web
```

## Workflow Example

### For Admin: Create and Distribute Coupons

1. Login with admin account
2. Go to Dashboard
3. Click "Create Campaign"
4. Fill in campaign details:
   - Name: "Black Friday 2024"
   - Total Limit: 100
   - Dates: Select start and end dates
5. Click "Create Campaign"
6. On campaign detail page, generate coupons:
   - Enter quantity (e.g., 50)
   - Click "Generate Coupons"
7. Export to PDF:
   - Click "Export All Coupons to PDF"
   - Download and print
8. Distribute printed coupons to customers

### For Staff: Scan and Redeem Coupons

1. Login with staff account
2. You'll be redirected to Scanner page
3. Click "Start Scanner"
4. Allow camera access
5. Point camera at coupon QR code
6. System will:
   - Validate coupon
   - Show status (valid/used/expired)
   - Mark as used if valid
7. For manual entry:
   - Use "Enter Code Manually" section
   - Type coupon code
   - Click "Validate"

## Troubleshooting

### Database Connection Error
```bash
# Make sure PostgreSQL is running
docker ps | grep postgres

# Restart database
bun run db:stop
bun run db:start
```

### Port Already in Use
```bash
# Change ports in .env files:
# packages/api/.env - PORT=3000
# packages/web/vite.config.ts - server.port
```

### Camera Not Working (Scanner)
- Ensure you're using HTTPS in production
- Grant camera permissions in browser
- Try different browser (Chrome/Safari recommended)
- Check if camera is being used by another app

### Migration Errors
```bash
# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
bun run db:setup
```

## Next Steps

- Read full [README.md](README.md) for detailed documentation
- Customize campaign templates
- Add more validation rules
- Implement analytics dashboard
- Set up production deployment

## Support

For issues, please check:
1. Console logs (browser DevTools)
2. Server logs (terminal)
3. Database logs (`docker logs coupon-db`)
