/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async tourId => {

    try {
        const stripe = Stripe('pk_test_51KYo8uSJYexT5jtOLmbWQWIQCXJYDAdQecnazCVJxzQ7r1NhK3y1bnD59voxOmPgTuuj2qRQgW4DV8oJWaTJ7Un400GipNFH12');
        // 1)Get the session form the endpoint of Api
        //below we will just pass the url and automaticaly get request will be made
        const session = await axios(`http://127.0.0.1:3000/api/v1/bookings//checkout-session/${tourId}`);
    
        console.log(session);
        // 2)Create checkput form + charge the credit card -- > this will be done by Stripe Object
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })
    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }

}