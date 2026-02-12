import React from 'react';
import { Home, TrendingUp, TrendingDown, Wallet, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface MainLayoutProps {
    children: React.ReactNode;
    title?: string;
    headerContent?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, title, headerContent }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { icon: <Home size={20} />, label: 'Dashboard', path: '/dashboard' },
        { icon: <Wallet size={20} />, label: 'Carteiras', path: '/wallets' },
        { icon: <TrendingUp size={20} />, label: 'Empoudo', path: '/incomes' },
        { icon: <TrendingDown size={20} />, label: 'Expondo', path: '/expenses' },
    ];

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            backgroundColor: 'var(--bg-main)',
            padding: '2rem'
        }}>
            <div style={{
                display: 'flex',
                width: '100%',
                gap: '2rem',
                height: 'calc(100vh - 4rem)'
            }}>
                {/* Sidebar */}
                <aside style={{
                    width: '240px',
                    backgroundColor: 'var(--bg-sidebar)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '2rem 0',
                    boxShadow: 'var(--shadow-lg)',
                    color: 'white',
                    flexShrink: 0
                }}>
                    <div style={{ padding: '0 2rem', marginBottom: '3rem' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Family Finance</span>
                    </div>

                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                        {menuItems.map((item) => (
                            <SidebarItem
                                key={item.path}
                                icon={item.icon}
                                label={item.label}
                                active={location.pathname === item.path}
                                onClick={() => navigate(item.path)}
                            />
                        ))}
                    </nav>

                    <div style={{ padding: '0 1.5rem', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '2px solid rgba(255,255,255,0.1)',
                                backgroundColor: '#0080ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700
                            }}>
                                JS
                            </div>
                            <div style={{ overflow: 'hidden', flex: 1 }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>João Silva</p>
                            </div>
                            <div style={{ cursor: 'pointer' }} onClick={() => {
                                localStorage.removeItem('@FamilyFinance:token');
                                navigate('/login');
                            }}>
                                <LogOut size={18} />
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0, overflowY: 'auto' }}>
                    {/* Optional Header per page */}
                    {(title || headerContent) && (
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            {title && (
                                <div style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    padding: '1rem 2rem',
                                    borderRadius: 'var(--radius-lg)',
                                    boxShadow: 'var(--shadow-soft)',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{title}</h2>
                                </div>
                            )}
                            {headerContent}
                        </header>
                    )}

                    {children}
                </main>
            </div>
        </div>
    );
};

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.75rem 2rem',
            position: 'relative',
            color: active ? 'white' : 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontWeight: active ? 600 : 400,
            backgroundColor: active ? 'rgba(255,255,255,0.05)' : 'transparent',
        }}>
        {active && (
            <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                backgroundColor: '#0080ff',
                borderRadius: '0 4px 4px 0'
            }} />
        )}
        {icon}
        <span style={{ fontSize: '1rem' }}>{label}</span>
    </div>
);
