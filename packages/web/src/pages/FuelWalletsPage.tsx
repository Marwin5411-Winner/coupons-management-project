import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import api from '../lib/api';

interface Company {
  id: string;
  name: string;
}

interface Wallet {
  id: string;
  type: 'FUEL' | 'BOAT';
  balance: number;
  qrToken: string;
  company: Company;
  createdAt: string;
}

interface TopupLog {
  id: string;
  amountAdded: number;
  admin: { name: string };
  createdAt: string;
}

interface UsageLog {
  id: string;
  amountDeducted: number;
  staff: { name: string };
  createdAt: string;
}

export function FuelWalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [topupAmount, setTopupAmount] = useState('');
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [topupHistory, setTopupHistory] = useState<TopupLog[]>([]);
  const [usageHistory, setUsageHistory] = useState<UsageLog[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [walletsRes, companiesRes] = await Promise.all([
        api.get('/wallets?type=FUEL'),
        api.get('/companies'),
      ]);
      setWallets(walletsRes.data);
      setCompanies(companiesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/wallets', {
        companyId: selectedCompanyId,
        type: 'FUEL',
        initialBalance: initialBalance ? parseFloat(initialBalance) : 0,
      });
      alert('สร้าง Wallet สำเร็จ');
      setShowCreateModal(false);
      setSelectedCompanyId('');
      setInitialBalance('');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) return;

    try {
      await api.post('/topup', {
        walletId: selectedWallet.id,
        amount: parseFloat(topupAmount),
      });
      alert('เติมยอดสำเร็จ');
      setShowTopupModal(false);
      setTopupAmount('');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleShowQR = async (wallet: Wallet) => {
    setSelectedWallet(wallet);
    try {
      const response = await api.get(`/wallets/${wallet.id}/qrcode`);
      setQrCodeDataURL(response.data.qrCodeDataURL);
      setShowQRModal(true);
    } catch (error) {
      alert('ไม่สามารถโหลด QR Code ได้');
    }
  };

  const handleDownloadQR = () => {
    if (!selectedWallet || !qrCodeDataURL) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const width = 800;
    const height = 1100;
    canvas.width = width;
    canvas.height = height;

    // 1. Background (Light Blue Gradient)
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#00AEEF'); // Top blue
    gradient.addColorStop(1, '#B3E5FC'); // Bottom light blue
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 2. White Card with Rounded Corners
    const cardX = 50;
    const cardY = 150;
    const cardWidth = width - 100;
    const cardHeight = height - 300;
    const borderRadius = 20;

    ctx.beginPath();
    ctx.moveTo(cardX + borderRadius, cardY);
    ctx.lineTo(cardX + cardWidth - borderRadius, cardY);
    ctx.quadraticCurveTo(cardX + cardWidth, cardY, cardX + cardWidth, cardY + borderRadius);
    ctx.lineTo(cardX + cardWidth, cardY + cardHeight - borderRadius);
    ctx.quadraticCurveTo(cardX + cardWidth, cardY + cardHeight, cardX + cardWidth - borderRadius, cardY + cardHeight);
    ctx.lineTo(cardX + borderRadius, cardY + cardHeight);
    ctx.quadraticCurveTo(cardX, cardY + cardHeight, cardX, cardY + cardHeight - borderRadius);
    ctx.lineTo(cardX, cardY + borderRadius);
    ctx.quadraticCurveTo(cardX, cardY, cardX + borderRadius, cardY);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    // Add subtle shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    // Reset shadow for text/images
    ctx.shadowColor = 'transparent';

    // 3. Header Text
    // "พร้อมเพย์ 006-..." -> "พร้อมเพย์ [Company Name]"
    ctx.fillStyle = '#0056b3'; // Darker blue for text
    ctx.font = 'bold 40px Sarabun, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${selectedWallet.company.name}`, width / 2, cardY + 80);

    // Separator Line
    ctx.beginPath();
    ctx.moveTo(cardX, cardY + 120);
    ctx.lineTo(cardX + cardWidth, cardY + 120);
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. QR Code
    const qrImage = new Image();
    qrImage.onload = () => {
      const qrSize = 450;
      const qrX = (width - qrSize) / 2;
      const qrY = cardY + 160;
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      // 5. Center Logo
      const logoImage = new Image();
      logoImage.onload = () => {
        const logoSize = 100;
        const logoX = (width - logoSize) / 2;
        const logoY = qrY + (qrSize - logoSize) / 2;

        // White background for logo
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);

        // 6. Footer
        // Separator Line for footer
        ctx.beginPath();
        ctx.moveTo(cardX, cardY + cardHeight - 100);
        ctx.lineTo(cardX + cardWidth, cardY + cardHeight - 100);
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Footer Text
        ctx.fillStyle = '#0056b3'; // Blue color
        ctx.font = 'bold 30px Sarabun, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('คูปองน้ำมัน', width / 2, cardY + cardHeight - 40);

        // Trigger Download
        const dataUrl = canvas.toDataURL('image/jpeg');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `QR_${selectedWallet.company.name}_FUEL.jpg`;
        link.click();
      };
      logoImage.src = '/logo.jpg';
    };
    qrImage.src = qrCodeDataURL;
  };

  const handleShowHistory = async (wallet: Wallet) => {
    setSelectedWallet(wallet);
    try {
      const response = await api.get(`/wallets/${wallet.id}`);
      setTopupHistory(response.data.topupLogs || []);
      setUsageHistory(response.data.usageLogs || []);
      setShowHistoryModal(true);
    } catch (error) {
      alert('ไม่สามารถโหลดประวัติได้');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <Navbar />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">⛽ คูปองน้ำมัน</h2>
            <p className="mt-2 text-gray-600">จัดการ Wallet น้ำมัน (หน่วย: ลิตร)</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 font-medium"
          >
            + สร้าง Wallet ใหม่
          </button>
        </div>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map((wallet) => (
            <div key={wallet.id} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{wallet.company.name}</h3>
                  <p className="text-sm text-gray-500">Wallet ID: {wallet.id.slice(0, 8)}...</p>
                </div>
                <span className="text-3xl">⛽</span>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">ยอดคงเหลือ</p>
                <p className="text-3xl font-bold text-yellow-600">{wallet.balance.toFixed(2)} <span className="text-lg">ลิตร</span></p>
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    setSelectedWallet(wallet);
                    setShowTopupModal(true);
                  }}
                  className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
                >
                  เติมยอด
                </button>
                <button
                  onClick={() => handleShowQR(wallet)}
                  className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                >
                  QR Code
                </button>
                <button
                  onClick={() => handleShowHistory(wallet)}
                  className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600"
                >
                  ประวัติ
                </button>
              </div>
            </div>
          ))}
        </div>

        {wallets.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            ยังไม่มี Wallet น้ำมัน
          </div>
        )}
      </div>

      {/* Create Wallet Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">สร้าง Wallet น้ำมันใหม่</h3>
            <form onSubmit={handleCreateWallet}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เลือกบริษัท *</label>
                  <select
                    required
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">-- เลือกบริษัท --</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ยอดเริ่มต้น (ลิตร)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-md">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">สร้าง</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top-up Modal */}
      {showTopupModal && selectedWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">เติมยอดน้ำมัน</h3>
            <p className="text-sm text-gray-600 mb-4">
              บริษัท: {selectedWallet.company.name}<br />
              ยอดปัจจุบัน: <span className="font-bold text-yellow-600">{selectedWallet.balance.toFixed(2)} ลิตร</span>
            </p>
            <form onSubmit={handleTopup}>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                placeholder="จำนวนลิตรที่ต้องการเติม"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              />
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowTopupModal(false)} className="px-4 py-2 border border-gray-300 rounded-md">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">ยืนยันเติมยอด</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedWallet && qrCodeDataURL && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">QR Code - {selectedWallet.company.name}</h3>
            <div className="flex justify-center mb-4">
              <img src={qrCodeDataURL} alt="QR Code" className="w-64 h-64 border-4 border-yellow-500 rounded" />
            </div>
            <p className="text-sm text-gray-600 text-center mb-4">⛽ น้ำมัน | ยอดคงเหลือ: {selectedWallet.balance.toFixed(2)} ลิตร</p>
            <div className="flex space-x-3">
              <button onClick={handleDownloadQR} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">ดาวน์โหลด JPG</button>
              <button onClick={() => setShowQRModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded">ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">ประวัติ - {selectedWallet.company.name}</h3>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-green-600 mb-2">การเติมยอด ({topupHistory.length})</h4>
              <div className="bg-gray-50 rounded p-4 max-h-48 overflow-y-auto">
                {topupHistory.map((log) => (
                  <div key={log.id} className="flex justify-between py-2 border-b border-gray-200">
                    <div>
                      <span className="text-green-600 font-bold">+{log.amountAdded.toFixed(2)} ลิตร</span>
                      <p className="text-xs text-gray-500">โดย: {log.admin.name}</p>
                    </div>
                    <span className="text-sm text-gray-600">{new Date(log.createdAt).toLocaleString('th-TH')}</span>
                  </div>
                ))}
                {topupHistory.length === 0 && <p className="text-gray-400 text-center">ยังไม่มีประวัติการเติม</p>}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-red-600 mb-2">การใช้บริการ ({usageHistory.length})</h4>
              <div className="bg-gray-50 rounded p-4 max-h-48 overflow-y-auto">
                {usageHistory.map((log) => (
                  <div key={log.id} className="flex justify-between py-2 border-b border-gray-200">
                    <div>
                      <span className="text-red-600 font-bold">-{log.amountDeducted.toFixed(2)} ลิตร</span>
                      <p className="text-xs text-gray-500">โดย: {log.staff.name}</p>
                    </div>
                    <span className="text-sm text-gray-600">{new Date(log.createdAt).toLocaleString('th-TH')}</span>
                  </div>
                ))}
                {usageHistory.length === 0 && <p className="text-gray-400 text-center">ยังไม่มีประวัติการใช้</p>}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowHistoryModal(false)} className="px-6 py-2 bg-gray-300 text-gray-700 rounded">ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
