<script setup lang="ts">
import { ref } from 'vue'
import { PackagePlus, Pencil, Trash2, Plus, Search } from 'lucide-vue-next'
import { useDialog } from '../stores/dialog'
import { useConfectioneryStore } from '../stores/confectionery'
import { currency } from '../utils/format'
import type { Product } from '../types'

const store = useConfectioneryStore()
const dialog = useDialog()
const emit = defineEmits<{ edit: [product: Product] }>()
const search = ref('')
const stockInput = ref<Record<string, string>>({})
function replenish(id: string) {
  const quantity = Number(stockInput.value[id])
  if (quantity > 0) {
    store.addStock(id, quantity)
    stockInput.value[id] = ''
  }
}
async function remove(id: string, name: string) {
  if (await dialog.confirm(`Excluir "${name}"? O histórico de vendas será mantido.`)) { store.deleteProduct(id); dialog.notify("Produto excluído.") }
}
</script>

<template>
  <div class="page-heading"><div><p class="eyebrow">CATÁLOGO DA CONFEITARIA</p><h1>Produtos e estoque</h1><p class="muted">Acompanhe seus produtos, preços e quantidades disponíveis.</p></div><button class="primary-btn" @click="emit('edit', null as unknown as Product)"><Plus :size="18" /> Novo produto</button></div>
  <div class="toolbar"><label class="search-box"><Search :size="18" /><input v-model="search" placeholder="Buscar produto..." /></label><span class="muted">{{ store.products.length }} produto(s) cadastrado(s)</span></div>
  <section class="panel table-panel">
    <div v-if="store.products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).length" class="table-wrap">
      <table><thead><tr><th>Produto</th><th>Categoria</th><th>Custo</th><th>Venda</th><th>Margem bruta</th><th>Estoque</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody><tr v-for="product in store.products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))" :key="product.id">
          <td><strong>{{ product.name }}</strong><small class="table-sub">{{ product.description || 'Sem descrição' }}</small></td><td>{{ product.category }}</td><td>{{ currency(product.cost) }}</td><td>{{ currency(product.price) }}</td><td class="positive">{{ currency(product.price - product.cost) }}</td><td><span class="stock-pill" :class="{ low: product.stock <= product.minStock }">{{ product.stock }} un.</span></td><td><span class="status" :class="{ inactive: !product.active }">{{ product.active ? 'Ativo' : 'Inativo' }}</span></td>
          <td><div class="action-buttons"><button class="icon-btn" title="Editar" @click="emit('edit', product)"><Pencil :size="16" /></button><button class="icon-btn danger" title="Excluir" @click="remove(product.id, product.name)"><Trash2 :size="16" /></button></div></td>
        </tr></tbody>
      </table>
    </div>
    <div v-else class="empty-state"><div class="empty-icon"><PackagePlus /></div><strong>Nenhum produto encontrado</strong><p>Cadastre um produto para começar a organizar seu estoque.</p></div>
  </section>
  <section class="panel replenish-panel"><div class="panel-heading"><div><h2>Entrada de estoque</h2><p class="muted">Registre ingredientes prontos ou produtos produzidos para venda.</p></div></div>
    <div class="replenish-grid"><div v-for="product in store.products.filter(p => p.active)" :key="product.id" class="replenish-item"><div><strong>{{ product.name }}</strong><small>Estoque atual: {{ product.stock }} un.</small></div><div class="replenish-controls"><input v-model="stockInput[product.id]" type="number" min="1" placeholder="Qtd." /><button class="small-btn" @click="replenish(product.id)">Adicionar</button></div></div></div>
  </section>
</template>