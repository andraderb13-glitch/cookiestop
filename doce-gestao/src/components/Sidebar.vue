<script setup lang="ts">
import type { Section } from '../types'
import { LayoutDashboard, Package, PlusCircle, ReceiptText, ShoppingCart, ChartNoAxesCombined, CakeSlice } from 'lucide-vue-next'

defineProps<{ current: Section }>()
const emit = defineEmits<{ navigate: [section: Section] }>()
const links: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'products', label: 'Produtos e estoque', icon: Package },
  { id: 'product-form', label: 'Cadastrar produto', icon: PlusCircle },
  { id: 'expenses', label: 'Despesas', icon: ReceiptText },
  { id: 'sales', label: 'Vendas', icon: ShoppingCart },
  { id: 'reports', label: 'Relatórios', icon: ChartNoAxesCombined },
]
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-icon"><CakeSlice :size="23" /></div>
      <div><strong>doce<span>gestão</span></strong><small>PAINEL DA CONFEITARIA</small></div>
    </div>
    <p class="nav-caption">MENU PRINCIPAL</p>
    <nav>
      <button v-for="link in links" :key="link.id" class="nav-link" :class="{ active: current === link.id || (current === 'product-form' && link.id === 'product-form') }" @click="emit('navigate', link.id)">
        <component :is="link.icon" :size="19" :stroke-width="1.8" />
        <span>{{ link.label }}</span>
      </button>
    </nav>
    <div class="sidebar-note">
      <div class="note-icon">♡</div>
      <strong>Feito com carinho</strong>
      <p>Organize sua confeitaria e acompanhe cada conquista.</p>
    </div>
    <div class="sidebar-footer">Doce Gestão <span>•</span> v1.0</div>
  </aside>
</template>