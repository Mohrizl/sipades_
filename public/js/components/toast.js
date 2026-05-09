const Toast=(()=>{
  const ic={success:'fa-circle-check',error:'fa-circle-xmark',warning:'fa-triangle-exclamation',info:'fa-circle-info'};
  const show=(msg,type='info',dur=3500)=>{
    const el=document.createElement('div');
    el.className=`toast toast-${type}`;
    el.innerHTML=`<i class="fa-solid ${ic[type]}"></i><span class="toast-text">${msg}</span><i class="fa-solid fa-xmark toast-close"></i>`;
    el.querySelector('.toast-close').onclick=()=>dismiss(el);
    document.getElementById('toast-container').appendChild(el);
    setTimeout(()=>dismiss(el),dur);
  };
  const dismiss=el=>{el.classList.add('fade-out');setTimeout(()=>el.remove(),300);};
  return{success:(m,d)=>show(m,'success',d),error:(m,d)=>show(m,'error',d),warning:(m,d)=>show(m,'warning',d),info:(m,d)=>show(m,'info',d)};
})();
