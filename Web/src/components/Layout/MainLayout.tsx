import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';

interface MainLayoutProps {
    children: React.ReactNode;
    title?: string;
    headerContent?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, title, headerContent }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut } = useAuth();

    const menuItems = [
        { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
        { icon: 'account_balance_wallet', label: 'Carteiras', path: '/wallets' },
        { icon: 'trending_up', label: 'Incomes', path: '/incomes' },
        { icon: 'trending_down', label: 'Expenses', path: '/expenses' },
        { icon: 'settings', label: 'Administração', path: '/admin' },
    ];

    const handleLogout = () => {
        signOut();
        navigate('/login');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-display">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-20">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-slate-900 shadow-sm">
                        <span className="material-symbols-outlined text-3xl font-bold">account_balance_wallet</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-none">Family Finance</h1>
                        <p className="text-xs text-slate-500">Gestão Familiar</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const active = location.pathname.startsWith(item.path);
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${active
                                    ? 'active-nav text-slate-900 font-bold rounded-r-lg'
                                    : 'text-slate-600 hover:bg-slate-50 font-medium rounded-lg'
                                    }`}
                            >
                                <span className="material-symbols-outlined">{item.icon}</span>
                                <span className="text-sm">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors group text-left"
                    >
                        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs overflow-hidden">
                            JS
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-medium truncate group-hover:text-slate-900">João Silva</p>
                            <p className="text-xs text-slate-500 truncate">Sair da aplicação</p>
                        </div>
                        <span className="material-symbols-outlined flex-shrink-0 text-slate-400 group-hover:text-red-500 transition-colors text-lg">logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
                {/* Optional Header per page */}
                {(title || headerContent) && (
                    <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            {title && (
                                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
                            )}
                        </div>
                        {headerContent && (
                            <div>
                                {headerContent}
                            </div>
                        )}
                    </header>
                )}

                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
