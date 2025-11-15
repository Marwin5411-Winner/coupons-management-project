# Coupon Management System

ระบบจัดการคูปองแบบครบวงจร พัฒนาด้วย Bun, Elysia.js, React, และ PostgreSQL

## Features

### ระบบหลังบ้าน (Admin Dashboard)
- สร้างและจัดการแคมเปญคูปอง
- กำหนดจำนวนคูปองสูงสุดในแต่ละแคมเปญ
- สร้างคูปองพร้อม QR Code อัตโนมัติ
- Export คูปองเป็น PDF สำหรับพิมพ์
- ดู Dashboard และสถิติการใช้งาน

### ระบบหน้าร้าน (Staff Redemption)
- สแกน QR Code ผ่านเว็บบราว์เซอร์
- ตรวจสอบสิทธิ์คูปองแบบ Real-time
- ตัดสิทธิ์คูปองทันที
- รองรับการกรอกรหัสคูปองด้วยมือ

## Tech Stack

- **Runtime:** Bun
- **Backend:** Elysia.js
- **Frontend:** React + Vite
- **Database:** PostgreSQL
- **ORM:** Prisma
- **QR Code:** qrcode, html5-qrcode
- **PDF Generation:** PDFKit

## Project Structure

```
/
├── packages/
│   ├── api/              # Backend (Elysia.js)
│   │   ├── prisma/       # Database schema
│   │   └── src/
│   │       ├── lib/      # Utilities (auth, database)
│   │       ├── routes/   # API routes
│   │       └── utils/    # QR code, PDF generation
│   │
│   ├── web/              # Frontend (React)
│   │   └── src/
│   │       ├── components/
│   │       ├── contexts/
│   │       ├── lib/
│   │       └── pages/
│   │
│   └── shared/           # Shared types
```

## Getting Started

### Prerequisites

- Bun (v1.0+)
- PostgreSQL (v14+)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd coupons-management-project
```

2. Install dependencies
```bash
bun install
```

3. Setup database
```bash
# Create PostgreSQL database
createdb coupon_db

# Update DATABASE_URL in packages/api/.env
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/coupon_db"
```

4. Run database migrations
```bash
bun run db:migrate
```

5. Start development servers
```bash
bun run dev
```

This will start:
- Backend API: http://localhost:3000
- Frontend: http://localhost:5173

## Environment Variables

### Backend (`packages/api/.env`)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/coupon_db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user

### Campaigns
- `GET /campaigns` - List all campaigns
- `GET /campaigns/:id` - Get campaign details
- `POST /campaigns` - Create campaign
- `PATCH /campaigns/:id` - Update campaign
- `DELETE /campaigns/:id` - Delete campaign
- `GET /campaigns/:id/stats` - Get campaign statistics

### Coupons
- `GET /coupons` - List coupons
- `GET /coupons/:id` - Get coupon details
- `GET /coupons/code/:code` - Get coupon by code
- `POST /coupons/generate` - Generate coupons for campaign
- `POST /coupons/export-pdf` - Export coupons to PDF

### Redemption
- `POST /redemption/validate` - Validate coupon
- `POST /redemption/redeem` - Redeem coupon
- `GET /redemption/history` - Get redemption history

## Usage Guide

### สำหรับ Admin

1. **สร้างบัญชี Admin**
```bash
# Register with role ADMIN
POST /auth/register
{
  "email": "admin@example.com",
  "password": "password123",
  "name": "Admin User",
  "role": "ADMIN"
}
```

2. **สร้างแคมเปญ**
- เข้าสู่ระบบด้วยบัญชี Admin
- ไปที่ Dashboard → Create Campaign
- กรอกข้อมูล: ชื่อแคมเปญ, จำนวนคูปอง, วันที่เริ่ม-สิ้นสุด

3. **สร้างคูปอง**
- เข้าไปในแคมเปญที่สร้าง
- กำหนดจำนวนคูปองที่ต้องการสร้าง
- คลิก Generate Coupons

4. **Export PDF**
- คลิก "Export All Coupons to PDF"
- ดาวน์โหลดไฟล์ PDF
- นำไปพิมพ์และแจก

### สำหรับ Staff

1. **สร้างบัญชี Staff**
```bash
# Register with role STAFF (default)
POST /auth/register
{
  "email": "staff@example.com",
  "password": "password123",
  "name": "Staff User"
}
```

2. **สแกนคูปอง**
- เข้าสู่ระบบด้วยบัญชี Staff
- ไปที่ Scanner page
- คลิก "Start Scanner"
- อนุญาตการใช้กล้อง
- สแกน QR Code บนคูปอง
- ระบบจะแสดงผลการตรวจสอบทันที

3. **กรอกรหัสด้วยมือ**
- หากไม่สามารถสแกนได้
- ใช้ช่อง "Enter Code Manually"
- กรอกรหัสคูปอง
- คลิก Validate

## Database Schema

### User
- id, email, password, name, role (ADMIN/STAFF)

### Campaign
- id, name, description, totalLimit, startDate, endDate

### Coupon
- id, code (unique), qrCode, status (AVAILABLE/USED/EXPIRED), campaignId

### RedemptionLog
- id, couponId, userId, redeemedAt

## Development

### Run Backend Only
```bash
cd packages/api
bun run dev
```

### Run Frontend Only
```bash
cd packages/web
bun run dev
```

### Database Migrations
```bash
# Create migration
cd packages/api
bunx prisma migrate dev --name migration_name

# Generate Prisma Client
bunx prisma generate
```

## Production Deployment

1. Build frontend
```bash
cd packages/web
bun run build
```

2. Set production environment variables

3. Run database migrations
```bash
cd packages/api
bunx prisma migrate deploy
```

4. Start backend
```bash
cd packages/api
bun run src/index.ts
```

## Troubleshooting

### Camera not working in Scanner
- Ensure HTTPS is enabled (camera requires secure context)
- Check browser permissions for camera access
- Try different browsers (Chrome, Safari recommended)

### PDF export not working
- Check if QR codes are generated properly
- Ensure pdfkit dependencies are installed
- Check server logs for detailed errors

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
