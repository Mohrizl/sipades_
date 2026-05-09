const API=(()=>{
  const B='/api',tok=()=>localStorage.getItem('token');
  const h=(auth=true)=>{const x={'Content-Type':'application/json'};if(auth&&tok())x['Authorization']=`Bearer ${tok()}`;return x;};
  const j=r=>r.json();
  return{
    get:u=>fetch(B+u,{headers:h()}).then(j),
    post:(u,b,a=true)=>fetch(B+u,{method:'POST',headers:h(a),body:JSON.stringify(b)}).then(j),
    put:(u,b)=>fetch(B+u,{method:'PUT',headers:h(),body:JSON.stringify(b)}).then(j),
    patch:(u,b)=>fetch(B+u,{method:'PATCH',headers:h(),body:JSON.stringify(b)}).then(j),
    form:(u,fd)=>fetch(B+u,{method:'POST',headers:{Authorization:`Bearer ${tok()}`},body:fd}).then(j),
    del: (u,b)=>fetch(B+u,{method:'DELETE',headers:h(),body:JSON.stringify(b)}).then(j),
  };
})();
