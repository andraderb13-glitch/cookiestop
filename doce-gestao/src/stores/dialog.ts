import { defineStore } from 'pinia'
import { ref } from 'vue'
export const useDialog=defineStore('dialog',()=>{
 const visible=ref(false),message=ref(''),title=ref('Confirmação'),notice=ref('')
 let resolveCurrent:((answer:boolean)=>void)|null=null
 function confirm(text:string){if(resolveCurrent)resolveCurrent(false);message.value=text;title.value='Confirmar ação';visible.value=true;return new Promise<boolean>(resolve=>{resolveCurrent=resolve})}
 function close(answer:boolean){visible.value=false;resolveCurrent?.(answer);resolveCurrent=null}
 function notify(text:string){notice.value=text}
 function clearNotice(){notice.value=''}
 return {visible,message,title,notice,confirm,close,notify,clearNotice}
})
