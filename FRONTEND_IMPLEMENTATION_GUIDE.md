# Frontend Implementation Guide

## สรุปงานที่ทำเสร็จแล้ว ✅

### Backend API (100% เสร็จสมบูรณ์)
- ✅ Database Schema ใหม่ (Company, Wallet, TopupLog, UsageLog)
- ✅ API Routes ทั้งหมด (/companies, /wallets, /topup, /usage, /dashboard)
- ✅ QR Code generation
- ✅ Transaction safety with Prisma
- ✅ Authentication & Authorization
- ✅ Seed data

### Frontend (เริ่มต้นแล้ว 30%)
- ✅ NewDashboard.tsx - Dashboard หลักพร้อม stats
- ✅ CompaniesPage.tsx - จัดการบริษัท (CRUD เต็มรูปแบบ)

## หน้าที่ยังต้องสร้าง

### 1. FuelWalletsPage.tsx (คูปองน้ำมัน)

**ฟีเจอร์ที่ต้องมี:**
- แสดง list ของ Wallets ที่ type='FUEL' ทั้งหมด
- เลือกบริษัทเพื่อสร้าง Wallet ใหม่ (ถ้ายังไม่มี)
- Top-up (เติมยอด) - Modal สำหรับระบุจำนวนลิตร
- แสดง QR Code - Download เป็น JPG
- แสดงประวัติการเติมและการใช้งาน

**API Endpoints ที่ใช้:**
```typescript
// Get all FUEL wallets
GET /wallets?type=FUEL

// Create new FUEL wallet
POST /wallets
{
  companyId: string,
  type: "FUEL",
  initialBalance?: number
}

// Top-up
POST /topup
{
  walletId: string,
  amount: number
}

// Get QR Code
GET /wallets/:id/qrcode

// Get wallet detail with history
GET /wallets/:id
```

**โครงสร้างคล้ายกับ CompaniesPage แต่:**
- เพิ่ม Modal สำหรับ Top-up
- เพิ่ม Modal สำหรับแสดง QR Code (พร้อมปุ่ม Download)
- เพิ่มส่วนแสดงประวัติ (Topup Logs และ Usage Logs)

### 2. BoatWalletsPage.tsx (คูปองเรือ)

**ฟีเจอร์เหมือน FuelWalletsPage แต่:**
- ใช้ type='BOAT'
- หน่วยเป็น "เที่ยว" แทน "ลิตร"
- ประวัติการใช้งานแสดง duration_minutes ด้วย

**API Endpoints ที่ใช้:**
```typescript
// Get all BOAT wallets
GET /wallets?type=BOAT

// สร้าง, Top-up, QR Code เหมือนกับ FUEL แต่ type='BOAT'
```

### 3. ReportsPage.tsx (รายงาน)

**ฟีเจอร์:**
- Tab สำหรับเลือกประเภท: Fuel / Boat
- Date range picker (start date, end date)
- ตารางแสดงประวัติทั้งหมด:
  - Topup logs (เติมยอด)
  - Usage logs (ใช้บริการ)
- Export เป็น Excel/PDF (optional)

**API Endpoints:**
```typescript
// Fuel report
GET /dashboard/reports/fuel?startDate=2024-01-01&endDate=2024-12-31

// Boat report
GET /dashboard/reports/boat?startDate=2024-01-01&endDate=2024-12-31
```

**ตัวอย่างการแสดงข้อมูล:**

**Fuel Report:**
| เวลา | บริษัท | รายการ | จำนวน (ลิตร) | ผู้ทำรายการ |
|------|---------|---------|-------------|------------|
| 10:00 | บ.เอ | เติมยอด | +1,000 | Admin |
| 13:00 | บ.เอ | ใช้บริการ | -50 | Staff 1 |

**Boat Report:**
| เวลา | บริษัท | รายการ | จำนวน (เที่ยว) | ระยะเวลา | ผู้ทำรายการ |
|------|---------|---------|-------------|---------|------------|
| 09:00 | บ.บี | ใช้บริการ | -1 | 2 ชม. 30 นาที | Staff 2 |

### 4. อัปเดต App.tsx

แก้ไข routing ให้ใช้หน้าใหม่:

```typescript
import { NewDashboard } from './pages/NewDashboard';
import { CompaniesPage } from './pages/CompaniesPage';
import { FuelWalletsPage } from './pages/FuelWalletsPage';
import { BoatWalletsPage } from './pages/BoatWalletsPage';
import { ReportsPage } from './pages/ReportsPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <NewDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/companies"
        element={
          <ProtectedRoute adminOnly>
            <CompaniesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fuel-wallets"
        element={
          <ProtectedRoute adminOnly>
            <FuelWalletsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/boat-wallets"
        element={
          <ProtectedRoute adminOnly>
            <BoatWalletsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute adminOnly>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      {/* ... other routes */}
    </Routes>
  );
}
```

### 5. Staff Mobile Web (packages/client-web)

**อัปเดตหน้า Scanner ให้รองรับ Wallet System:**

ไฟล์ที่ต้องแก้: `packages/client-web/src/pages/QRScanner.tsx`

**Flow การทำงานใหม่:**
1. Staff สแกน QR Code → ได้ qrToken
2. เรียก POST `/usage/validate` พร้อม qrToken และ amount
3. แสดงข้อมูล Wallet:
   - ชื่อบริษัท
   - ประเภท (FUEL/BOAT)
   - ยอดคงเหลือ
4. ให้ Staff เลือกจำนวนที่ต้องการตัด:
   - FUEL: เลือก 25, 50, 75, 100 ลิตร หรือระบุเอง
   - BOAT: เลือก 1, 2, 3 เที่ยว หรือระบุเอง
   - BOAT: ถ้าต้องการให้กรอก duration (นาที) ด้วย
