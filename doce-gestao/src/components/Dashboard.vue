<script setup lang="ts">
import { computed, ref } from 'vue'
import { TrendingUp, ShoppingBag, Wallet, AlertTriangle, ArrowUpRight, CakeSlice } from 'lucide-vue-next'
import type { Period } from '../types'
import { currency, dateLabel, todayISO } from '../utils/format'
import { useConfectioneryStore } from '../stores/confectionery'

const store = useConfectioneryStore()
const period = ref<Period>('monthly')
const now = new Date()
const start = computed(() => {
  const date = new Date(now)
  if (period.value === 'daily') return todayISO()
  if (period.value === 'weekly') {
    date.setDate(date.getDate() - 6)
  } else {
    date.setDate(1)
  }
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
})
const filteredSales = computed(() => store.sales.filter(sale => sale.date >= start.value && sale.date <= todayISO()))
const filteredExpenses = computed(() => store.expenses.filter(expense => expense.date >= start.value && expense.date <= todayISO()))
const revenue = computed(() => filteredSales.value.reduce((sum, sale) => sum + sale.total, 0))
const costOfSales = computed(() => filteredSales.value.reduce((sum, sale) => sum + sale.items.reduce((sub, item) => sub + item.quantity * item.unitCost, 0), 0))
const expensesTotal = computed(() => filteredExpenses.value.reduce((sum, expense) => sum + expense.amount, 0))
const grossProfit = computed(() => revenue.value - costOfSales.value)
const netProfit = computed(() => grossProfit.value - expensesTotal.value)
const soldUnits = computed(() => filteredSales.value.reduce((sum, sale) => sum + sale.items.reduce((sub, item) => sub + item.quantity, 0), 0))
const recentSales = computed(() => [...store.sales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5))
const topProducts = computed(() => {
  const map = new Map<string, number>()
  filteredSales.value.forEach(sale => sale.items.forEach(item => map.set(item.productName, (map.get(item.productName) ?? 0) + item.quantity)))
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
})
const periodLabel = computed(() => period.value === 'daily' ? 'Hoje' : period.value === 'weekly' ? 'Últimos 7 dias' : 'Este mês')
</script>

<template>
  <div class="page-heading">
    <div><p class="eyebrow">RESUMO DE {{ dateLabel(todayISO()).toUpperCase() }}</p><h1>Visão geral <span>♡</span></h1><p class="muted">Aqui está o resumo da sua confeitaria.</p></div>
    <div class="period-switch"><button v-for="item in [{id:'daily',label:'Diário'},{id:'weekly',label:'Semanal'},{id:'monthly',label:'Mensal'}] as const" :key="item.id" :class="{ selected: period === item.id }" @click="period = item.id">{{ item.label }}</button></div>
  </div>

  <div class="summary-grid">
    <article class="metric-card"><div class="metric-top"><span>Faturamento</span><span class="metric-icon pink"><TrendingUp :size="18" /></span></div><strong>{{ currency(revenue) }}</strong><small>{{ periodLabel }} · vendas registradas</small></article>
    <article class="metric-card"><div class="metric-top"><span>Lucro bruto</span><span class="metric-icon green"><Wallet :size="18" /></span></div><strong>{{ currency(grossProfit) }}</strong><small>Faturamento menos custo dos produtos</small></article>
    <article class="metric-card"><div class="metric-top"><span>Lucro líquido estimado</span><span class="metric-icon lilac"><ArrowUpRight :size="18" /></span></div><strong :class="netProfit >= 0 ? 'positive' : 'negative'">{{ currency(netProfit) }}</strong><small>Após despesas lançadas no período</small></article>
    <article class="metric-card"><div class="metric-top"><span>Unidades vendidas</span><span class="metric-icon peach"><ShoppingBag :size="18" /></span></div><strong>{{ soldUnits }}</strong><small>{{ filteredSales.length }} venda(s) no período</small></article>
  </div>

  <div class="dashboard-columns">
    <section class="panel">
      <div class="panel-heading"><div><h2>Resumo financeiro</h2><p class="muted">Entradas e saídas · {{ periodLabel.toLowerCase() }}</p></div><span class="soft-tag">R$</span></div>
      <div class="finance-line"><span><i class="dot revenue-dot"></i>Faturamento</span><strong>{{ currency(revenue) }}</strong></div>
      <div class="finance-line"><span><i class="dot cost-dot"></i>Custo dos produtos vendidos</span><strong>{{ currency(costOfSales) }}</strong></div>
      <div class="finance-line"><span><i class="dot expense-dot"></i>Despesas lançadas</span><strong>{{ currency(expensesTotal) }}</strong></div>
      <div class="finance-total"><span>Resultado do período</span><strong :class="netProfit >= 0 ? 'positive' : 'negative'">{{ currency(netProfit) }}</strong></div>
      <p class="helper-text">O lucro líquido é uma estimativa: considera os custos registrados nos produtos vendidos e as despesas cadastradas no período.</p>
    </section>
    <section class="panel">
      <div class="panel-heading"><div><h2>Produtos mais vendidos</h2><p class="muted">No período selecionado</p></div><CakeSlice :size="20" class="pink-text" /></div>
      <div v-if="topProducts.length" class="top-list"><div v-for="[name, qty] in topProducts" :key="name" class="top-row"><span>{{ name }}</span><strong>{{ qty }} un.</strong></div></div>
      <div v-else class="empty-state compact"><div class="empty-icon"><ShoppingBag /></div><strong>Nenhuma venda por aqui</strong><p>Quando registrar vendas, seus produtos aparecerão aqui.</p></div>
    </section>
  </div>

  <div class="dashboard-columns lower">
    <section class="panel">
      <div class="panel-heading"><div><h2>Vendas recentes</h2><p class="muted">Últimas movimentações registradas</p></div></div>
      <div v-if="recentSales.length" class="table-wrap"><table><thead><tr><th>Data</th><th>Itens</th><th>Pagamento</th><th>Total</th></tr></thead><tbody><tr v-for="sale in recentSales" :key="sale.id"><td>{{ dateLabel(sale.date) }}</td><td>{{ sale.items.reduce((s, i) => s + i.quantity, 0) }}</td><td>{{ sale.paymentMethod }}</td><td class="table-money">{{ currency(sale.total) }}</td></tr></tbody></table></div>
      <div v-else class="empty-state compact"><p>As vendas registradas aparecerão neste espaço.</p></div>
    </section>
    <section class="panel">
      <div class="panel-heading"><div><h2>Atenção ao estoque</h2><p class="muted">Produtos no limite ou abaixo dele</p></div><AlertTriangle :size="20" class="warning-text" /></div>
      <div v-if="store.lowStockProducts.length" class="stock-alerts"><div v-for="product in store.lowStockProducts" :key="product.id" class="stock-alert"><span>{{ product.name }}</span><strong>{{ product.stock }} un.</strong></div></div>
      <div v-else class="empty-state compact"><p>Todos os produtos estão acima do estoque mínimo.</p></div>
    </section>
  </div>
</template>