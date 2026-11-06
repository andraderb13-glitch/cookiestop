export interface Product {
  id: string
  name: string
  category: string
  description: string
  cost: number
  price: number
  stock: number
  minStock: number
  active: boolean
}

export interface Expense {
  id: string
  description: string
  category: string
  amount: number
  date: string
  recurring: boolean
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  unitCost: number
}

export interface Sale {
  id: string
  date: string
  items: SaleItem[]
  discount: number
  paymentMethod: string
  total: number
}

export type Period = 'daily' | 'weekly' | 'monthly'
export type Section = 'dashboard' | 'products' | 'product-form' | 'expenses' | 'sales' | 'reports' 