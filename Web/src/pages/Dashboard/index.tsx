import React from 'react';
import {
    Search,
    Receipt,
    Target,
    FileText,
    ChevronRight,
    TrendingUp,
    Euro
} from 'lucide-react';

import { MyWallets } from '../../features/wallets/components/MyWallets';

const Dashboard: React.FC = () => {
    return (
        <>
            {/* Top Row: Total Balance & Search */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '1.5rem 2rem',
                    borderRadius: 'var(--radius-lg)',
                    width: '320px',
                    boxShadow: 'var(--shadow-soft)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Balanço Total</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{
                            backgroundColor: '#93c5fd',
                            color: '#0080ff',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Euro size={24} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>R$ 12.300,00</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', color: '#10b981', fontSize: '0.875rem', fontWeight: 600 }}>
                        <span>+12%</span>
                        <TrendingUp size={16} style={{ backgroundColor: '#10b981', color: 'white', borderRadius: '50%', padding: '2px' }} />
                    </div>
                </div>

                <div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        border: '3px solid #0080ff',
                        color: '#0080ff',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-soft)'
                    }}>
                        <Search size={20} />
                        <span style={{ fontWeight: 600 }}>Nova Transação</span>
                    </div>
                </div>
            </header>

            {/* My Wallets Section */}
            <MyWallets />

            {/* Middle Row: Rendas, Despesas, Economias */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <MetricCard
                    icon={<FileText size={20} />}
                    label="Rendas"
                    value="R$ 8.500,00"
                    trend="+5%"
                    color="#10b981"
                    iconBg="#d1fae5"
                />
                <MetricCard
                    icon={<Receipt size={20} />}
                    label="Despesas"
                    value="R$ 3.200,00"
                    trend="-2%"
                    color="#ef4444"
                    iconBg="#fee2e2"
                />
                <MetricCard
                    icon={<Target size={20} />}
                    label="Economias"
                    value="R$ 2.450,00"
                    trend="+8%"
                    color="#10b981"
                    iconBg="#dcfce7"
                />
            </div>

            {/* Bottom Row: Chart & Goals */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', flex: 1, minHeight: 0 }}>
                <section style={{
                    backgroundColor: 'white',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'var(--shadow-soft)'
                }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Gasto Menal</h3>
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        padding: '2rem'
                    }}>
                        <svg width="200" height="100" viewBox="0 0 200 100" style={{ marginBottom: '1rem' }}>
                            <path d="M10 80 L50 60 L90 70 L130 30 L170 50" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }} />
                            <circle cx="10" cy="80" r="4" fill="currentColor" style={{ opacity: 0.5 }} />
                            <circle cx="50" cy="60" r="4" fill="currentColor" style={{ opacity: 0.5 }} />
                            <circle cx="90" cy="70" r="4" fill="currentColor" style={{ opacity: 0.5 }} />
                            <circle cx="130" cy="30" r="4" fill="currentColor" style={{ opacity: 0.5 }} />
                            <circle cx="170" cy="50" r="4" fill="currentColor" style={{ opacity: 0.5 }} />
                        </svg>
                        <span style={{ textAlign: 'center', fontSize: '0.9rem' }}>Gráfico de gastos será Implemetando aqui</span>
                    </div>
                </section>

                <section style={{
                    backgroundColor: 'white',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'var(--shadow-soft)'
                }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Metas Próximos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                        <GoalItem label="Novo Carro" current={5000} target={25000} color="#0080ff" currentText="R$ 5.000 / R$ 25.000" />
                        <GoalItem label="Viagem Japão" current={13400} target={20000} color="#10b981" currentText="R$ 13.400 / R$ 20.000" />
                        <GoalItem label="Fundo Emergência" current={49} target={100} color="#ef4444" currentText="49%" />
                    </div>
                    <button style={{
                        alignSelf: 'center',
                        marginTop: '1rem',
                        backgroundColor: '#0080ff',
                        color: 'white',
                        padding: '0.6rem 2rem',
                        borderRadius: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 12px rgba(0, 128, 255, 0.4)'
                    }}>
                        Ver totas <ChevronRight size={18} />
                    </button>
                </section>
            </div>
        </>
    );
};

interface MetricCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    trend: string;
    color: string;
    iconBg: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, trend, color, iconBg }) => (
    <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        boxShadow: 'var(--shadow-soft)',
    }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
                padding: '8px',
                borderRadius: '10px',
                backgroundColor: iconBg,
                color: color,
                display: 'flex'
            }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: color }}>{value}</span>
            </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <span style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: color,
            }}>
                {trend}
            </span>
        </div>
    </div>
);

interface GoalItemProps {
    label: string;
    current: number;
    target: number;
    color: string;
    currentText: string;
}

const GoalItem: React.FC<GoalItemProps> = ({ label, current, target, color, currentText }) => {
    const percentage = Math.min(Math.round((current / target) * 100), 100);
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '10px' }}>
                <span style={{ fontWeight: 500 }}>{label}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{currentText}</span>
            </div>
            <div style={{ height: '8px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: color, borderRadius: '4px' }} />
            </div>
        </div>
    );
};

export default Dashboard;
