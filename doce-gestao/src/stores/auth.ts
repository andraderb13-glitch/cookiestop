import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, hasToken, setToken, type User } from '../services/api'
export const useAuthStore=defineStore('auth',()=>{
 const user=ref<User|null>(null)
 const loading=ref(false)
 async function login(email:string,password:string){loading.value=true;try{const result=await api<{token:string;user:User}>('/auth/login',{method:'POST',body:JSON.stringify({email,password})});setToken(result.token);user.value=result.user}catch(e){setToken('');throw e}finally{loading.value=false}}
 async function restore(){if(!hasToken())return;try{const result=await api<{user:User}>('/auth/me');user.value=result.user}catch{logout()}}
 function logout(){setToken('');user.value=null}
 return {user,loading,login,restore,logout}
})
