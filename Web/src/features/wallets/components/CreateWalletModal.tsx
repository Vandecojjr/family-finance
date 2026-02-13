import React, { useState } from 'react';
import { X, Wallet as WalletIcon, ArrowRight, AlertCircle } from 'lucide-react';
import { WalletService } from '../services/walletService';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateWalletModal: React.FC<CreateWalletModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('Checking');
    const [initialBalance, setInitialBalance] = useState<string>('0');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState<{ name?: string; balance?: string }>({});

    if (!isOpen) return null;

    const validate = () => {
        const errors: { name?: string; balance?: string } = {};
        if (!name.trim()) errors.name = 'O nome é obrigatório';
        if (name.length < 3) errors.name = 'O nome deve ter pelo menos 3 caracteres';

        const balanceNum = parseFloat(initialBalance.replace(',', '.'));
        if (isNaN(balanceNum)) errors.balance = 'Saldo inválido';

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setError('');

        try {
            const balanceNum = parseFloat(initialBalance.replace(',', '.'));
            const response = await WalletService.createWallet({
                name,
                type,
                initialBalance: balanceNum
            });

            if (response.isSuccess) {
                setName('');
                setType('Checking');
                setInitialBalance('0');
                onSuccess();
                onClose();
            } else {
                setError(response.error?.message || 'Erro ao criar carteira.');
            }
        } catch (err) {
            setError('Erro de comunicação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(8px)'
                        }}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: '24px',
                            padding: '2rem',
                            width: '100%',
                            maxWidth: '440px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            position: 'relative',
                            zIndex: 1001,
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header Decoration */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '6px',
                            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)'
                        }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    backgroundColor: '#eff6ff',
                                    padding: '0.5rem',
                                    borderRadius: '12px',
                                    color: '#3b82f6'
                                }}>
                                    <WalletIcon size={24} />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Nova Carteira</h2>
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    color: '#94a3b8',
                                    padding: '0.5rem',
                                    borderRadius: '50%',
                                    transition: 'background-color 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #fee2e2',
                                    borderRadius: '12px',
                                    padding: '0.75rem 1rem',
                                    marginBottom: '1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: '#dc2626',
                                    fontSize: '0.875rem'
                                }}
                            >
                                <AlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                    Nome da Carteira
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '12px',
                                        border: `1px solid ${validationErrors.name ? '#ef4444' : '#e2e8f0'}`,
                                        fontSize: '1rem',
                                        transition: 'all 0.2s',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.currentTarget.style.borderColor = validationErrors.name ? '#ef4444' : '#e2e8f0'}
                                    placeholder="Ex: Nubank, Carteira Principal"
                                />
                                {validationErrors.name && (
                                    <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                                        {validationErrors.name}
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                        Tipo
                                    </label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '1rem',
                                            backgroundColor: '#fff',
                                            cursor: 'pointer',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        <option value="Checking">Conta Corrente</option>
                                        <option value="Savings">Poupança</option>
                                        <option value="CreditCard">Cartão de Crédito</option>
                                        <option value="Investment">Investimento</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                        Saldo Inicial
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: '1rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: '#94a3b8',
                                            fontSize: '0.875rem',
                                            fontWeight: 600
                                        }}>
                                            R$
                                        </span>
                                        <input
                                            type="text"
                                            value={initialBalance}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9,.-]/g, '');
                                                setInitialBalance(val);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem 1rem 0.75rem 2.5rem',
                                                borderRadius: '12px',
                                                border: `1px solid ${validationErrors.balance ? '#ef4444' : '#e2e8f0'}`,
                                                fontSize: '1rem',
                                                outline: 'none',
                                                boxSizing: 'border-box',
                                                textAlign: 'right'
                                            }}
                                            onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                            onBlur={(e) => e.currentTarget.style.borderColor = validationErrors.balance ? '#ef4444' : '#e2e8f0'}
                                        />
                                    </div>
                                    {validationErrors.balance && (
                                        <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                                            {validationErrors.balance}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    style={{
                                        flex: 1,
                                        padding: '0.875rem',
                                        borderRadius: '14px',
                                        border: '1px solid #e2e8f0',
                                        fontWeight: 600,
                                        color: '#64748b',
                                        backgroundColor: '#fff',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        flex: 1.5,
                                        padding: '0.875rem',
                                        borderRadius: '14px',
                                        border: 'none',
                                        fontWeight: 600,
                                        color: 'white',
                                        backgroundColor: '#3b82f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2563eb')}
                                    onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#3b82f6')}
                                >
                                    {loading ? 'Processando...' : (
                                        <>
                                            Criar Carteira
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
