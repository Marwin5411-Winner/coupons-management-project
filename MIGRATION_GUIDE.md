# Fuel & Boat Coupon System - Migration Guide

## ภาพรวมการเปลี่ยนแปลง

ระบบได้ถูกออกแบบใหม่ทั้งหมดจากระบบคูปองทั่วไป เป็นระบบบริหารจัดการคูปองน้ำมันและเรือสำหรับลูกค้าองค์กร (B2B)

### การเปลี่ยนแปลงหลัก

#### 1. Database Schema
**เดิม:**
- Campaign → Coupon (แบบใช้ครั้งเดียว, มีวันหมดอายุ)
- Coupon Status: AVAILABLE, USED, EXPIRED
- RedemptionLog (บันทึกการใช้งาน)

**ใหม่:**
- Company (บริษัทลูกค้า B2B)
- Wallet (กระเป๋าเงิน/โควต้า แยกตาม FUEL/BOAT)
- TopupLog (ประวัติการเติมยอด)
- UsageLog (ประวัติการใช้งาน)

#### 2. API Endpoints
**เดิม:**
- `/campaigns` - จัดการแคมเปญ
- `/coupons` - จัดการคูปอง
- `/redemption` - ตัดคูปอง

**ใหม่:**
- `/companies` - จัดการบริษัทลูกค้า
- `/wallets` - จัดการกระเป๋าเงิน (FUEL/BOAT)
- `/topup` - เติมยอด
- `/usage` - ตัดยอด/ใช้บริการ
- `/dashboard` - สถิติและรายงาน (แยกตาม FUEL/BOAT)

## ขั้นตอนการ Migration

### 1. เตรียมสภาพแวดล้อม

#### 1.1 Start PostgreSQL Database
```bash
# ถ้ามี Docker
docker-compose up -d

# หรือเริ่ม PostgreSQL ด้วยวิธีอื่น
```

#### 1.2 ตรวจสอบ Environment Variables
สร้างไฟล์ `packages/api/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/coupon_db?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
PORT=3000
```

### 2. Reset Database และ Apply Schema ใหม่

⚠️ **คำเตือน:** ขั้นตอนนี้จะลบข้อมูลทั้งหมดในฐานข้อมูล!

```bash
cd packages/api

# Reset database และ apply migration ใหม่
bunx prisma migrate reset --force

# หรือถ้าต้องการสร้าง migration ใหม่
bunx prisma migrate dev --name init-fuel-boat-system
```

### 3. Seed ข้อมูลตัวอย่าง

```bash
# Run seed script
bun run db:seed
```

ข้อมูลตัวอย่างที่จะถูกสร้าง:
- **Admin User:** admin@coupon.com / admin123
- **Staff User:** staff@coupon.com / staff123
- **บริษัทตัวอย่าง:**
  - บริษัท ขนส่งทางน้ำ จำกัด (Fuel: 1000 ลิตร, Boat: 50 เที่ยว)
  - บริษัท ท่องเที่ยวทะเล จำกัด (Fuel: 500 ลิตร, Boat: 30 เที่ยว)

### 4. ทดสอบ API

```bash
# Start API server
bun run dev:api
```

