const Auth=(()=>{
  const save=(t,u)=>{localStorage.setItem('token',t);localStorage.setItem('user',JSON.stringify(u));};
  const clear=()=>{localStorage.removeItem('token');localStorage.removeItem('user');};
  const get=()=>{try{return JSON.parse(localStorage.getItem('user'));}catch{return null;}};
  return{save,clear,get,isLoggedIn:()=>!!localStorage.getItem('token'),role:()=>get()?.role||''};
})();
