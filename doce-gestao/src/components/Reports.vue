<script setup lang="ts">
import { computed, ref } from 'vue'
import { Download, FileBarChart } from 'lucide-vue-next'
import { useConfectioneryStore } from '../stores/confectionery'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { currency, dateLabel, todayISO } from '../utils/format'

const store = useConfectioneryStore()
const period = ref('monthly')
const kind = ref('financial')
const from = ref(todayISO().slice(0, 8) + '01')
const to = ref(todayISO())
const start = computed(() => {
  if (period.value === 'custom') return from.value
  const date = new Date(`${todayISO()}T12:00:00`)
  if (period.value === 'weekly') date.setDate(date.getDate() - 6)
  if (period.value === 'monthly') date.setDate(1)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return period.value === 'daily' ? todayISO() : local.toISOString().slice(0, 10)
})
const end = computed(() => period.value === 'custom' ? to.value : todayISO())
const sales = computed(() => store.sales.filter(sale => sale.date >= start.value && sale.date <= end.value))
const expenses = computed(() => store.expenses.filter(expense => expense.date >= start.value && expense.date <= end.value))
const revenue = computed(() => sales.value.reduce((sum, sale) => sum + sale.total, 0))
const cost = computed(() => sales.value.reduce((sum, sale) => sum + sale.items.reduce((s, item) => s + item.quantity * item.unitCost, 0), 0))
const expenseTotal = computed(() => expenses.value.reduce((sum, expense) => sum + expense.amount, 0))
const units = computed(() => sales.value.reduce((sum, sale) => sum + sale.items.reduce((s, item) => s + item.quantity, 0), 0))
const productRows = computed(() => {
  const map = new Map<string, { quantity: number; revenue: number; cost: number }>()
  sales.value.forEach(sale => sale.items.forEach(item => {
    const current = map.get(item.productName) ?? { quantity: 0, revenue: 0, cost: 0 }
    current.quantity += item.quantity
    current.revenue += item.quantity * item.unitPrice
    current.cost += item.quantity * item.unitCost
    map.set(item.productName, current)
  }))
  return [...map.entries()].sort((a,b) => b[1].quantity - a[1].quantity)
})
const filename=computed(()=>`doce-gestao-${kind.value}-${start.value}-${end.value}`)
const heading=computed(()=>({financial:'Financeiro',sales:'Vendas por produto',expenses:'Despesas',stock:'Estoque'}[kind.value]||'Relatório'))
const reportRows=computed((): (string|number)[][]=>{
 if(kind.value==='sales')return [['Produto','Quantidade','Faturamento','Custo','Lucro bruto'],...productRows.value.map(([name,d])=>[name,d.quantity,d.revenue,d.cost,d.revenue-d.cost])]
 if(kind.value==='expenses')return [['Data','Descrição','Categoria','Tipo','Valor'],...expenses.value.map(e=>[e.date,e.description,e.category,e.recurring?'Recorrente':'Variável',e.amount])]
 if(kind.value==='stock')return [['Produto','Categoria','Estoque','Mínimo','Status'],...store.products.map(p=>[p.name,p.category,p.stock,p.minStock,p.stock<=p.minStock?'Repor':'Disponível'])]
 return [['Indicador','Valor (R$)'],['Faturamento',revenue.value],['Custo dos produtos',cost.value],['Despesas',expenseTotal.value],['Lucro bruto',revenue.value-cost.value],['Lucro líquido estimado',revenue.value-cost.value-expenseTotal.value]]
})
function exportExcel(){
 const workbook=XLSX.utils.book_new()
 const overview=XLSX.utils.aoa_to_sheet([['Doce Gestão - '+heading.value],['Período',`${start.value} a ${end.value}`],[],...reportRows.value])
 overview['!cols']=reportRows.value[0].map((_,i)=>({wch:i===0?32:20}))
 XLSX.utils.book_append_sheet(workbook,overview,'Relatório')
 XLSX.utils.book_append_sheet(workbook,XLSX.utils.json_to_sheet(sales.value.flatMap(s=>s.items.map(i=>({data:s.date,produto:i.productName,quantidade:i.quantity,valor:i.unitPrice*i.quantity,desconto:s.discount,forma:s.paymentMethod})))),'Vendas')
 XLSX.utils.book_append_sheet(workbook,XLSX.utils.json_to_sheet(expenses.value.map(e=>({data:e.date,descricao:e.description,categoria:e.category,valor:e.amount,recorrente:e.recurring}))),'Despesas')
 XLSX.writeFile(workbook,filename.value+'.xlsx')
}
function exportPDF(){
 const pdf=new jsPDF()
 pdf.setFontSize(19);pdf.text('Doce Gestao | '+heading.value,14,20)
 pdf.setFontSize(10);pdf.text(`Periodo: ${dateLabel(start.value)} a ${dateLabel(end.value)}`,14,29)
 let y=42
 const widths=reportRows.value[0].map((_,i)=>i===0?66:(180-66)/(reportRows.value[0].length-1||1))
 reportRows.value.forEach((row,index)=>{
  const lines=row.map((v,i)=>pdf.splitTextToSize(String(typeof v==='number'&&i>0?Number(v).toLocaleString('pt-BR',{maximumFractionDigits:2}):v),widths[i]-4))
  const height=Math.max(9,...lines.map(l=>l.length*5+4))
  if(y+height>278){pdf.addPage();y=20}
  if(index===0){pdf.setFillColor(248,228,236);pdf.rect(14,y-6,182,height,'F')}
  pdf.setFont('helvetica',index===0?'bold':'normal');pdf.setFontSize(9)
  let x=16;lines.forEach((line,i)=>{pdf.text(line,x,y);x+=widths[i]})
  y+=height
 })
 pdf.save(filename.value+'.pdf')
}

