/* eslint-disable */
import axios from 'axios';
import { showAlert }from './alerts';


export const nameEmailUpdationHandler = async (data) => {
    console.log(name, email);
    try{
        const res = await axios({
            method: 'PATCH',
            url: 'http://127.0.0.1:3000/api/v1/users/updateMe',
            data
        });
        console.log(res.data.status, 'in user updation')
        if(res.data.status === 'success') {
            console.log(res.data.status);
            showAlert('success','Credentials updated Successfully!');
            window.setTimeout(() => {
                location.assign('/me');
            }, 1500);
        }
        // console.log(res);
    } catch(err) {
        // console.log('dkfbdjfd', err.response.data);
        showAlert('error', err.response.data.message);
        // console.log(err.response.data);
    }
    
}

export const passwordUpdationHandler = async (prevPassword, newPassword, newPasswordConfirm) => {
    try{
        const res = await axios({
            method: 'PATCH',
            url: 'http://127.0.0.1:3000/api/v1/users/updatePassword',
            data: {
                prevPassword,
                newPassword,
                newPasswordConfirm
            }
        });
        console.log(res.data.status, 'in user updation')
        if(res.data.status === 'Success') {
            console.log(res.data.status);
            showAlert('success','Password updated Succesfuly!');
            window.setTimeout(() => {
                location.assign('/me');
            }, 1500);
        }
        // console.log(res);
    } catch(err) {
        // console.log('dkfbdjfd', err.response.data);
        showAlert('error', err.response.data.message);
        // console.log(err.response.data);
    }
}