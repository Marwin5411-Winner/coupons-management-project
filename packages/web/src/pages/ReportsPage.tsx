import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

interface TopupLog {
  id: string;
  amountAdded: number;
  admin: { name: string };
  wallet: {
    company: { name: string };
  };
  createdAt: string;
}

interface UsageLog {
  id: string;
  amountDeducted: number;
  durationMinutes: number | null;
  staff: { name: string };
  wallet: {
    company: { name: string };
  };
  createdAt: string;
}

type TabType = 'fuel' | 'boat';

export function ReportsPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('fuel');
  const [topups, setTopups] = useState<TopupLog[]>([]);
  const [usages, setUsages] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const endpoint = activeTab === 'fuel' ? '/dashboard/reports/fuel' : '/dashboard/reports/boat';
      const response = await api.get(`${endpoint}?${params.toString()}`);

      setTopups(response.data.topups || []);
      setUsages(response.data.usages || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ชม. ${mins} นาที`;
  };

  const calculateTotals = () => {
    const totalTopup = topups.reduce((sum, log) => sum + log.amountAdded, 0);
    const totalUsage = usages.reduce((sum, log) => sum + log.amountDeducted, 0);
    return { totalTopup, totalUsage };
  };

  const { totalTopup, totalUsage } = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="text-xl font-bold text-blue-600">
                ⛽🚤 ระบบจัดการคูปอง
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">Dashboard</Link>
                <Link to="/companies" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">บริษัท</Link>
                <Link to="/fuel-wallets" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">คูปองน้ำมัน</Link>
                <Link to="/boat-wallets" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">คูปองเรือ</Link>
                <Link to="/reports" className="text-gray-900 font-medium hover:text-blue-600 px-3 py-2 rounded-md">รายงาน</Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.name}</span>
              <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">ออกจากระบบ</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">📊 รายงาน</h2>
          <p className="mt-2 text-gray-600">รายงานการเติมและใช้บริการ</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('fuel')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'fuel'
                  ? 'border-b-2 border-yellow-500 text-yellow-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ⛽ น้ำมัน
            </button>
            <button
              onClick={() => setActiveTab('boat')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'boat'
                  ? 'border-b-2 border-cyan-500 text-cyan-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🚤 เรือ
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">กรองข้อมูล</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่มต้น</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReports}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'กำลังโหลด...' : 'ค้นหา'}
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600">รวมการเติม</p>
            <p className="text-2xl font-bold text-green-600">
              +{totalTopup.toFixed(2)} {activeTab === 'fuel' ? 'ลิตร' : 'เที่ยว'}
            </p>
            <p className="text-sm text-gray-500 mt-1">{topups.length} รายการ</p>
          </div>
          <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-500">
            <p className="text-sm text-gray-600">รวมการใช้</p>
            <p className="text-2xl font-bold text-red-600">
              -{totalUsage.toFixed(2)} {activeTab === 'fuel' ? 'ลิตร' : 'เที่ยว'}
            </p>
            <p className="text-sm text-gray-500 mt-1">{usages.length} รายการ</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">ส่วนต่าง</p>
            <p className="text-2xl font-bold text-blue-600">
              {(totalTopup - totalUsage).toFixed(2)} {activeTab === 'fuel' ? 'ลิตร' : 'เที่ยว'}
            </p>
            <p className="text-sm text-gray-500 mt-1">คงเหลือสุทธิ</p>
          </div>
        </div>

        {/* Topup Logs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-green-600">การเติมยอด ({topups.length} รายการ)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">เวลา</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">บริษัท</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จำนวน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ผู้ทำรายการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topups.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.wallet.company.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      +{log.amountAdded.toFixed(2)} {activeTab === 'fuel' ? 'ลิตร' : 'เที่ยว'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {log.admin.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {topups.length === 0 && (
              <div className="text-center py-12 text-gray-500">ไม่มีรายการเติมยอด</div>
            )}
          </div>
        </div>

        {/* Usage Logs */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-red-600">การใช้บริการ ({usages.length} รายการ)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">เวลา</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">บริษัท</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จำนวน</th>
                  {activeTab === 'boat' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ระยะเวลา</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ผู้ทำรายการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usages.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.wallet.company.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                      -{log.amountDeducted.toFixed(2)} {activeTab === 'fuel' ? 'ลิตร' : 'เที่ยว'}
                    </td>
                    {activeTab === 'boat' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDuration(log.durationMinutes)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {log.staff.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usages.length === 0 && (
              <div className="text-center py-12 text-gray-500">ไม่มีรายการใช้บริการ</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
