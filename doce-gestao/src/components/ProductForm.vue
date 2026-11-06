<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { ArrowLeft, Save } from 'lucide-vue-next'
import type { Product } from '../types'
import { useDialog } from '../stores/dialog'
import { useConfectioneryStore } from '../stores/confectionery'
import { currency } from '../utils/format'

const props = defineProps<{ product: Product | null }>()
const emit = defineEmits<{ back: [] }>()
const store = useConfectioneryStore()
const dialog = useDialog()
const form = reactive({ name: '', category: 'Cupcakes', description: '', cost: 0, price: 0, stock: 0, minStock: 5, active: true })
const margin = computed(() => form.price - form.cost)
watch(() => props.product, product => {
  delete (form as typeof form & { id?: string }).id
  Object.assign(form, product ? { ...product } : { name: '', category: 'Cupcakes', description: '', cost: 0, price: 0, stock: 0, minStock: 5, active: true })
}, { immediate: true })
function submit() {
  if (!form.name.trim() || form.price <= 0 || form.cost < 0 || form.stock < 0 || form.minStock < 0) return
  store.saveProduct({ ...form, name: form.name.trim(), description: form.description.trim(), ...(props.product ? { id: props.product.id } : {}) })
  dialog.notify('Produto salvo com sucesso!')
  emit('back')
}
</script>

<template>
  <div class="page-heading"><div><p class="eyebrow">CATÁLOGO DA CONFEITARIA</p><h1>{{ product ? 'Editar produto' : 'Cadastrar produto' }}</h1><p class="muted">Preencha as informações para controlar custo, preço e estoque.</p></div><button class="secondary-btn" @click="emit('back')"><ArrowLeft :size="17" /> Voltar</button></div>
  <form class="panel form-panel" @submit.prevent="submit">
    <div class="form-section-title"><span class="section-number">01</span><div><h2>Informações do produto</h2><p class="muted">Identificação e categoria</p></div></div>
    <div class="form-grid"><label class="field span-2">Nome do produto *<input v-model="form.name" required maxlength="80" placeholder="Ex.: Cupcake de chocolate" /></label><label class="field">Categoria<select v-model="form.category"><option>Cupcakes</option><option>Bolos</option><option>Docinhos</option><option>Tortas</option><option>Cookies</option><option>Bebidas</option><option>Outros</option></select></label><label class="field span-2">Descrição<textarea v-model="form.description" rows="2" placeholder="Descreva o produto (opcional)" /></label></div>
    <div class="form-section-title separated"><span class="section-number">02</span><div><h2>Valores e estoque</h2><p class="muted">Esses dados alimentam os cálculos financeiros.</p></div></div>
    <div class="form-grid"><label class="field">Custo unitário (R$) *<input v-model.number="form.cost" type="number" min="0" step="0.01" required /></label><label class="field">Preço de venda (R$) *<input v-model.number="form.price" type="number" min="0.01" step="0.01" required /></label><label class="field">Estoque inicial (un.)<input v-model.number="form.stock" type="number" min="0" step="1" /></label><label class="field">Alerta de estoque mínimo<input v-model.number="form.minStock" type="number" min="0" step="1" /></label></div>
    <div class="margin-preview"><div><small>Lucro bruto por unidade</small><strong :class="margin >= 0 ? 'positive' : 'negative'">{{ currency(margin) }}</strong></div><div><small>Margem sobre a venda</small><strong>{{ form.price > 0 ? ((margin / form.price) * 100).toFixed(1).replace('.', ',') : '0,0' }}%</strong></div></div>
    <label class="check-field"><input v-model="form.active" type="checkbox" /> Produto ativo e disponível para venda</label>
    <div class="form-actions"><button type="button" class="secondary-btn" @click="emit('back')">Cancelar</button><button class="primary-btn" type="submit"><Save :size="17" /> Salvar produto</button></div>
  </form>
</template>