const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

/*
//special route for accessing the template
router.get('/', (req, res) => {
  //below will render the template with the name we pass In(No need to specify extension, express will automatically find it)
  res.status(200).render(
    'base',
    {//To pass data in this template
      tour: 'The Forest Hiker', //these variables that we pass in here are called locals in the pug file
      user: 'Piyush',
      title: 'Natours | Exciting tours for adventurous people'
    }
  );
}); //"get" we use for rendering pages in the browser
*/

//we want this middleware to apply before every simgle request for our template
router.use(authController.isLoggedIn);

router.get('/', viewsController.getOverview);

router.get('/tour/:slug', viewsController.getTour);
// router.get('/tour', viewsController.getTour);

//login route
router.get('/login', viewsController.getloginForm);

module.exports = router;
