<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Plus, Trash2, ReceiptText } from 'lucide-vue-next'
import { useDialog } from '../stores/dialog'
import { useConfectioneryStore } from '../stores/confectionery'
import { currency, dateLabel, todayISO } from '../utils/format'

const store = useConfectioneryStore()
const dialog = useDialog()
const form = reactive({ description: '', category: 'Contas fixas', amount: 0, date: todayISO(), recurring: false })
const showForm = ref(false)
const total = computed(() => store.expenses.reduce((sum, expense) => sum + expense.amount, 0))
const recurringTotal = computed(() => store.expenses.filter(expense => expense.recurring).reduce((sum, expense) => sum + expense.amount, 0))
function submit() {
  if (!form.description.trim() || form.amount <= 0 || !form.date) return
  store.saveExpense({ ...form, description: form.description.trim() })
  Object.assign(form, { description: '', category: 'Contas fixas', amount: 0, date: todayISO(), recurring: false })
  showForm.value = false
}
async function remove(id: string, description: string) {
  if (await dialog.confirm(`Excluir a despesa "${description}"?`)) {store.deleteExpense(id);dialog.notify("Despesa excluída.")}
}
</script>

<template>
  <div class="page-heading"><div><p class="eyebrow">CONTROLE FINANCEIRO</p><h1>Despesas</h1><p class="muted">Registre contas fixas e gastos variáveis da confeitaria.</p></div><button class="primary-btn" @click="showForm = !showForm"><Plus :size="18" /> Nova despesa</button></div>
  <div class="summary-grid two"><article class="metric-card"><div class="metric-top"><span>Total cadastrado</span><span class="metric-icon peach"><ReceiptText :size="18" /></span></div><strong>{{ currency(total) }}</strong><small>Soma dos lançamentos registrados</small></article><article class="metric-card"><div class="metric-top"><span>Despesas recorrentes</span><span class="metric-icon pink"><ReceiptText :size="18" /></span></div><strong>{{ currency(recurringTotal) }}</strong><small>Contas marcadas como fixas/recorrentes</small></article></div>
  <form v-if="showForm" class="panel inline-form" @submit.prevent="submit"><div class="panel-heading"><div><h2>Adicionar despesa</h2><p class="muted">Informe os dados do gasto.</p></div></div><div class="form-grid"><label class="field span-2">Descrição *<input v-model="form.description" required placeholder="Ex.: Compra de embalagens" /></label><label class="field">Categoria<select v-model="form.category"><option>Contas fixas</option><option>Ingredientes</option><option>Embalagens</option><option>Transporte</option><option>Manutenção</option><option>Outros</option></select></label><label class="field">Valor (R$) *<input v-model.number="form.amount" type="number" min="0.01" step="0.01" required /></label><label class="field">Data *<input v-model="form.date" type="date" required /></label><label class="check-field align-end"><input v-model="form.recurring" type="checkbox" /> Despesa fixa/recorrente</label></div><div class="form-actions"><button type="button" class="secondary-btn" @click="showForm = false">Cancelar</button><button class="primary-btn" type="submit">Salvar despesa</button></div></form>
  <section class="panel table-panel"><div class="panel-heading"><div><h2>Histórico de despesas</h2><p class="muted">Despesas iniciais já cadastradas: internet, energia e água.</p></div></div><div v-if="store.expenses.length" class="table-wrap"><table><thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th>Tipo</th><th>Valor</th><th>Ação</th></tr></thead><tbody><tr v-for="expense in [...store.expenses].sort((a,b) => b.date.localeCompare(a.date))" :key="expense.id"><td><strong>{{ expense.description }}</strong></td><td>{{ expense.category }}</td><td>{{ dateLabel(expense.date) }}</td><td><span class="status" :class="{ recurring: expense.recurring }">{{ expense.recurring ? 'Recorrente' : 'Variável' }}</span></td><td class="table-money">{{ currency(expense.amount) }}</td><td><button class="icon-btn danger" title="Excluir" @click="remove(expense.id, expense.description)"><Trash2 :size="16" /></button></td></tr></tbody></table></div><div v-else class="empty-state"><p>Nenhuma despesa cadastrada.</p></div></section>
</template>