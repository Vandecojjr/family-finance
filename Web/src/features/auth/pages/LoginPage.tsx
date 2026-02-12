import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader2, LogIn } from 'lucide-react';
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
        <div className="auth-container">
            <div className="auth-card">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Bem-vindo de volta</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Acesse sua conta familiar</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {successMessage && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            color: 'var(--accent)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                        }}>
                            {successMessage}
                        </div>
                    )}

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--danger)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>E-mail</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="exemplo@email.com"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)',
                                    outline: 'none',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Senha</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Sua senha"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)',
                                    outline: 'none',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            backgroundColor: 'var(--primary)',
                            color: 'var(--text-on-primary)',
                            padding: '0.875rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '1rem',
                            fontWeight: 600,
                            marginTop: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                <LogIn size={18} />
                                Entrar
                            </>
                        )}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                        Não tem uma conta? <Link to="/register" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Registre-se</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
