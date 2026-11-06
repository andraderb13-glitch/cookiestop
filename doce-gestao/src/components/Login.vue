<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
const auth=useAuthStore()
const email=ref(''),password=ref(''),error=ref('')
async function submit(){error.value='';try{await auth.login(email.value,password.value)}catch(e){error.value=e instanceof Error?e.message:'Falha no login'}}
</script>
<template><div class="auth-screen"><form class="auth-card" @submit.prevent="submit"><div class="auth-logo">♡ doce<span>gestão</span></div><p class="eyebrow">BEM-VINDO DE VOLTA</p><h1>Acesse seu painel</h1><p class="muted">Gerencie seu estabelecimento com segurança.</p><label class="field">E-mail<input v-model="email" type="email" autocomplete="username" required placeholder="seu@email.com" /></label><label class="field">Senha<input v-model="password" type="password" autocomplete="current-password" required placeholder="Sua senha" /></label><p v-if="error" class="auth-error">{{error}}</p><button class="primary-btn auth-submit" :disabled="auth.loading">{{auth.loading?'Entrando...':'Entrar no Doce Gestão'}}</button><small class="muted">Acesso individual e protegido para cada estabelecimento.</small></form></div></template>
