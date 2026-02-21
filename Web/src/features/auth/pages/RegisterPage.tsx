import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../services/api';
import { maskCpf, validateCpf } from '../../../utils/validation';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        familyName: '',
        document: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'document') {
            setFormData(prev => ({ ...prev, [name]: maskCpf(value) }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateCpf(formData.document)) {
            setError('O CPF informado é inválido. Por favor, verifique os números.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.post('/accounts/register', formData);
            navigate('/login', { state: { message: 'Conta criada com sucesso! Faça login para continuar.' } });
        } catch (err: any) {
            const message = err.response?.data?.detail || err.response?.data?.errors?.[0] || 'Ocorreu um erro ao criar a conta.';
            setError(Array.isArray(message) ? message.join(', ') : message);
        } finally {
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
                            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-6 shadow-md shadow-primary/30">
                                <span className="material-symbols-outlined text-white text-3xl">payments</span>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">Family Finance</h2>
                            <p className="text-slate-500 text-sm">Crie sua conta para começar a gerenciar</p>
                        </div>
                        <div className="p-8 pt-4">
                            <form className="space-y-4" onSubmit={handleSubmit}>
                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
                                        {error}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700">Seu Nome</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">person</span>
                                        <input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                            placeholder="Ex: João Silva"
                                            type="text"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700">E-mail</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                                        <input
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                            placeholder="Ex: joao@email.com"
                                            type="email"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700">Senha</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                                        <input
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                            placeholder="No mínimo 6 caracteres"
                                            type="password"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700">Nome da Família</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">home</span>
                                        <input
                                            name="familyName"
                                            value={formData.familyName}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                            placeholder="Ex: Família Silva"
                                            type="text"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700">CPF</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">description</span>
                                        <input
                                            name="document"
                                            value={formData.document}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                            placeholder="Ex: 000.000.000-00"
                                            type="text"
                                            required
                                        />
                                    </div>
                                </div>

                                <button disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-slate-900 font-bold py-3.5 rounded-lg shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-6" type="submit">
                                    {loading ? (
                                        <span>Criando...</span>
                                    ) : (
                                        <span>Criar Conta</span>
                                    )}
                                </button>
                            </form>

                        </div>

                        <div className="bg-slate-50/80 p-6 text-center border-t border-slate-200">
                            <p className="text-sm text-slate-600">
                                Já tem uma conta?
                                <Link className="text-primary-dark font-bold hover:underline ml-1" to="/login">Entrar</Link>
                            </p>
                        </div>
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

export default Register;
