/*eslint-disable*/
import '@babel/polyfill';//to enable features of js in all browsers
import { login } from './login'
import { logout } from './login'
import { nameEmailUpdationHandler } from './updateSettings'
import { passwordUpdationHandler } from './updateSettings'
import { bookTour } from './stripe'
 
const form = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userGeneralUpdationForm = document.querySelector('.form-user-data');
const userPasswordUpdationForm = document.querySelector('.form-user-settings');
const bookBtn = document.getElementById('book-tour');

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

if(userGeneralUpdationForm) {
    userGeneralUpdationForm.addEventListener('submit', e => {
        e.preventDefault();
        //Now we need to proramattically create "multipart/form-data"
        const form = new FormData();
        //now in this form we need to keep appending new data
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);

        console.log(form);

        // console.log('User updation Handler');
        nameEmailUpdationHandler(form);
    });
}

if(userPasswordUpdationForm) {
    userPasswordUpdationForm.addEventListener('submit', async e =>{
        e.preventDefault();

        document.querySelector('.btn--save-password').textContent = 'Updating...';

        console.log('User updaiton password form');
        const currentPassword = document.getElementById('password-current').value;
        const newPassword = document.getElementById('password').value;
        const confirmNewPassword = document.getElementById('password-confirm').value;
        await passwordUpdationHandler(currentPassword, newPassword, confirmNewPassword);
        
        document.querySelector('.btn--save-password').textContent = 'Save password';
        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';

    })
}

if (bookBtn) {
    bookBtn.addEventListener('click', async e => {
        e.preventDefault();
        e.target.textContent = 'Processing...';
        const tourId = e.target.dataset.tourId;

        await bookTour(tourId);

        e.target.textContent = 'Booked!!';

    })
}