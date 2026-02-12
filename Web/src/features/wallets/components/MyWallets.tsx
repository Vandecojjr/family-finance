import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from '../types';
import { WalletService } from '../services/walletService';

export function MyWallets() {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadWallets();
    }, []);

    async function loadWallets() {
        try {
            const response = await WalletService.getMyWallets();
            if (response.isSuccess) {
                setWallets(response.value);
            } else {
                setError(response.error?.message || 'Erro ao carregar carteiras');
            }
        } catch (err) {
            setError('Falha na comunicação com o servidor');
        } finally {
            setLoading(false);
        }
    }

    return (
        <section style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem 2rem',
            boxShadow: 'var(--shadow-soft)',
            marginBottom: '1rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Minhas Carteiras</h3>
                <button
                    onClick={() => navigate('/wallets?action=create')}
                    style={{
                        color: '#0080ff',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    + Nova Carteira
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
            ) : wallets.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                    <p>Você ainda não possui carteiras.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {wallets.slice(0, 3).map((wallet) => (
                        <div
                            key={wallet.id}
                            style={{
                                padding: '1.25rem',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: '#f8fafc',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => navigate('/wallets')}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>{wallet.type}</span>
                                {wallet.isShared && <span>👥</span>}
                            </div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{wallet.name}</h4>
                            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(wallet.currentBalance)}
                            </p>
                        </div>
                    ))}
                    {wallets.length > 3 && (
                        <div
                            onClick={() => navigate('/wallets')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '1.25rem',
                                borderRadius: '12px',
                                border: '1px dashed #cbd5e1',
                                cursor: 'pointer',
                                color: '#64748b',
                                fontWeight: 500
                            }}
                        >
                            Ver todas ({wallets.length})
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
