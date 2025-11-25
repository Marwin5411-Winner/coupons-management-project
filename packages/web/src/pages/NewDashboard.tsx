import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import api from '../lib/api';

interface DashboardStats {
  totalCompanies: number;
  totalWallets: number;
  fuelWallets: number;
  boatWallets: number;
  totalFuelBalance: number;
  totalBoatBalance: number;
  recentTopups: number;
  recentUsages: number;
}

export function NewDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-2 text-gray-600">
            ภาพรวมระบบจัดการคูปองน้ำมันและเรือ
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Companies */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">บริษัททั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalCompanies || 0}
                </p>
              </div>
              <div className="text-blue-500 text-4xl">🏢</div>
            </div>
          </div>

          {/* Fuel Wallets */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  คูปองน้ำมัน
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.fuelWallets || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.totalFuelBalance.toFixed(2)} ลิตร
                </p>
              </div>
              <div className="text-yellow-500 text-4xl">⛽</div>
            </div>
          </div>

          {/* Boat Wallets */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">คูปองเรือ</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.boatWallets || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.totalBoatBalance} เที่ยว
                </p>
              </div>
              <div className="text-blue-400 text-4xl">🚤</div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  กิจกรรม 7 วันล่าสุด
                </p>
                <p className="text-lg font-bold text-green-600">
                  เติม: {stats?.recentTopups || 0}
                </p>
                <p className="text-lg font-bold text-red-600">
                  ใช้: {stats?.recentUsages || 0}
                </p>
              </div>
              <div className="text-purple-500 text-4xl">📊</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {user?.role === 'ADMIN' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              เมนูหลัก
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/companies"
                className="flex items-center justify-center bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition"
              >
                <span className="text-2xl mr-2">🏢</span>
                <span className="font-medium">จัดการบริษัท</span>
              </Link>
              <Link
                to="/fuel-wallets"
                className="flex items-center justify-center bg-yellow-500 text-white p-4 rounded-lg hover:bg-yellow-600 transition"
              >
                <span className="text-2xl mr-2">⛽</span>
                <span className="font-medium">คูปองน้ำมัน</span>
              </Link>
              <Link
                to="/boat-wallets"
                className="flex items-center justify-center bg-cyan-500 text-white p-4 rounded-lg hover:bg-cyan-600 transition"
              >
                <span className="text-2xl mr-2">🚤</span>
                <span className="font-medium">คูปองเรือ</span>
              </Link>
              <Link
                to="/reports"
                className="flex items-center justify-center bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 transition"
              >
                <span className="text-2xl mr-2">📊</span>
                <span className="font-medium">รายงาน</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
