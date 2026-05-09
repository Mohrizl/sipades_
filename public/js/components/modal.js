const Modal=(()=>{
  const ov=()=>document.getElementById('modal-overlay');
  const show=html=>{
    const o=ov();o.innerHTML=`<div class="modal fade-in">${html}</div>`;o.classList.remove('hidden');
    o.querySelectorAll('.modal-close').forEach(b=>b.addEventListener('click',hide));
    o.addEventListener('click',e=>{if(e.target===o)hide();});
  };
  const hide=()=>{ov().classList.add('hidden');ov().innerHTML='';};
  const confirm=(title,msg,onOk,danger=true)=>{
    show(`<div class="modal-header"><h3 class="modal-title">${title}</h3><button class="modal-close"><i class="fa-solid fa-xmark"></i></button></div>
    <p style="color:var(--text-2);font-size:14px;margin-top:4px;line-height:1.6">${msg}</p>
    <div class="modal-footer"><button class="btn btn-secondary" id="mc">Batal</button><button class="btn ${danger?'btn-danger':'btn-primary'}" id="mo">Konfirmasi</button></div>`);
    document.getElementById('mc').onclick=hide;
    document.getElementById('mo').onclick=()=>{hide();onOk();};
  };
  return{show,hide,confirm};
})();
