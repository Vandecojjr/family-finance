import React, { useEffect, useState } from 'react';
import { CategoryService } from '../services/categoryService';
import { Category, CategoryType } from '../types';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isAdding, setIsAdding] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState<CategoryType>(CategoryType.Expense);
    const [newParentId, setNewParentId] = useState<string>('');

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await CategoryService.getCategories();
            if (response.isSuccess) {
                setCategories(response.value);
            } else {
                setError(response.error?.message || 'Erro ao carregar categorias.');
            }
        } catch (err) {
            setError('Erro ao comunicar com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                name: newCategoryName,
                type: newCategoryType,
                parentId: newParentId || undefined
            };
            const response = await CategoryService.createCategory(data);
            if (response.isSuccess) {
                setIsAdding(false);
                setNewCategoryName('');
                setNewCategoryType(CategoryType.Expense);
                setNewParentId('');
                await fetchCategories();
            } else {
                alert(response.error?.message);
            }
        } catch (err) {
            alert('Erro ao criar categoria.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja apagar?')) return;
        try {
            const response = await CategoryService.deleteCategory(id);
            if (response.isSuccess) {
                await fetchCategories();
            } else {
                alert(response.error?.message);
            }
        } catch (err) {
            alert('Erro ao excluir categoria.');
        }
    };

    if (loading) return <div className="p-8">Carregando categorias...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;

    return (
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Categorias</h2>
                    <p className="text-sm text-slate-500 mt-1">Gerencie as despesas e receitas organizadas por categorias</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    <span className="material-symbols-outlined mr-2">add</span>
                    Nova Categoria
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleCreateCategory} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-slate-900">Adicionar Categoria</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                            <input
                                required
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                            <select
                                value={newCategoryType}
                                onChange={(e) => setNewCategoryType(e.target.value as CategoryType)}
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                            >
                                <option value={CategoryType.Expense}>Despesa</option>
                                <option value={CategoryType.Income}>Receita</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria Principal</label>
                            <select
                                value={newParentId}
                                onChange={(e) => setNewParentId(e.target.value)}
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                            >
                                <option value="">(Nenhuma)</option>
                                {categories.filter(c => !c.parentId && c.type === newCategoryType).map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                                Salvar
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <ul className="divide-y divide-slate-100">
                    {categories.length === 0 && (
                        <li className="p-8 text-center text-slate-500">Nenhuma categoria encontrada.</li>
                    )}
                    {categories.map((category) => (
                        <li key={category.id} className="group">
                            <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center ${category.type === CategoryType.Income ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                        <span className="material-symbols-outlined text-xl">
                                            {category.type === CategoryType.Income ? 'trending_up' : 'trending_down'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 leading-tight">{category.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">{category.isCustom ? 'Personalizada' : 'Sistema'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {category.isCustom && (
                                        <button onClick={() => handleDelete(category.id)} className="text-slate-400 hover:text-red-500 p-2">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Renderizar Subcategorias se houver */}
                            {category.subCategories && category.subCategories.length > 0 && (
                                <div className="bg-slate-50 border-t border-slate-100 pl-16">
                                    <ul className="divide-y divide-slate-200">
                                        {category.subCategories.map(sub => (
                                            <li key={sub.id} className="flex justify-between items-center py-3 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-slate-300 text-sm">subdirectory_arrow_right</span>
                                                    <span className="text-sm font-medium text-slate-700">{sub.name}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    {sub.isCustom && (
                                                        <button onClick={() => handleDelete(sub.id)} className="text-slate-400 hover:text-red-500 p-1">
                                                            <span className="material-symbols-outlined text-xs">delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
