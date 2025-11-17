import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { Navbar } from '../components/Navbar';

interface Campaign {
  id: string;
  name: string;
  description: string;
  totalLimit: number;
  startDate: string;
  endDate: string;
  _count: {
    coupons: number;
  };
}

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/campaigns');
      setCampaigns(response.data.campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedCampaigns.size === campaigns.length) {
      setSelectedCampaigns(new Set());
    } else {
      setSelectedCampaigns(new Set(campaigns.map(c => c.id)));
    }
  };

  const handleSelectCampaign = (id: string) => {
    const newSelected = new Set(selectedCampaigns);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCampaigns(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedCampaigns.size === 0) return;

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedCampaigns.size} campaign(s)? This will also delete all associated coupons.`
    );

    if (!confirmed) return;

    setBulkDeleting(true);
    try {
      await api.post('/campaigns/bulk-delete', {
        campaignIds: Array.from(selectedCampaigns),
      });

      alert(`Successfully deleted ${selectedCampaigns.size} campaign(s)!`);
      setSelectedCampaigns(new Set());
      fetchCampaigns();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete campaigns');
    } finally {
      setBulkDeleting(false);
    }
  };

  const getProgressPercentage = (campaign: Campaign) => {
    return (campaign._count.coupons / campaign.totalLimit) * 100;
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500 text-lg">{t('common.loading')}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('campaigns.title')}</h1>
              <p className="mt-1 text-sm text-gray-600">
                {t('campaigns.subtitle')}
              </p>
            </div>
            <Link
              to="/campaigns/new"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('campaigns.createButton')}
            </Link>
          </div>

          {/* Bulk Actions Bar */}
          {selectedCampaigns.size > 0 && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg px-6 py-4 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {t('campaigns.selectedCount', { count: selectedCampaigns.size })}
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors text-sm"
              >
                {bulkDeleting ? 'Deleting...' : t('campaigns.deleteSelected')}
              </button>
            </div>
          )}

          {/* Campaigns Grid */}
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">{t('campaigns.empty.title')}</h3>
              <p className="mt-2 text-sm text-gray-600">
                {t('campaigns.empty.subtitle')}
              </p>
              <Link
                to="/campaigns/new"
                className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('campaigns.createButton')}
              </Link>
            </div>
          ) : (
            <>
              {/* Select All Checkbox */}
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedCampaigns.size === campaigns.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700 font-medium">
                  {t('campaigns.selectAll')}
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => {
                  const progress = getProgressPercentage(campaign);
                  const expired = isExpired(campaign.endDate);

                  return (
                    <div
                      key={campaign.id}
                      className={`bg-white rounded-lg shadow-sm border transition-all hover:shadow-md ${
                        selectedCampaigns.has(campaign.id)
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200'
                      }`}
                    >
                      {/* Card Header with Checkbox */}
                      <div className="px-6 py-4 border-b border-gray-200 flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedCampaigns.has(campaign.id)}
                          onChange={() => handleSelectCampaign(campaign.id)}
                          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {campaign.name}
                          </h3>
                          {expired && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                              {t('campaigns.expired')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="px-6 py-4 space-y-4">
                        {campaign.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {campaign.description}
                          </p>
                        )}

                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 font-medium">{t('campaigns.couponsGenerated')}</span>
                            <span className="text-gray-600">
                              {campaign._count.coupons} / {campaign.totalLimit}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                progress >= 100
                                  ? 'bg-red-500'
                                  : progress >= 75
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Date Range */}
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="px-6 py-4 border-t border-gray-200 flex gap-2">
                        <button
                          onClick={() => navigate(`/campaigns/${campaign.id}`)}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                        >
                          {t('campaigns.viewDetails')}
                        </button>
                        <button
                          onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
