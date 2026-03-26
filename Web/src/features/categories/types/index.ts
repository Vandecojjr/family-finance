export enum CategoryType {
    Expense = 'Expense',
    Income = 'Income'
}

export interface Category {
    id: string;
    name: string;
    type: CategoryType;
    parentId?: string;
    isCustom: boolean;
    subCategories: Category[];
}