#### 4.1 ทดสอบ Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coupon.com","password":"admin123"}'
```

#### 4.2 ทดสอบดึงข้อมูลบริษัท
```bash
# ใช้ JWT token ที่ได้จาก login
curl http://localhost:3000/companies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4.3 ทดสอบ Dashboard Stats
```bash
curl http://localhost:3000/dashboard/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## API Documentation

### Companies API

#### GET `/companies`
ดึงรายการบริษัททั้งหมด (Admin only)
```json
[
  {
    "id": "uuid",
    "name": "บริษัท ขนส่งทางน้ำ จำกัด",
    "contactInfo": "โทร: 02-123-4567",
    "wallets": [
      {
        "id": "uuid",
        "type": "FUEL",
        "balance": 1000,
        "qrToken": "hex-string"
      }
    ]
  }
]
```

#### POST `/companies`
สร้างบริษัทใหม่ (Admin only)
```json
{
  "name": "ชื่อบริษัท",
  "contactInfo": "ข้อมูลติดต่อ"
}
```

### Wallets API

#### GET `/wallets/:id/qrcode`
Generate QR Code สำหรับ Wallet
```json
{
  "walletId": "uuid",
  "companyName": "บริษัท ขนส่งทางน้ำ จำกัด",
  "type": "FUEL",
  "qrToken": "hex-string",
  "qrCodeDataURL": "data:image/png;base64,..."
}
```

#### POST `/wallets`
สร้าง Wallet ใหม่ (Admin only)
```json
{
  "companyId": "uuid",
  "type": "FUEL",
  "initialBalance": 1000
}
```

### Topup API

#### POST `/topup`
เติมยอดเข้า Wallet (Admin only)
```json
{
  "walletId": "uuid",
  "amount": 500
}
```

Response:
```json
{
  "message": "Top-up successful",
  "topupLog": {...},
  "newBalance": 1500
}
```

### Usage API

#### POST `/usage/validate`
ตรวจสอบยอดก่อนใช้บริการ (Staff)
```json
{
  "qrToken": "hex-string",
  "amount": 50
}
```

Response:
```json
{
  "valid": true,
  "wallet": {
    "id": "uuid",
    "type": "FUEL",
    "balance": 1000,
    "company": {
      "name": "บริษัท ขนส่งทางน้ำ จำกัด"
    }
  }
}
```

#### POST `/usage/redeem`
ตัดยอด/ใช้บริการ (Staff)
```json
{
  "walletId": "uuid",
  "amount": 50,
  "durationMinutes": 120  // สำหรับ BOAT เท่านั้น
}
```

Response:
```json
{
  "success": true,
  "message": "ตัดยอดสำเร็จ",
  "usageLog": {...},
  "newBalance": 950
}
```

### Dashboard API

#### GET `/dashboard/stats`
สถิติรวมของระบบ
```json
{
  "totalCompanies": 2,
  "totalWallets": 4,
  "fuelWallets": 2,
  "boatWallets": 2,
  "totalFuelBalance": 1500,
  "totalBoatBalance": 80,
  "recentTopups": 5,
  "recentUsages": 10
}
```

#### GET `/dashboard/reports/fuel`
รายงานน้ำมัน (Query: startDate, endDate)
```json
{
  "topups": [...],
  "usages": [...]
}
```

#### GET `/dashboard/reports/boat`
รายงานเรือ (Query: startDate, endDate)
```json
{
  "topups": [...],
  "usages": [...]
}
```

## ความแตกต่างหลักของระบบใหม่

| ฟีเจอร์ | ระบบเดิม | ระบบใหม่ |
|--------|---------|---------|
| **โมเดลธุรกิจ** | B2C (ผู้บริโภคทั่วไป) | B2B (บริษัทลูกค้า) |
| **รูปแบบคูปอง** | ใช้ครั้งเดียว | Wallet แบบเติมได้เรื่อยๆ |
| **วันหมดอายุ** | มี (Campaign-based) | ไม่มี (Non-expiring) |
| **QR Code** | 1 QR = 1 คูปอง | 1 QR = 1 Wallet (ใช้ซ้ำได้) |
| **ประเภทบริการ** | ทั่วไป | แยก FUEL และ BOAT |
| **หน่วยนับ** | จำนวนครั้ง | FUEL=ลิตร, BOAT=เที่ยว |
| **การบันทึกเวลา** | ไม่มี | มีสำหรับ BOAT (duration_minutes) |
| **การเติมยอด** | ไม่ได้ | ได้ (Top-up) |

## ขั้นตอนถัดไป

1. ✅ Backend API - เสร็จสมบูรณ์
2. ⏳ Frontend (Admin Dashboard) - ต้องสร้างหน้าใหม่ทั้งหมด:
   - Dashboard
   - จัดการบริษัท
   - จัดการคูปองน้ำมัน
   - จัดการคูปองเรือ
   - รายงาน
3. ⏳ Frontend (Staff Mobile Web) - ต้องปรับให้รองรับ Wallet system
4. ⏳ การทดสอบระบบ
5. ⏳ Deploy to production

## ปัญหาที่อาจพบและวิธีแก้

### 1. Database Connection Failed
```
Error: P1001: Can't reach database server
```
**วิธีแก้:**
- ตรวจสอบว่า PostgreSQL รันอยู่
- ตรวจสอบ `DATABASE_URL` ใน `.env`

### 2. Migration Failed
```
Error: Unique constraint failed
```
**วิธีแก้:**
- ลบ migration folders เก่า: `rm -rf packages/api/prisma/migrations`
- รัน `bunx prisma migrate reset --force` ใหม่

### 3. Seed Failed
```
Error: Company already exists
```
**วิธีแก้:**
- Seed script ใช้ `upsert` อยู่แล้ว ควรไม่มีปัญหา
- ถ้ายังมีปัญหา ให้ reset database ก่อน

## สรุป

ระบบใหม่ได้ถูกออกแบบให้รองรับการใช้งานแบบ B2B โดยเฉพาะ พร้อมฟีเจอร์:
- ✅ การเติมยอดได้เรื่อยๆ (Non-expiring wallet)
- ✅ แยกประเภทบริการ (FUEL/BOAT)
- ✅ QR Code แบบใช้ซ้ำได้
- ✅ บันทึกประวัติการเติมและการใช้
- ✅ Dashboard และรายงานแยกตามประเภท
- ✅ Transaction safety ด้วย Prisma

หากมีคำถามหรือปัญหา กรุณาติดต่อทีมพัฒนา
