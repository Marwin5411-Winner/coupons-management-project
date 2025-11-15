import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Navbar } from '../components/Navbar';

interface Campaign {
  id: string;
  name: string;
  description: string;
  totalLimit: number;
  startDate: string;
  endDate: string;
  coupons: any[];
}

export function CampaignDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [quantity, setQuantity] = useState(10);

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

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.container}>Loading...</div>
      </>
    );
  }

  if (!campaign) {
    return (
      <>
        <Navbar />
        <div style={styles.container}>Campaign not found</div>
      </>
    );
  }

  const remaining = campaign.totalLimit - campaign.coupons.length;

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>

        <h1 style={styles.title}>{campaign.name}</h1>
        {campaign.description && <p style={styles.desc}>{campaign.description}</p>}

        <div style={styles.stats}>
          <div style={styles.statCard}>
            <h3>Total Limit</h3>
            <p>{campaign.totalLimit}</p>
          </div>
          <div style={styles.statCard}>
            <h3>Generated</h3>
            <p>{campaign.coupons.length}</p>
          </div>
          <div style={styles.statCard}>
            <h3>Remaining</h3>
            <p>{remaining}</p>
          </div>
          <div style={styles.statCard}>
            <h3>Available</h3>
            <p>{campaign.coupons.filter((c) => c.status === 'AVAILABLE').length}</p>
          </div>
          <div style={styles.statCard}>
            <h3>Used</h3>
            <p>{campaign.coupons.filter((c) => c.status === 'USED').length}</p>
          </div>
        </div>

        <div style={styles.actions}>
          <div style={styles.generateSection}>
            <h3>Generate Coupons</h3>
            <div style={styles.generateForm}>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={1}
                max={remaining}
                style={styles.input}
              />
              <button
                onClick={handleGenerate}
                disabled={generating || remaining === 0}
                style={styles.generateBtn}
              >
                {generating ? 'Generating...' : `Generate ${quantity} Coupons`}
              </button>
            </div>
            {remaining === 0 && (
              <p style={styles.warning}>Campaign limit reached!</p>
            )}
          </div>

          {campaign.coupons.length > 0 && (
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              style={styles.exportBtn}
            >
              {exporting ? 'Exporting...' : 'Export All Coupons to PDF'}
            </button>
          )}
        </div>

        <div style={styles.couponList}>
          <h3>Coupons ({campaign.coupons.length})</h3>
          <div style={styles.grid}>
            {campaign.coupons.map((coupon) => (
              <div key={coupon.id} style={styles.couponCard}>
                <div style={styles.couponCode}>{coupon.code}</div>
                <div style={{
                  ...styles.couponStatus,
                  backgroundColor: coupon.status === 'AVAILABLE' ? '#d1fae5' :
                                  coupon.status === 'USED' ? '#fecaca' : '#fef3c7',
                  color: coupon.status === 'AVAILABLE' ? '#065f46' :
                        coupon.status === 'USED' ? '#991b1b' : '#92400e',
                }}>
                  {coupon.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
  backBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#3b82f6',
    cursor: 'pointer',
    fontSize: '1rem',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '0.5rem',
  },
  desc: {
    color: '#6b7280',
    marginBottom: '2rem',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '0.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  actions: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  generateSection: {
    marginBottom: '1rem',
  },
  generateForm: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.25rem',
    fontSize: '1rem',
    width: '150px',
  },
  generateBtn: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  exportBtn: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    fontSize: '1rem',
    width: '100%',
  },
  warning: {
    color: '#dc2626',
    marginTop: '0.5rem',
  },
  couponList: {
    marginTop: '2rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem',
    marginTop: '1rem',
  },
  couponCard: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '0.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  couponCode: {
    fontFamily: 'monospace',
    fontSize: '1rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  couponStatus: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '0.25rem',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
};
