import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Wallet as WalletIcon, MoreVertical, CreditCard, Banknote, PiggyBank, TrendingUp } from 'lucide-react';
import { WalletService } from '../services/walletService';
import { Wallet, RecentTransaction, TransactionType } from '../types';
import { CreateWalletModal } from '../components/CreateWalletModal';

const WalletsPage: React.FC = () => {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [walletsRes, txRes] = await Promise.all([
                WalletService.getMyWallets(),
                WalletService.getRecentTransactions(50)
            ]);
            if (walletsRes.isSuccess) setWallets(walletsRes.value);
            if (txRes.isSuccess) setRecentTransactions(txRes.value);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
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
        fetchAllData();
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
                        <div 
                            key={wallet.id} 
                            onClick={() => navigate(`/wallets/${wallet.id}`)}
                            className="hover:scale-[1.02] transition-transform duration-200"
                            style={{
                            backgroundColor: 'white',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.5rem',
                            boxShadow: 'var(--shadow-soft)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            position: 'relative',
                            cursor: 'pointer'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{
                                        padding: '12px',
                                        borderRadius: '12px',
                                        backgroundColor: `${getWalletColor(wallet.type || 'Personal')}15`,
                                        color: getWalletColor(wallet.type || 'Personal')
                                    }}>
                                        {getWalletIcon(wallet.type || 'Personal')}
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{wallet.name}</h3>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{wallet.type || 'Personal'}</span>
                                    </div>
                                </div>
                                <button style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            <div style={{ marginTop: '0.5rem' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Saldo Atual</p>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                    {(wallet.currentBalance || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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

            {/* DASHBOARD DE TRANSAÇÕES GLOBAIS */}
            {!loading && (
                <div style={{ marginTop: '3rem' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
                        Histórico Consolidado
                    </h2>
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {recentTransactions.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                Nenhuma transação recente encontrada nas suas carteiras.
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {recentTransactions.map(tx => {
                                    const isIncome = tx.type === TransactionType.Income || tx.type.toString() === '1' || tx.type.toString() === 'Income';
                                    const isTransfer = tx.type === TransactionType.Transfer || tx.type.toString() === 'Transfer';
                                    
                                    return (
                                        <li key={tx.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                    isTransfer ? 'bg-blue-100 text-blue-600' :
                                                    isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                    <span className="material-symbols-outlined text-xl">
                                                        {isTransfer ? 'sync_alt' : isIncome ? 'trending_up' : 'trending_down'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{tx.description}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                                                            {tx.walletName}
                                                        </span>
                                                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                                                        <span>{tx.accountName}</span>
                                                        <span className="mx-1">•</span>
                                                        <span>{tx.categoryName}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${isTransfer ? 'text-slate-900' : isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                    {!isIncome && !isTransfer ? '-' : isIncome ? '+' : ''}
                                                    {tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {new Date(tx.date).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
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

export default WalletsPage;
