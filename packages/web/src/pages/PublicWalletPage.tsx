import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';

interface WalletData {
    wallet: {
        id: string;
        type: 'FUEL' | 'BOAT';
        balance: number;
        company: {
            name: string;
        };
        qrCodeDataURL: string;
        qrDisplayTokenExpiry: string;
    };
}

interface TopupHistory {
    history: Array<{
        id: string;
        amountAdded: number;
        createdAt: string;
    }>;
    count: number;
}

export function PublicWalletPage() {
    const { id } = useParams<{ id: string }>();
    const [walletData, setWalletData] = useState<WalletData | null>(null);
    const [topupHistory, setTopupHistory] = useState<TopupHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWalletData = async () => {
            if (!id) return;

            try {
                setLoading(true);

                // Fetch wallet data
                const walletResponse = await api.get(`/public/wallet/${id}`);
                setWalletData(walletResponse.data);

                // Fetch topup history
                const historyResponse = await api.get(`/public/wallet/${id}/topup-history?limit=20`);
                setTopupHistory(historyResponse.data);
            } catch (err: any) {
                setError(err.response?.data?.error || 'ไม่สามารถโหลดข้อมูลกระเป๋าได้');
            } finally {
                setLoading(false);
            }
        };

        fetchWalletData();

        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchWalletData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [id]);

    // Calculate time remaining until QR expiry
    const getTimeRemaining = () => {
        if (!walletData?.wallet.qrDisplayTokenExpiry) return '';

        const expiry = new Date(walletData.wallet.qrDisplayTokenExpiry);
        const now = new Date();
        const diff = expiry.getTime() - now.getTime();

        if (diff <= 0) return 'กำลังรีเซ็ต...';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) {
            return `QR Code จะรีเซ็ตใน ${days} วัน ${hours} ชั่วโมง`;
        }
        return `QR Code จะรีเซ็ตใน ${hours} ชั่วโมง`;
    };

    // Format date in Thai locale
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-600 text-lg">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    if (error || !walletData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบข้อมูล</h1>
                    <p className="text-gray-600">{error || 'ไม่สามารถโหลดข้อมูลกระเป๋าได้'}</p>
                </div>
            </div>
        );
    }

    const { wallet } = walletData;
    const isFuel = wallet.type === 'FUEL';
    const unit = isFuel ? 'ลิตร' : 'เที่ยว';
    const icon = isFuel ? '⛽' : '🚤';
    const typeLabel = isFuel ? 'น้ำมัน' : 'เรือ';

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                        {wallet.company.name}
                    </h1>
                    <p className="text-gray-600 text-lg">ยอดคงเหลือและประวัติการเติม</p>
                </div>

                {/* Balance Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 transform hover:scale-[1.02] transition-transform">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <span className="text-5xl">{icon}</span>
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-gray-800">กระเป๋า{typeLabel}</h2>
                                <p className="text-sm text-gray-500">ประเภท: {wallet.type}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 md:p-8 text-white text-center">
                        <p className="text-sm md:text-base opacity-90 mb-2">ยอดคงเหลือ</p>
                        <p className="text-5xl md:text-6xl font-bold mb-2">
                            {wallet.balance.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xl md:text-2xl opacity-90">{unit}</p>
                    </div>
                </div>

                {/* QR Code Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>📱</span> QR Code สำหรับสแกน
                    </h3>

                    <div className="flex flex-col items-center">
                        <div className="bg-white p-4 rounded-2xl shadow-lg mb-4 border-4 border-indigo-500">
                            <img
                                src={wallet.qrCodeDataURL}
                                alt="QR Code"
                                className="w-48 h-48 md:w-64 md:h-64"
                            />
                        </div>

                        <div className="text-center">
                            <p className="text-sm md:text-base text-gray-600 mb-1">
                                {getTimeRemaining()}
                            </p>
                            <p className="text-xs text-gray-400">QR Code จะรีเซ็ตทุก 3 วันเพื่อความปลอดภัย</p>
                        </div>
                    </div>
                </div>

                {/* Topup History Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>📊</span> ประวัติการเติม
                    </h3>

                    {topupHistory && topupHistory.history.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {topupHistory.history.map((record, index) => (
                                <div
                                    key={record.id}
                                    className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">{formatDate(record.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-green-600">
                                            +{record.amountAdded.toLocaleString('th-TH')}
                                        </p>
                                        <p className="text-sm text-gray-600">{unit}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-xl">ยังไม่มีประวัติการเติม</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500 pb-8">
                    <p>ข้อมูลอัปเดตอัตโนมัติทุก 5 นาที</p>
                </div>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
        </div>
    );
}
