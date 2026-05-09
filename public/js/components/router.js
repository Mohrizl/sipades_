const Router=(()=>{
  const routes={};let cur=null;
  return{
    register:(n,fn)=>{routes[n]=fn;},
    go:(n,p={})=>{cur=n;const app=document.getElementById('app');app.innerHTML='';if(routes[n])routes[n](app,p);},
    cur:()=>cur
  };
})();
const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>[...c.querySelectorAll(s)];
const fmtDate=s=>s?new Date(s).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}):'-';
const fmtDT=s=>s?new Date(s).toLocaleString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'-';
const badge=s=>{const m={pending:'Menunggu',diproses:'Diproses',disetujui:'Disetujui',ditolak:'Ditolak',selesai:'Selesai'};return `<span class="badge badge-${s}">${m[s]||s}</span>`;};
const initials=n=>n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
const debounce=(fn,ms=400)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);};};
