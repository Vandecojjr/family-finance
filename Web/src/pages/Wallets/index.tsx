import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Wallet as WalletIcon, MoreVertical, CreditCard, Banknote, PiggyBank, TrendingUp } from 'lucide-react';
import { WalletService } from '../../services/WalletService';
import { Wallet } from '../../types';
import { CreateWalletModal } from '../../components/Modals/CreateWalletModal';

const Wallets: React.FC = () => {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    const fetchWallets = async () => {
        setLoading(true);
        try {
            const response = await WalletService.getMyWallets();
            if (response.isSuccess) {
                setWallets(response.value);
            }
        } catch (error) {
            console.error('Failed to fetch wallets', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallets();
    }, []);

    useEffect(() => {
        if (searchParams.get('action') === 'create') {
            setIsCreateModalOpen(true);
        }
    }, [searchParams]);

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        // Remove action param
        searchParams.delete('action');
        setSearchParams(searchParams);
    };

    const handleSuccessCreate = () => {
        fetchWallets();
    };

    const getWalletIcon = (type: string) => {
        switch (type) {
            case 'Checking': return <Banknote size={24} />;
            case 'Savings': return <PiggyBank size={24} />;
            case 'CreditCard': return <CreditCard size={24} />;
            case 'Investment': return <TrendingUp size={24} />;
            default: return <WalletIcon size={24} />;
        }
    };

    const getWalletColor = (type: string) => {
        switch (type) {
            case 'Checking': return '#0080ff';
            case 'Savings': return '#10b981';
            case 'CreditCard': return '#ef4444';
            case 'Investment': return '#8b5cf6';
            default: return '#64748b';
        }
    };

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Minhas Carteiras</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gerencie suas contas e cartões</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    style={{
                        backgroundColor: '#0080ff',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 128, 255, 0.3)'
                    }}
                >
                    <Plus size={20} />
                    Nova Carteira
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    Carregando carteiras...
                </div>
            ) : wallets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'white', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ backgroundColor: '#f0f9ff', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#0080ff' }}>
                        <WalletIcon size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nenhuma carteira encontrada</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Crie sua primeira carteira para começar a controlar suas finanças.</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        style={{ color: '#0080ff', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        Criar Carteira Agora
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {wallets.map(wallet => (
                        <div key={wallet.id} style={{
                            backgroundColor: 'white',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.5rem',
                            boxShadow: 'var(--shadow-soft)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{
                                        padding: '12px',
                                        borderRadius: '12px',
                                        backgroundColor: `${getWalletColor(wallet.type)}15`,
                                        color: getWalletColor(wallet.type)
                                    }}>
                                        {getWalletIcon(wallet.type)}
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{wallet.name}</h3>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{wallet.type}</span>
                                    </div>
                                </div>
                                <button style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            <div style={{ marginTop: '0.5rem' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Saldo Atual</p>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                    {wallet.currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </h2>
                            </div>

                            {wallet.isShared && (
                                <div style={{
                                    marginTop: 'auto',
                                    paddingTop: '1rem',
                                    borderTop: '1px solid #f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.85rem',
                                    color: 'var(--text-muted)'
                                }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                                    Compartilhada {wallet.ownerName ? `por ${wallet.ownerName}` : ''}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <CreateWalletModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleSuccessCreate}
            />
        </div>
    );
};

export default Wallets;
