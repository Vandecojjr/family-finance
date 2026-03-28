import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WalletService } from '../services/walletService';
import { Account, Transaction, TransactionType, PagedResult } from '../types';
import { CategoryService } from '../../categories/services/categoryService';
import { Category } from '../../categories/types';

export default function WalletDetailsPage() {
    const { walletId } = useParams<{ walletId: string }>();
    const navigate = useNavigate();
    
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [transactionsResult, setTransactionsResult] = useState<PagedResult<Transaction> | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);

    // Modals state
    const [isAddingAccount, setIsAddingAccount] = useState(false);
    const [newAccName, setNewAccName] = useState('');
    const [newAccIsDebit, setNewAccIsDebit] = useState(true);
    const [newAccIsCredit, setNewAccIsCredit] = useState(false);
    const [newAccIsInvestment, setNewAccIsInvestment] = useState(false);
    const [newAccIsCash, setNewAccIsCash] = useState(false);
    const [newAccInitialBalance, setNewAccInitialBalance] = useState(0);
    const [newAccPreApprovedLimit, setNewAccPreApprovedLimit] = useState(0);

    const [isAddingCard, setIsAddingCard] = useState(false);
    const [newCardName, setNewCardName] = useState('');
    const [newCardLimit, setNewCardLimit] = useState(0);
    const [newCardClosingDay, setNewCardClosingDay] = useState(1);
    const [newCardDueDay, setNewCardDueDay] = useState(5);

    const [isAddingTx, setIsAddingTx] = useState(false);
    const [newTxDesc, setNewTxDesc] = useState('');
    const [newTxAmount, setNewTxAmount] = useState(0);
    const [newTxType, setNewTxType] = useState<TransactionType>(TransactionType.Expense);
    const [newTxCat, setNewTxCat] = useState('');
    const [newTxCardId, setNewTxCardId] = useState<string | undefined>(undefined);
    const [newTxIsCredit, setNewTxIsCredit] = useState(false);

    const fetchAccounts = async () => {
        if (!walletId) return;
        setLoading(true);
        try {
            const res = await WalletService.getAccounts(walletId);
            if (res.isSuccess) {
                setAccounts(res.value);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async (accId: string, page: number = 1) => {
        if (!walletId) return;
        try {
            const res = await WalletService.getTransactions(walletId, accId, page);
            if (res.isSuccess) {
                setTransactionsResult(res.value);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await CategoryService.getCategories();
            if (res.isSuccess) {
                setCategories(res.value);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchAccounts();
        fetchCategories();
    }, [walletId]);

    useEffect(() => {
        if (selectedAccount) {
            fetchTransactions(selectedAccount.id);
        } else {
            setTransactionsResult(null);
        }
    }, [selectedAccount, walletId]);

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!walletId) return;
        try {
            const res = await WalletService.createAccount(walletId, {
                name: newAccName,
                isDebit: newAccIsDebit,
                isCredit: newAccIsCredit,
                isInvestment: newAccIsInvestment,
                isCash: newAccIsCash,
                balance: newAccInitialBalance,
                preApprovedCreditLimit: newAccPreApprovedLimit
            } as any); // Cast because we simplified createAccount DTO but types haven't fully matched yet or Partial<Account> is used
            if (res.isSuccess) {
                setIsAddingAccount(false);
                setNewAccName('');
                setNewAccIsDebit(true);
                setNewAccIsCredit(false);
                setNewAccIsInvestment(false);
                setNewAccIsCash(false);
                setNewAccInitialBalance(0);
                setNewAccPreApprovedLimit(0);
                await fetchAccounts();
            } else {
                alert(res.error?.message);
            }
        } catch (error) {
            alert('Falha ao criar conta');
        }
    };

    const handleCreateCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!walletId || !selectedAccount) return;
        try {
            const res = await WalletService.createCard(walletId, selectedAccount.id, {
                name: newCardName,
                limit: newCardLimit,
                closingDay: newCardClosingDay,
                dueDay: newCardDueDay
            });
            if (res.isSuccess) {
                setIsAddingCard(false);
                setNewCardName('');
                setNewCardLimit(0);
                setNewCardClosingDay(1);
                setNewCardDueDay(5);
                await fetchAccounts(); // To refresh the selected account's cards
            } else {
                alert(res.error?.message);
            }
        } catch (error) {
            alert('Falha ao criar cartão');
        }
    };

    const handleCreateTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!walletId || !selectedAccount) return;
        try {
            const res = await WalletService.createTransaction(walletId, selectedAccount.id, {
                description: newTxDesc,
                amount: newTxAmount,
                type: newTxType,
                categoryId: newTxCat || '00000000-0000-0000-0000-000000000000',
                date: new Date().toISOString(),
                cardId: newTxCardId,
                isCredit: newTxIsCredit
            });
            if (res.isSuccess) {
                setIsAddingTx(false);
                setNewTxDesc('');
                setNewTxAmount(0);
                setNewTxCardId(undefined);
                setNewTxIsCredit(false);
                await fetchTransactions(selectedAccount.id);
                await fetchAccounts(); // to update balance
            } else {
                alert(res.error?.message);
            }
        } catch (error) {
            alert('Falha ao criar transação');
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Caregando detalhes da carteira...</div>;

    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => navigate('/wallets')} className="text-slate-500 hover:text-slate-900 transition-colors">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Contas da Carteira</h2>
                    <p className="text-sm text-slate-500 mt-1">Gerencie as contas bancárias e de crédito</p>
                </div>
                <div className="ml-auto">
                    <button
                        onClick={() => setIsAddingAccount(!isAddingAccount)}
                        className="flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        <span className="material-symbols-outlined mr-2">add</span>
                        Nova Conta
                    </button>
                </div>
            </div>

            {isAddingAccount && (
                <form onSubmit={handleCreateAccount} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-slate-900">Adicionar Conta</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Conta</label>
                            <input
                                required
                                value={newAccName}
                                onChange={(e) => setNewAccName(e.target.value)}
                                className="w-full rounded-lg border-slate-300 shadow-sm px-3 py-2 border"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Capacidades da Conta</label>
                            <div className="flex flex-wrap gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={newAccIsDebit} onChange={e => setNewAccIsDebit(e.target.checked)} className="rounded text-indigo-600" />
                                    <span className="text-sm text-slate-700">Débito</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={newAccIsCredit} onChange={e => setNewAccIsCredit(e.target.checked)} className="rounded text-indigo-600" />
                                    <span className="text-sm text-slate-700">Crédito (Pré-Aprovado)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={newAccIsInvestment} onChange={e => setNewAccIsInvestment(e.target.checked)} className="rounded text-indigo-600" />
                                    <span className="text-sm text-slate-700">Investimento</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={newAccIsCash} onChange={e => setNewAccIsCash(e.target.checked)} className="rounded text-indigo-600" />
                                    <span className="text-sm text-slate-700">Dinheiro Físico</span>
                                </label>
                            </div>
                        </div>

                        {(newAccIsDebit || newAccIsInvestment || newAccIsCash) && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Saldo Inicial</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newAccInitialBalance || ''}
                                    onChange={(e) => setNewAccInitialBalance(parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-lg border-slate-300 shadow-sm px-3 py-2 border"
                                />
                            </div>
                        )}
                        {newAccIsCredit && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Limite Pré-Aprovado</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newAccPreApprovedLimit || ''}
                                    onChange={(e) => setNewAccPreApprovedLimit(parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-lg border-slate-300 shadow-sm px-3 py-2 border"
                                />
                            </div>
                        )}

                        <div className="flex items-end">
                            <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                                Salvar Conta
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista de Contas */}
                <div className="col-span-1 flex flex-col gap-4">
                    {accounts.length === 0 && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-slate-500">
                            Nenhuma conta cadastrada nesta carteira.
                        </div>
                    )}
                    {accounts.map(acc => (
                        <div 
                            key={acc.id} 
                            onClick={() => setSelectedAccount(acc)}
                            className={`p-5 rounded-2xl border cursor-pointer transition-all ${selectedAccount?.id === acc.id ? 'border-indigo-500 bg-indigo-50 shadow-md ring-1 ring-indigo-500' : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'}`}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-slate-900">{acc.name}</h4>
                                <div className="flex gap-1 flex-wrap justify-end">
                                    {acc.isDebit && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded uppercase">Deb</span>}
                                    {acc.isCredit && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded uppercase">Cred</span>}
                                    {acc.isInvestment && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded uppercase">Inv</span>}
                                    {acc.isCash && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded uppercase">Fis</span>}
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Saldo Disponível</span>
                                    <span className="text-lg font-black text-slate-900">
                                        {acc.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                                {acc.isInvestment && (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-indigo-400">Investimentos</span>
                                        <span className="text-lg font-black text-indigo-600">
                                            {acc.investmentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                )}
                                {acc.isCredit && (
                                    <div className="flex flex-col bg-slate-50 p-2 rounded-lg">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Crédito Total</span>
                                        <span className="text-sm font-bold text-slate-700">
                                            {(acc.preApprovedCreditLimit + (acc.cards?.reduce((sum, c) => sum + c.limit, 0) || 0) + acc.collateralCreditLimit).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Área de Transações */}
                <div className="col-span-2">
                    {selectedAccount ? (
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 min-h-[400px]">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Transações e Cartões</h3>
                                    <p className="text-sm text-slate-500">{selectedAccount.name}</p>
                                </div>
                                <div className="flex gap-2">
                                    {selectedAccount.isCredit && (!selectedAccount.cards || selectedAccount.cards.length === 0) && (
                                        <button
                                            onClick={() => setIsAddingCard(!isAddingCard)}
                                            className="flex items-center text-sm font-medium text-purple-600 bg-purple-50 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm mr-1">credit_card</span>
                                            Novo Cartão
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsAddingTx(!isAddingTx)}
                                        className="flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm mr-1">add</span>
                                        Lançar Valor
                                    </button>
                                </div>
                            </div>

                            {isAddingCard && (
                                <form onSubmit={handleCreateCard} className="bg-purple-50 p-4 rounded-xl border border-purple-200 mb-6 flex flex-col gap-3">
                                    <h4 className="text-sm font-bold text-purple-900">Adicionar Novo Cartão</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div className="col-span-1 lg:col-span-2">
                                            <input placeholder="Nome do Cartão" required value={newCardName} onChange={e => setNewCardName(e.target.value)} className="w-full text-sm rounded-lg border-purple-300 px-3 py-2 border focus:ring-purple-500" />
                                        </div>
                                        <div>
                                            <input placeholder="Limite (R$)" type="number" step="0.01" required value={newCardLimit || ''} onChange={e => setNewCardLimit(parseFloat(e.target.value))} className="w-full text-sm rounded-lg border-purple-300 px-3 py-2 border focus:ring-purple-500" />
                                        </div>
                                        <div>
                                            <input placeholder="Dia Fechamento" type="number" min="1" max="31" required value={newCardClosingDay} onChange={e => setNewCardClosingDay(parseInt(e.target.value))} className="w-full text-sm rounded-lg border-purple-300 px-3 py-2 border focus:ring-purple-500" />
                                        </div>
                                        <div>
                                            <input placeholder="Dia Vencimento" type="number" min="1" max="31" required value={newCardDueDay} onChange={e => setNewCardDueDay(parseInt(e.target.value))} className="w-full text-sm rounded-lg border-purple-300 px-3 py-2 border focus:ring-purple-500" />
                                        </div>
                                        <div className="col-span-1 lg:col-span-2 flex items-end">
                                            <button type="submit" className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">Salvar Cartão</button>
                                        </div>
                                    </div>
                                </form>
                            )}

                            {selectedAccount.cards && selectedAccount.cards.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cartões Associados</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedAccount.cards.map(card => (
                                            <div key={card.id} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-col min-w-[150px]">
                                                <span className="text-xs font-bold text-slate-900">{card.name}</span>
                                                <span className="text-sm font-black text-slate-700">{card.limit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                <span className="text-[10px] text-slate-500">Vence dia {card.dueDay}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isAddingTx && (
                                <form onSubmit={handleCreateTransaction} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-col gap-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div className="col-span-1 lg:col-span-2">
                                            <input placeholder="Descrição" required value={newTxDesc} onChange={e => setNewTxDesc(e.target.value)} className="w-full text-sm rounded-lg border-slate-300 px-3 py-2 border" />
                                        </div>
                                        <div>
                                            <input placeholder="Valor (R$)" type="number" step="0.01" required value={newTxAmount || ''} onChange={e => setNewTxAmount(parseFloat(e.target.value))} className="w-full text-sm rounded-lg border-slate-300 px-3 py-2 border" />
                                        </div>
                                        <div>
                                            <select value={newTxType} onChange={e => setNewTxType(e.target.value as TransactionType)} className="w-full text-sm rounded-lg border-slate-300 px-3 py-2 border">
                                                <option value={TransactionType.Expense}>Despesa</option>
                                                <option value={TransactionType.Income}>Receita</option>
                                                {selectedAccount.isInvestment && (
                                                    <>
                                                        <option value={TransactionType.Investment}>Aplicação</option>
                                                        <option value={TransactionType.Redemption}>Resgate</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                        {newTxType === TransactionType.Expense && (
                                            <div className="col-span-1 lg:col-span-2 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 flex flex-col gap-2">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={newTxIsCredit} onChange={e => setNewTxIsCredit(e.target.checked)} className="rounded text-indigo-600" />
                                                    <span className="text-xs font-medium text-slate-700">Usar Crédito</span>
                                                </label>
                                                {newTxIsCredit && (
                                                    <select 
                                                        value={newTxCardId || ''} 
                                                        onChange={e => setNewTxCardId(e.target.value || undefined)} 
                                                        className="w-full text-xs rounded border-slate-300 px-2 py-1 border"
                                                    >
                                                        <option value="">Crédito Pré-Aprovado</option>
                                                        {selectedAccount.cards?.map(card => (
                                                            <option key={card.id} value={card.id}>Cartão: {card.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        )}
                                        <div className="col-span-1 lg:col-span-2">
                                            <select 
                                                value={newTxCat} 
                                                onChange={e => setNewTxCat(e.target.value)} 
                                                className="w-full text-sm rounded-lg border-slate-300 px-3 py-2 border"
                                                required
                                            >
                                                <option value="" disabled>Selecione a Categoria</option>
                                                {categories
                                                    .filter(c => {
                                                        const isIncome = newTxType === TransactionType.Income;
                                                        const cType = c.type.toString();
                                                        if (isIncome) return cType === 'Income' || cType === '1';
                                                        return cType === 'Expense' || cType === '2';
                                                    })
                                                    .map(cat => (
                                                    <optgroup key={cat.id} label={cat.name}>
                                                        <option value={cat.id}>{cat.name} (Geral)</option>
                                                        {cat.subCategories?.map(sub => (
                                                            <option key={sub.id} value={sub.id}>
                                                                ↳ {sub.name}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-1 lg:col-span-2 flex items-end">
                                            <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">Confirmar</button>
                                        </div>
                                    </div>
                                </form>
                            )}

                            <div>
                                {!transactionsResult || transactionsResult.items.length === 0 ? (
                                    <p className="text-center text-slate-500 py-8">Nenhuma transação lançada nesta conta.</p>
                                ) : (
                                    <>
                                        <ul className="divide-y divide-slate-100">
                                            {transactionsResult.items.map(tx => (
                                                <li key={tx.id} className="py-3 flex justify-between items-center group">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                            tx.type === TransactionType.Income ? 'bg-emerald-100 text-emerald-600' : 
                                                            tx.type === TransactionType.Investment ? 'bg-indigo-100 text-indigo-600' :
                                                            tx.type === TransactionType.Redemption ? 'bg-blue-100 text-blue-600' :
                                                            'bg-red-100 text-red-600'
                                                        }`}>
                                                            <span className="material-symbols-outlined text-sm">
                                                                {tx.type === TransactionType.Income ? 'arrow_downward' : 
                                                                 tx.type === TransactionType.Investment ? 'account_balance' :
                                                                 tx.type === TransactionType.Redemption ? 'local_atm' :
                                                                 'arrow_upward'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900">{tx.description}</p>
                                                            <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`font-bold ${
                                                        tx.type === TransactionType.Income ? 'text-emerald-600' : 
                                                        tx.type === TransactionType.Investment ? 'text-indigo-600' :
                                                        tx.type === TransactionType.Redemption ? 'text-blue-600' :
                                                        'text-slate-900'
                                                    }`}>
                                                        {(tx.type === TransactionType.Expense || tx.type === TransactionType.Investment) && '- '}
                                                        {tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        
                                        {transactionsResult.totalPages > 1 && (
                                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                                                <button
                                                    disabled={!transactionsResult.hasPreviousPage}
                                                    onClick={() => fetchTransactions(selectedAccount.id, transactionsResult.page - 1)}
                                                    className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-slate-50 transition-colors"
                                                >
                                                    Anterior
                                                </button>
                                                <span className="text-xs text-slate-500">
                                                    Página {transactionsResult.page} de {transactionsResult.totalPages}
                                                </span>
                                                <button
                                                    disabled={!transactionsResult.hasNextPage}
                                                    onClick={() => fetchTransactions(selectedAccount.id, transactionsResult.page + 1)}
                                                    className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-slate-50 transition-colors"
                                                >
                                                    Próxima
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl h-full min-h-[400px] flex items-center justify-center text-slate-500">
                            Selecione uma conta ao lado para visualizar as transações
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
