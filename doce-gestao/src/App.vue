<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Menu, X, CakeSlice } from 'lucide-vue-next'
import Login from './components/Login.vue'
import Admin from './components/Admin.vue'
import { useAuthStore } from './stores/auth'
import { useDialog } from './stores/dialog'
import Sidebar from './components/Sidebar.vue'
import Dashboard from './components/Dashboard.vue'
import Products from './components/Products.vue'
import ProductForm from './components/ProductForm.vue'
import Expenses from './components/Expenses.vue'
import Sales from './components/Sales.vue'
import Reports from './components/Reports.vue'
import type { Product, Section } from './types'
import { useConfectioneryStore } from './stores/confectionery'

const auth=useAuthStore()
const dialog=useDialog()
const restoring=ref(true)
onMounted(async()=>{await auth.restore();restoring.value=false})
const current = ref<Section>('dashboard')
const editingProduct = ref<Product | null>(null)
const mobileMenu = ref(false)
const store = useConfectioneryStore()
watch(()=>auth.user,async user=>{store.reset();if(user?.role==='client'){try{await store.load()}catch(e){dialog.notify(e instanceof Error?e.message:'Erro ao carregar os dados')}}},{immediate:true})
function logout(){auth.logout();current.value='dashboard'}
const pageTitle = computed(() => ({
  dashboard: 'Visão geral',
  products: 'Produtos e estoque',
  'product-form': editingProduct.value ? 'Editar produto' : 'Cadastrar produto',
  expenses: 'Despesas',
  sales: 'Vendas',
  reports: 'Relatórios',
}[current.value]))
function navigate(section: Section) {
  if (section === 'product-form') editingProduct.value = null
  current.value = section
  mobileMenu.value = false
}
function editProduct(product: Product | null) {
  editingProduct.value = product
  current.value = 'product-form'
}
</script>

<template>
  <div v-if="restoring" class="auth-screen"><div class="auth-card">Carregando sessão...</div></div>
  <Login v-else-if="!auth.user" />
  <div v-else class="app-layout">
    <div v-if="mobileMenu" class="mobile-overlay" @click="mobileMenu = false"></div>
    <div class="sidebar-wrap" :class="{ open: mobileMenu }"><Sidebar v-if="auth.user.role==='client'" :current="current" @navigate="navigate" /><aside v-else class="sidebar"><div class="brand"><div class="brand-icon">♡</div><div><strong>doce<span>gestão</span></strong><small>ADMINISTRAÇÃO</small></div></div><p class="nav-caption">PAINEL ADMINISTRATIVO</p><nav><button class="nav-link active">Estabelecimentos</button></nav></aside></div>
    <main class="main-area">
      <header class="topbar">
        <button class="mobile-menu-btn" aria-label="Abrir menu" @click="mobileMenu = !mobileMenu"><X v-if="mobileMenu" /><Menu v-else /></button>
        <div class="breadcrumb"><span>Doce Gestão</span><span class="crumb-divider">/</span><strong>{{ auth.user.role==='admin'?'Administração':pageTitle }}</strong></div>
        <div class="topbar-right"><span class="today-label">{{auth.user.establishmentName || auth.user.name}}</span><button class="secondary-btn" @click="logout">Sair</button><div class="topbar-avatar"><CakeSlice :size="18" /></div></div>
      </header>
      <div class="content-area">
        <Admin v-if="auth.user.role==='admin'" /><template v-else><div v-if="store.syncError" class="auth-error">{{store.syncError}} Atualize a página antes de continuar.</div><Dashboard v-if="current === 'dashboard'" />
        <Products v-else-if="current === 'products'" @edit="editProduct" />
        <ProductForm v-else-if="current === 'product-form'" :product="editingProduct" @back="current = 'products'" />
        <Expenses v-else-if="current === 'expenses'" />
        <Sales v-else-if="current === 'sales'" />
        <Reports v-else-if="current === 'reports'" /></template>
        <footer class="app-footer"><span>♡</span> Doce Gestão — mais organização para adoçar seus resultados.</footer>
      </div>
    </main>
  </div>
  <div v-if="dialog.visible" class="dg-modal-overlay" @click.self="dialog.close(false)"><div class="dg-modal" role="dialog" aria-modal="true"><h2>{{dialog.title}}</h2><p>{{dialog.message}}</p><div class="form-actions"><button class="secondary-btn" @click="dialog.close(false)">Cancelar</button><button class="primary-btn" @click="dialog.close(true)">Confirmar</button></div></div></div>
  <div v-if="dialog.notice" class="dg-toast" role="status"><span>{{dialog.notice}}</span><button @click="dialog.clearNotice()">✕</button></div>
</template>