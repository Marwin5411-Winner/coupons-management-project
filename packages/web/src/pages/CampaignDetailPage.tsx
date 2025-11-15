import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Navbar } from '../components/Navbar';

interface Coupon {
  id: string;
  code: string;
  qrCode: string;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
  createdAt: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  totalLimit: number;
  startDate: string;
  endDate: string;
  coupons: Coupon[];
}

export function CampaignDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [selectedCoupons, setSelectedCoupons] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    if (id) {
      fetchCampaign();
    }
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const response = await api.get(`/campaigns/${id}`);
      setCampaign(response.data.campaign);
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      await api.post('/coupons/generate', {
        campaignId: id,
        quantity,
      });
      alert(`Generated ${quantity} coupons successfully!`);
      fetchCampaign();
      setQuantity(10);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to generate coupons');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!id) return;
    setExporting(true);
    try {
      const response = await api.post(
        '/coupons/export-pdf',
        { campaignId: id },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `coupons-${campaign?.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleSelectAll = () => {
    const filtered = getFilteredCoupons();
    if (selectedCoupons.size === filtered.length) {
      setSelectedCoupons(new Set());
    } else {
      setSelectedCoupons(new Set(filtered.map(c => c.id)));
    }
  };

  const handleSelectCoupon = (couponId: string) => {
    const newSelected = new Set(selectedCoupons);
    if (newSelected.has(couponId)) {
      newSelected.delete(couponId);
    } else {
      newSelected.add(couponId);
    }
    setSelectedCoupons(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedCoupons.size === 0) return;

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedCoupons.size} coupon(s)?`
    );

    if (!confirmed) return;

    setBulkDeleting(true);
    try {
      await api.post('/coupons/bulk-delete', {
        couponIds: Array.from(selectedCoupons),
      });

      alert(`Successfully deleted ${selectedCoupons.size} coupon(s)!`);
      setSelectedCoupons(new Set());
      fetchCampaign();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete coupons');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkUpdateStatus = async (status: 'AVAILABLE' | 'USED' | 'EXPIRED') => {
    if (selectedCoupons.size === 0) return;

    const confirmed = confirm(
      `Are you sure you want to update ${selectedCoupons.size} coupon(s) to ${status}?`
    );

    if (!confirmed) return;

    setBulkUpdating(true);
    try {
      await api.post('/coupons/bulk-update-status', {
        couponIds: Array.from(selectedCoupons),
        status,
      });

      alert(`Successfully updated ${selectedCoupons.size} coupon(s)!`);
      setSelectedCoupons(new Set());
      fetchCampaign();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update coupons');
    } finally {
      setBulkUpdating(false);
    }
  };

  const getFilteredCoupons = () => {
    if (!campaign) return [];
    if (filterStatus === 'ALL') return campaign.coupons;
    return campaign.coupons.filter(c => c.status === filterStatus);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800';
      case 'USED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500 text-lg">Loading campaign...</div>
        </div>
      </>
    );
  }

  if (!campaign) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500 text-lg">Campaign not found</div>
        </div>
      </>
    );
  }

  const remaining = campaign.totalLimit - campaign.coupons.length;
  const filteredCoupons = getFilteredCoupons();
  const availableCount = campaign.coupons.filter(c => c.status === 'AVAILABLE').length;
  const usedCount = campaign.coupons.filter(c => c.status === 'USED').length;
  const expiredCount = campaign.coupons.filter(c => c.status === 'EXPIRED').length;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-6 text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          {/* Campaign Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
                {campaign.description && (
                  <p className="mt-2 text-gray-600">{campaign.description}</p>
                )}
                <div className="mt-3 flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => navigate(`/campaigns/${id}/edit`)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Campaign
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{campaign.totalLimit}</div>
                <div className="text-sm text-gray-600 mt-1">Total Limit</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{campaign.coupons.length}</div>
                <div className="text-sm text-gray-600 mt-1">Generated</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{remaining}</div>
                <div className="text-sm text-gray-600 mt-1">Remaining</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{availableCount}</div>
                <div className="text-sm text-green-600 mt-1">Available</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-700">{usedCount}</div>
                <div className="text-sm text-red-600 mt-1">Used</div>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Generate Coupons */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Coupons</h3>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min={1}
                  max={remaining}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Quantity"
                />
                <button
                  onClick={handleGenerate}
                  disabled={generating || remaining === 0}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                >
                  {generating ? 'Generating...' : 'Generate'}
                </button>
              </div>
              {remaining === 0 && (
                <p className="mt-3 text-sm text-red-600 font-medium">
                  Campaign limit reached!
                </p>
              )}
            </div>

            {/* Export PDF */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Coupons</h3>
              <button
                onClick={handleExportPDF}
                disabled={exporting || campaign.coupons.length === 0}
                className="w-full px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {exporting ? 'Exporting...' : 'Export All to PDF'}
              </button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedCoupons.size > 0 && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedCoupons.size} coupon(s) selected
                </span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleBulkUpdateStatus('AVAILABLE')}
                    disabled={bulkUpdating}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    Mark Available
                  </button>
                  <button
                    onClick={() => handleBulkUpdateStatus('EXPIRED')}
                    disabled={bulkUpdating}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    Mark Expired
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Coupons List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Coupons ({filteredCoupons.length})
              </h3>

              {/* Filter */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700 font-medium">Filter:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setSelectedCoupons(new Set());
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">All ({campaign.coupons.length})</option>
                  <option value="AVAILABLE">Available ({availableCount})</option>
                  <option value="USED">Used ({usedCount})</option>
                  <option value="EXPIRED">Expired ({expiredCount})</option>
                </select>
              </div>
            </div>

            {filteredCoupons.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                No coupons found. Generate some to get started!
              </div>
            ) : (
              <>
                {/* Select All */}
                <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedCoupons.size === filteredCoupons.length && filteredCoupons.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700 font-medium">
                    Select All
                  </label>
                </div>

                {/* Coupons Grid */}
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredCoupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className={`border rounded-lg p-4 transition-all ${
                        selectedCoupons.has(coupon.id)
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedCoupons.has(coupon.id)}
                          onChange={() => handleSelectCoupon(coupon.id)}
                          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm font-semibold text-gray-900 break-all">
                            {coupon.code}
                          </div>
                          <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(coupon.status)}`}>
                            {coupon.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
