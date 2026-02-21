import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const successMessage = location.state?.message;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const { signIn, signed } = useAuth(); // Get signed state

    // Redirect when signed becomes true
    React.useEffect(() => {
        if (signed) {
            navigate('/dashboard');
        }
    }, [signed, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/accounts/login', formData);
            const result = response.data;

            if (result.isSuccess && result.value) {
                signIn(result.value.accessToken, result.value.refreshToken);
                // Navigation handled by useEffect
            } else {
                setError(result.errors?.[0]?.message || 'Erro ao realizar login.');
                setLoading(false);
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.detail || 'E-mail ou senha inválidos.';
            setError(errorMsg);
            setLoading(false);
        }
    };

    return (
        <div className="bg-bg-main text-slate-800 min-h-screen flex flex-col font-display">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 lg:px-12 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 text-brand-blue">
                        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z" fill="currentColor"></path>
                        </svg>
                    </div>
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900">FamilyFinance</h1>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <Link className="text-sm font-medium text-slate-600 hover:text-primary transition-colors" to="#">Segurança</Link>
                    <Link className="text-sm font-medium text-slate-600 hover:text-primary transition-colors" to="#">Preços</Link>
                    <Link className="text-sm font-medium text-slate-600 hover:text-primary transition-colors" to="#">Suporte</Link>
                </div>
            </header>

            {/* Main Section */}
            <main className="flex-1 flex items-center justify-center p-6 bg-soft-gradient">
                <div className="w-full max-w-[440px]">
                    <div className="bg-card-bg border border-slate-200 rounded-xl shadow-xl shadow-slate-200/60 overflow-hidden">
                        <div className="p-8 pb-4 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-primary text-4xl">family_history</span>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">Bem-vindo de volta</h2>
                            <p className="text-slate-500 text-sm">Gerencie o futuro financeiro da sua família com segurança</p>
                        </div>
                        <div className="p-8">
                            <form className="space-y-5" onSubmit={handleSubmit}>
                                {successMessage && (
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm border border-emerald-200">
                                        {successMessage}
                                    </div>
                                )}
                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
                                        {error}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700">E-mail</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                                        <input 
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-slate-900 placeholder:text-slate-400" 
                                            placeholder="nome@emaildafamilia.com.br" 
                                            type="email"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-semibold text-slate-700">Senha</label>
                                        <Link className="text-xs font-bold text-primary-dark hover:text-primary transition-colors" to="#">Esqueceu a senha?</Link>
                                    </div>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                                        <input 
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-slate-900 placeholder:text-slate-400" 
                                            placeholder="Sua senha" 
                                            type="password"
                                            required
                                        />
                                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" type="button">
                                            <span className="material-symbols-outlined text-xl">visibility</span>
                                        </button>
                                    </div>
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input className="w-5 h-5 rounded border-slate-300 bg-white text-primary focus:ring-primary/30" type="checkbox"/>
                                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Lembrar de mim</span>
                                </label>
                                <button disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-slate-900 font-bold py-3.5 rounded-lg shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-2" type="submit">
                                    {loading ? (
                                        <span>Entrando...</span>
                                    ) : (
                                        <>
                                            <span>Entrar</span>
                                            <span className="material-symbols-outlined text-lg">login</span>
                                        </>
                                    )}
                                </button>
                            </form>
                            
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-200"></span>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">Ou continue com</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-center">
                                <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed opacity-40 grayscale transition-all" disabled title="Atualmente indisponível">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
                                    </svg>
                                    <span className="text-sm font-semibold text-slate-500">Google</span>
                                </button>
                            </div>
                        </div>
                        
                        <div className="bg-slate-50/80 p-6 text-center border-t border-slate-200">
                            <p className="text-sm text-slate-600">
                                Não tem uma conta?
                                <Link className="text-primary-dark font-bold hover:underline ml-1" to="/register">Cadastre sua família</Link>
                            </p>
                        </div>
                    </div>
                    
                    <div className="mt-8 flex items-center justify-center gap-2 text-slate-400">
                        <span className="material-symbols-outlined text-sm">verified_user</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Criptografia de nível bancário 256-bit</span>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="px-6 py-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
                <div className="text-xs text-slate-400">
                    © 2024 FamilyFinance Inc. Todos os direitos reservados.
                </div>
                <div className="flex gap-6">
                    <Link className="text-xs text-slate-400 hover:text-primary transition-colors" to="#">Política de Privacidade</Link>
                    <Link className="text-xs text-slate-400 hover:text-primary transition-colors" to="#">Termos de Uso</Link>
                    <Link className="text-xs text-slate-400 hover:text-primary transition-colors" to="#">Cookies</Link>
                </div>
            </footer>
        </div>
    );
};

export default Login;
