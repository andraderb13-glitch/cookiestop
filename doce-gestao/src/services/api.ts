const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
export type User = { id:number; name:string; email:string; role:'admin'|'client'; establishmentId:number|null; establishmentName:string|null }
let token = sessionStorage.getItem('dg-token') || ''
export function setToken(value:string) { token=value; if(value) sessionStorage.setItem('dg-token',value); else sessionStorage.removeItem('dg-token') }
export function hasToken() { return Boolean(token) }
export async function api<T>(path:string, options:RequestInit = {}):Promise<T> {
 let response:Response
 try { response=await fetch(BASE+path,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{ }),...options.headers}}) }
 catch { throw new Error('Não foi possível conectar à API. Verifique se o backend está ligado.') }
 const data = await response.json().catch(()=>({}))
 if (!response.ok) throw new Error(data.error || `Erro ${response.status}`)
 return data as T
}
