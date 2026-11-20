export class ApiError extends Error { constructor(public status:number,message:string){super(message);} }
export async function api<T=any>(path:string, options:RequestInit={}):Promise<T>{
 const res=await fetch(path,{...options,credentials:'include',headers:{'Content-Type':'application/json',...(options.headers||{})}});
 if(!res.ok){let message=`Erro ${res.status}`;try{const body=await res.json();message=body.message||message;}catch{}throw new ApiError(res.status,Array.isArray(message)?message.join(', '):String(message));}
 if(res.status===204)return undefined as T;return res.json();
}
export const get=<T=any>(p:string)=>api<T>(p);
export const post=<T=any>(p:string,b:any)=>api<T>(p,{method:'POST',body:JSON.stringify(b)});
export const patch=<T=any>(p:string,b:any)=>api<T>(p,{method:'PATCH',body:JSON.stringify(b)});

export const del=<T=any>(p:string)=>api<T>(p,{method:'DELETE'});
