import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Expense, Product, Sale, SaleItem } from '../types'
import { api } from '../services/api'
import { makeId, todayISO } from '../utils/format'

interface StoredData { products: Product[]; expenses: Expense[]; sales: Sale[] }
const emptyData:StoredData={products:[],expenses:[],sales:[]}

export const useConfectioneryStore = defineStore('confectionery', () => {
  const products = ref<Product[]>([])
  const expenses = ref<Expense[]>([])
  const sales = ref<Sale[]>([])
  const syncError=ref('')
  const syncing=ref(false)
  let revision=0
  let initialized=false
  let pending=false
  let chain=Promise.resolve()
  function apply(data:StoredData) { products.value=data.products;expenses.value=data.expenses;sales.value=data.sales }
  async function load(){initialized=false;syncError.value='';const response=await api<{data:StoredData;revision:number}>('/state');revision=response.revision;apply(response.data||emptyData);initialized=true}
  function reset(){initialized=false;revision=0;syncError.value='';apply(emptyData)}
  function scheduleSave(){
    if(!initialized || pending)return
    pending=true
    queueMicrotask(()=>{
      pending=false
      const snapshot=structuredClone({products:products.value,expenses:expenses.value,sales:sales.value})
      chain=chain.then(async()=>{
        syncing.value=true
        try {const result=await api<{revision:number}>('/state',{method:'PUT',body:JSON.stringify({revision,data:snapshot})});revision=result.revision;syncError.value=''}
        catch(e){syncError.value=e instanceof Error?e.message:'Falha ao salvar';initialized=false}
        finally{syncing.value=false}
      })
    })
  }
  watch([products,expenses,sales],scheduleSave,{deep:true})

  const activeProducts = computed(() => products.value.filter(product => product.active))
  const fixedExpenses = computed(() => expenses.value.filter(expense => expense.recurring).reduce((sum, item) => sum + item.amount, 0))
  const lowStockProducts = computed(() => activeProducts.value.filter(product => product.stock <= product.minStock))

  function saveProduct(product: Omit<Product, 'id'> & { id?: string }) {
    if (product.id) {
      const index = products.value.findIndex(item => item.id === product.id)
      if (index >= 0) products.value[index] = { ...product, id: product.id }
    } else {
      products.value.push({ ...product, id: makeId() })
    }
  }

  function deleteProduct(id: string) {
    products.value = products.value.filter(product => product.id !== id)
  }

  function addStock(id: string, quantity: number) {
    const product = products.value.find(item => item.id === id)
    if (product && quantity > 0) product.stock += quantity
  }

  function saveExpense(expense: Omit<Expense, 'id'>) {
    expenses.value.push({ ...expense, id: makeId() })
  }

  function deleteExpense(id: string) {
    expenses.value = expenses.value.filter(expense => expense.id !== id)
  }

  function registerSale(items: SaleItem[], discount: number, paymentMethod: string, date = todayISO()) {
    if (!items.length) throw new Error('Adicione pelo menos um produto à venda.')
    for (const item of items) {
      const product = products.value.find(product => product.id === item.productId)
      if (!product || product.stock < item.quantity) throw new Error(`Estoque insuficiente para ${item.productName}.`)
    }
    for (const item of items) {
      const product = products.value.find(product => product.id === item.productId)
      if (product) product.stock -= item.quantity
    }
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const sale: Sale = {
      id: makeId(),
      date,
      items: items.map(item => ({ ...item })),
      discount,
      paymentMethod,
      total: Math.max(0, subtotal - discount),
    }
    sales.value.push(sale)
    return sale
  }

  function deleteSale(id: string) {
    const sale = sales.value.find(item => item.id === id)
    if (!sale) return
    for (const item of sale.items) {
      const product = products.value.find(product => product.id === item.productId)
      if (product) product.stock += item.quantity
    }
    sales.value = sales.value.filter(item => item.id !== id)
  }

  return {
    load, reset, syncError, syncing, products, expenses, sales, activeProducts, fixedExpenses, lowStockProducts,
    saveProduct, deleteProduct, addStock, saveExpense, deleteExpense, registerSale, deleteSale,
  }
})