import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.container}>Loading...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Dashboard</h1>
          <Link to="/campaigns/new" style={styles.createBtn}>
            Create Campaign
          </Link>
        </div>

        <div style={styles.grid}>
          {campaigns.length === 0 ? (
            <p style={styles.empty}>No campaigns yet. Create one to get started!</p>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} style={styles.card}>
                <h3 style={styles.cardTitle}>{campaign.name}</h3>
                {campaign.description && (
                  <p style={styles.cardDesc}>{campaign.description}</p>
                )}
                <div style={styles.cardStats}>
                  <div>
                    <strong>Coupons:</strong> {campaign._count.coupons} / {campaign.totalLimit}
                  </div>
                  <div>
                    <strong>Period:</strong> {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                  </div>
                </div>
                <Link to={`/campaigns/${campaign.id}`} style={styles.viewBtn}>
                  View Details
                </Link>
              </div>
            ))
          )}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  createBtn: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.25rem',
    textDecoration: 'none',
    fontWeight: '500',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  empty: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '1.1rem',
    padding: '3rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cardDesc: {
    color: '#6b7280',
    fontSize: '0.9rem',
  },
  cardStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    fontSize: '0.9rem',
    color: '#374151',
  },
  viewBtn: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.25rem',
    textDecoration: 'none',
    textAlign: 'center',
    fontWeight: '500',
  },
};
