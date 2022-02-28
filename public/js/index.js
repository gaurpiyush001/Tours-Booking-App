/*eslint-disable*/
import '@babel/polyfill';//to enable features of js in all browsers
import { login } from './login'
import { logout } from './login'
 
const form = document.querySelector('.form');
const logOutBtn = document.querySelector('.nav__el--logout');
if(form){
    form.addEventListener('submit', e => {
        e.preventDefault();
        console.log('login form submitted');
        // console.log(email);
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });
}

if(logOutBtn) logOutBtn.addEventListener('click', logout);
