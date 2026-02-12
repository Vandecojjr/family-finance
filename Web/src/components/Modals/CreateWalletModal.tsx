import React, { useState } from 'react';
import { X } from 'lucide-react';
import { WalletService } from '../../services/WalletService';

interface CreateWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateWalletModal: React.FC<CreateWalletModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('Checking'); // Default to Checking
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await WalletService.createWallet({ name, type });
            if (response.isSuccess) {
                setName('');
                setType('Checking');
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
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                width: '100%',
                maxWidth: '400px',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Nova Carteira</h2>
                    <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
                        <X size={24} />
                    </button>
                </div>

                {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Nome</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ex: Nubank, Carteira Principal"
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Tipo</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="Checking">Conta Corrente</option>
                            <option value="Savings">Poupança</option>
                            <option value="CreditCard">Cartão de Crédito</option>
                            <option value="Investment">Investimento</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid #e2e8f0',
                                fontWeight: 600,
                                color: 'var(--text-muted)',
                                backgroundColor: 'white'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                fontWeight: 600,
                                color: 'white',
                                backgroundColor: '#0080ff',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Criando...' : 'Criar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
