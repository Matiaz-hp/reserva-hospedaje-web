import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const userName = document.getElementById('user-name');
const adminBtn = document.getElementById('admin-btn');
const googleLogin = document.getElementById('google-login');
const googleRegister = document.getElementById('google-register');


const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Mostrar modales
loginBtn?.addEventListener('click',()=>{document.getElementById('login-modal').style.display='block';});
registerBtn?.addEventListener('click',()=>{document.getElementById('register-modal').style.display='block';});

// Registro
registerForm?.addEventListener('submit', async e=>{
  e.preventDefault();
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  try{
    const userCredential = await createUserWithEmailAndPassword(auth,email,password);
    await updateProfile(userCredential.user,{displayName:name});
    await setDoc(doc(db,'users',userCredential.user.uid),{name,email,uid:userCredential.user.uid});
    await sendEmailVerification(userCredential.user);
    alert("Registrado! Revisa tu correo para verificar la cuenta.");
    document.getElementById('register-modal').style.display='none';
    registerForm.reset();
  }catch(err){alert(err.message);}
});

// Login
loginForm?.addEventListener('submit', async e=>{
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try{
    const userCredential = await signInWithEmailAndPassword(auth,email,password);
    if(!userCredential.user.emailVerified){alert("Verifica tu correo antes de iniciar sesión."); return;}
    loginForm.reset();
    document.getElementById('login-modal').style.display='none';
  }catch(err){alert(err.message);}
});

// Google Login/Register
googleLogin?.addEventListener('click', async ()=>{
  const provider = new GoogleAuthProvider();
  try{
    const result = await signInWithPopup(auth,provider);
    const user = result.user;
    await setDoc(doc(db,'users',user.uid),{name:user.displayName,email:user.email,uid:user.uid},{merge:true});
    document.getElementById('login-modal').style.display='none';
  }catch(err){alert(err.message);}
});

googleRegister?.addEventListener('click', async ()=>{
  const provider = new GoogleAuthProvider();
  try{
    const result = await signInWithPopup(auth,provider);
    const user = result.user;
    await setDoc(doc(db,'users',user.uid),{name:user.displayName,email:user.email,uid:user.uid},{merge:true});
    document.getElementById('register-modal').style.display='none';
  }catch(err){alert(err.message);}
});

// Logout
logoutBtn?.addEventListener('click', async ()=>{await signOut(auth);});

// Estado del usuario
onAuthStateChanged(auth, user => {
  if (user) {
    userName.textContent = user.displayName || user.email;

    logoutBtn.style.display = 'inline-block';
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'none';

    // 👇 OCULTAR ADMIN PARA USUARIOS LOGUEADOS NORMALES
    adminBtn.style.display = 'none';

  } else {
    userName.textContent = '';

    logoutBtn.style.display = 'none';
    loginBtn.style.display = 'inline-block';
    registerBtn.style.display = 'inline-block';

    // 👇 ADMIN VISIBLE SOLO CUANDO NO HAY SESIÓN
    adminBtn.style.display = 'inline-block';
  }
});

