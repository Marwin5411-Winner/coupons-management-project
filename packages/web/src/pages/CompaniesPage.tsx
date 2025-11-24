import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import api from '../lib/api';

interface Wallet {
  id: string;
  type: 'FUEL' | 'BOAT';
  balance: number;
  qrToken: string;
}

interface Company {
  id: string;
  name: string;
  contactInfo: string | null;
  wallets: Wallet[];
  createdAt: string;
}

export function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactInfo: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      alert('ไม่สามารถโหลดข้อมูลบริษัทได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCompany) {
        // Update
        await api.put(`/companies/${editingCompany.id}`, formData);
        alert('อัปเดตบริษัทสำเร็จ');
      } else {
        // Create
        await api.post('/companies', formData);
        alert('สร้างบริษัทใหม่สำเร็จ');
      }

      setShowModal(false);
      setFormData({ name: '', contactInfo: '' });
      setEditingCompany(null);
      fetchCompanies();
    } catch (error: any) {
      console.error('Failed to save company:', error);
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      contactInfo: company.contactInfo || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบบริษัท "${name}"?\n\nการลบจะลบ Wallets และข้อมูลทั้งหมดที่เกี่ยวข้องด้วย`)) {
      return;
    }

    try {
      await api.delete(`/companies/${id}`);
      alert('ลบบริษัทสำเร็จ');
      fetchCompanies();
    } catch (error: any) {
      console.error('Failed to delete company:', error);
      alert(error.response?.data?.error || 'ไม่สามารถลบบริษัทได้');
    }
  };

  const openCreateModal = () => {
    setEditingCompany(null);
    setFormData({ name: '', contactInfo: '' });
    setShowModal(true);
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
            <h2 className="text-3xl font-bold text-gray-900">จัดการบริษัท</h2>
            <p className="mt-2 text-gray-600">
              จัดการข้อมูลบริษัทลูกค้า B2B
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            + เพิ่มบริษัทใหม่
          </button>
        </div>

        {/* Companies List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชื่อบริษัท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ข้อมูลติดต่อ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wallets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่สร้าง
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {company.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {company.contactInfo || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      {company.wallets.map((wallet) => (
                        <div key={wallet.id} className="text-sm">
                          {wallet.type === 'FUEL' ? '⛽' : '🚤'}{' '}
                          <span className="font-medium">
                            {wallet.balance.toFixed(2)}
                          </span>{' '}
                          {wallet.type === 'FUEL' ? 'ลิตร' : 'เที่ยว'}
                        </div>
                      ))}
                      {company.wallets.length === 0 && (
                        <span className="text-gray-400 text-sm">
                          ยังไม่มี Wallet
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(company.createdAt).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(company)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(company.id, company.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {companies.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              ยังไม่มีข้อมูลบริษัท
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingCompany ? 'แก้ไขบริษัท' : 'เพิ่มบริษัทใหม่'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อบริษัท *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ชื่อบริษัท"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ข้อมูลติดต่อ
                  </label>
                  <textarea
                    value={formData.contactInfo}
                    onChange={(e) =>
                      setFormData({ ...formData, contactInfo: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="โทร, อีเมล, ที่อยู่ ฯลฯ"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCompany(null);
                    setFormData({ name: '', contactInfo: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingCompany ? 'บันทึก' : 'สร้าง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