</script>

<template>
  <div class="page-heading"><div><p class="eyebrow">ANÁLISE DO NEGÓCIO</p><h1>Relatórios</h1><p class="muted">Acompanhe resultados por período e exporte os dados.</p></div><div class="export-actions"><button class="secondary-btn" @click="exportPDF"><Download :size="17" /> Exportar PDF</button><button class="secondary-btn" @click="exportExcel"><Download :size="17" /> Exportar Excel</button></div></div>
  <section class="panel report-filters"><div class="panel-heading"><div><h2>Filtros do relatório</h2><p class="muted">Escolha o intervalo e o tipo de análise.</p></div><FileBarChart :size="21" class="pink-text" /></div><div class="filter-row"><label class="field">Período<select v-model="period"><option value="daily">Diário (hoje)</option><option value="weekly">Últimos 7 dias</option><option value="monthly">Este mês</option><option value="custom">Personalizado</option></select></label><label v-if="period === 'custom'" class="field">De<input v-model="from" type="date" /></label><label v-if="period === 'custom'" class="field">Até<input v-model="to" type="date" :min="from" /></label><label class="field grow">Tipo de relatório<select v-model="kind"><option value="financial">Financeiro</option><option value="sales">Vendas por produto</option><option value="expenses">Despesas</option><option value="stock">Estoque atual</option></select></label></div><p class="filter-range">Período analisado: <strong>{{ dateLabel(start) }} até {{ dateLabel(end) }}</strong></p></section>
  <template v-if="kind === 'financial'">
    <div class="summary-grid"><article class="metric-card"><div class="metric-top"><span>Faturamento</span></div><strong>{{ currency(revenue) }}</strong><small>Vendas no período</small></article><article class="metric-card"><div class="metric-top"><span>Custo vendido</span></div><strong>{{ currency(cost) }}</strong><small>Custo dos itens vendidos</small></article><article class="metric-card"><div class="metric-top"><span>Despesas</span></div><strong>{{ currency(expenseTotal) }}</strong><small>Despesas lançadas no período</small></article><article class="metric-card"><div class="metric-top"><span>Lucro líquido estimado</span></div><strong :class="revenue - cost - expenseTotal >= 0 ? 'positive' : 'negative'">{{ currency(revenue - cost - expenseTotal) }}</strong><small>Após custos e despesas</small></article></div>

  </template>
  <template v-else-if="kind === 'sales'">
    <section class="panel table-panel"><div class="panel-heading"><div><h2>Vendas por produto</h2><p class="muted">{{ units }} unidade(s) vendida(s) · {{ sales.length }} venda(s)</p></div></div><div v-if="productRows.length" class="table-wrap"><table><thead><tr><th>Produto</th><th>Quantidade</th><th>Faturamento bruto dos itens</th><th>Custo</th><th>Lucro bruto</th></tr></thead><tbody><tr v-for="[name, data] in productRows" :key="name"><td><strong>{{ name }}</strong></td><td>{{ data.quantity }}</td><td>{{ currency(data.revenue) }}</td><td>{{ currency(data.cost) }}</td><td class="positive">{{ currency(data.revenue - data.cost) }}</td></tr></tbody></table></div><div v-else class="empty-state"><p>Não há vendas neste período.</p></div></section>
  </template>
  <template v-else-if="kind === 'expenses'">
    <section class="panel table-panel"><div class="panel-heading"><div><h2>Despesas no período</h2><p class="muted">Total: {{ currency(expenseTotal) }}</p></div></div><div v-if="expenses.length" class="table-wrap"><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th></tr></thead><tbody><tr v-for="expense in expenses" :key="expense.id"><td>{{ dateLabel(expense.date) }}</td><td>{{ expense.description }}</td><td>{{ expense.category }}</td><td>{{ expense.recurring ? 'Recorrente' : 'Variável' }}</td><td class="table-money">{{ currency(expense.amount) }}</td></tr></tbody></table></div><div v-else class="empty-state"><p>Não há despesas neste período.</p></div></section>
  </template>
  <template v-else>
    <section class="panel table-panel"><div class="panel-heading"><div><h2>Posição atual do estoque</h2><p class="muted">Estoque disponível de todos os produtos.</p></div></div><div class="table-wrap"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Quantidade</th><th>Estoque mínimo</th><th>Situação</th></tr></thead><tbody><tr v-for="product in store.products" :key="product.id"><td>{{ product.name }}</td><td>{{ product.category }}</td><td>{{ product.stock }}</td><td>{{ product.minStock }}</td><td><span class="status" :class="{ inactive: product.stock <= product.minStock }">{{ product.stock <= product.minStock ? 'Repor estoque' : 'Disponível' }}</span></td></tr></tbody></table></div></section>
  </template>
</template>