5. ยืนยัน → เรียก POST `/usage/redeem`
6. แสดงผลสำเร็จ พร้อมยอดคงเหลือใหม่

**API สำหรับ Staff:**
```typescript
// Validate before redemption
POST /usage/validate
{
  qrToken: string,
  amount: number
}

// Redeem/Use service
POST /usage/redeem
{
  walletId: string,
  amount: number,
  durationMinutes?: number  // สำหรับ BOAT เท่านั้น
}
```

## การดาวน์โหลด QR Code เป็น JPG

ใช้ library `html2canvas` หรือ `download` สำหรับดาวน์โหลดภาพ:

```bash
npm install html2canvas
# หรือ
npm install downloadjs
```

**ตัวอย่าง Code:**
```typescript
const downloadQRCode = async (walletId: string, companyName: string) => {
  try {
    const response = await api.get(`/wallets/${walletId}/qrcode`);
    const { qrCodeDataURL } = response.data;

    // Create link and download
    const link = document.createElement('a');
    link.href = qrCodeDataURL;
    link.download = `QR_${companyName}_${walletId}.jpg`;
    link.click();
  } catch (error) {
    console.error('Failed to download QR:', error);
  }
};
```

## Styling Guidelines

ใช้ Tailwind CSS classes ที่มีอยู่แล้ว:
- สี primary: `bg-blue-600`, `text-blue-600`
- สี FUEL: `bg-yellow-500`, `text-yellow-500` (⛽)
- สี BOAT: `bg-cyan-500`, `text-cyan-500` (🚤)
- Cards: `bg-white rounded-lg shadow p-6`
- Buttons: `bg-{color}-600 text-white px-4 py-2 rounded hover:bg-{color}-700`

## ขั้นตอนการทำต่อ

1. **สร้าง FuelWalletsPage.tsx**
   - คัดลอกโครงสร้างจาก CompaniesPage
   - แก้ไข API calls
   - เพิ่ม Top-up Modal
   - เพิ่ม QR Code Modal

2. **สร้าง BoatWalletsPage.tsx**
   - คัดลอกจาก FuelWalletsPage
   - เปลี่ยน type='FUEL' → 'BOAT'
   - เปลี่ยนหน่วย "ลิตร" → "เที่ยว"

3. **สร้าง ReportsPage.tsx**
   - สร้าง Tabs สำหรับ Fuel/Boat
   - เพิ่ม Date Range Picker
   - แสดงตารางข้อมูล

4. **อัปเดต App.tsx**
   - Import หน้าใหม่ทั้งหมด
   - เพิ่ม routes

5. **ทดสอบระบบ**
   ```bash
   # ติดตั้ง dependencies
   cd packages/web
   bun install

   # Run dev server
   bun run dev

   # เปิดเว็บ
   # http://localhost:5173
   ```

6. **Commit และ Push**
   ```bash
   git add .
   git commit -m "feat: Complete Frontend for Fuel & Boat system"
   git push
   ```

## ตัวอย่าง Component ที่อาจต้องใช้

### QR Code Modal Component

```typescript
interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletId: string;
  companyName: string;
  walletType: 'FUEL' | 'BOAT';
}

function QRCodeModal({ isOpen, onClose, walletId, companyName, walletType }: QRCodeModalProps) {
  const [qrData, setQrData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchQRCode();
    }
  }, [isOpen, walletId]);

  const fetchQRCode = async () => {
    const response = await api.get(`/wallets/${walletId}/qrcode`);
    setQrData(response.data);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrData.qrCodeDataURL;
    link.download = `QR_${companyName}_${walletType}.jpg`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md">
        <h3 className="text-xl font-bold mb-4">QR Code - {companyName}</h3>
        {qrData && (
          <>
            <img src={qrData.qrCodeDataURL} alt="QR Code" className="w-full" />
            <p className="text-sm text-gray-600 mt-2">
              Type: {walletType === 'FUEL' ? '⛽ น้ำมัน' : '🚤 เรือ'}
            </p>
            <div className="flex space-x-3 mt-4">
              <button onClick={handleDownload} className="flex-1 bg-blue-600 text-white py-2 rounded">
                ดาวน์โหลด JPG
              </button>
              <button onClick={onClose} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded">
                ปิด
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

### Top-up Modal Component

```typescript
interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet;
  onSuccess: () => void;
}

function TopupModal({ isOpen, onClose, wallet, onSuccess }: TopupModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/topup', {
        walletId: wallet.id,
        amount: parseFloat(amount)
      });
      alert('เติมยอดสำเร็จ');
      onClose();
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md">
        <h3 className="text-xl font-bold mb-4">
          เติมยอด - {wallet.company.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          ยอดคงเหลือ: {wallet.balance} {wallet.type === 'FUEL' ? 'ลิตร' : 'เที่ยว'}
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`จำนวน${wallet.type === 'FUEL' ? 'ลิตร' : 'เที่ยว'}ที่ต้องการเติม`}
            className="w-full px-3 py-2 border rounded mb-4"
          />
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded"
            >
              {loading ? 'กำลังเติม...' : 'ยืนยันเติมยอด'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

## สรุป

ระบบ Backend พร้อมใช้งาน 100% แล้ว ส่วน Frontend ได้สร้างโครงสร้างหลักและตัวอย่าง 2 หน้าไว้แล้ว (Dashboard และ Companies)

คุณสามารถใช้ Guide นี้เป็นแนวทางในการสร้างหน้าที่เหลือได้ โดยคัดลอกและปรับแต่งจาก CompaniesPage.tsx ที่มีอยู่

หากต้องการความช่วยเหลือเพิ่มเติมในการสร้างหน้าใดหน้าหนึ่ง สามารถขอได้เลยครับ!
