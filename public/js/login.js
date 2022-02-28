/*eslint-disable*/
// console.log('hello login')
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
    console.log(email, password);
    try{
        const res = await axios({
            method: 'POST',
            url: 'http://127.0.0.1:3000/api/v1/users/login',
            data: {
                email,
                password
            }
        });
        if(res.data.status === 'Success') {
            console.log(res.data.status);
            showAlert('success','Logged In Succesfuly');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
        console.log(res);
    } catch(err) {
        showAlert('error', err.response.data.message);
        // console.log(err.response.data);
    }
    
}
// console.log(document.querySelector('.form'));
// const form = document.querySelector('.form');


export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://127.0.0.1:3000/api/v1/users/logout',
        });
        // console.log(res);
        if(res.data.status === 'success'){
            showAlert('success', 'Logged Out')
            location.reload(true);//this will force a reload from server not from browser
        }
    } catch (err) {
        showAlert('error', 'Error logging out! try again.');
    }
}