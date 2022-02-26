const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

////NOTE--> below route is not obeying the REST Architechture
router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.patch(
  '/updatePassword',
  authController.protect,
  authController.updatePassword
);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect); //because middleware runs in sequence, all below routes are now protected

router.get(
  '/me',
  //authController.protect,
  /*putting user id in params*/ userController.getMe,
  userController.getUser
);
router.patch('/updateMe', /*authController.protect,*/ userController.updateMe);
//we will not actually delete a user from database, but as long as a user no longer accessible anywhere then its still okay to use this delete http method here
router.delete('/deleteMe', /*authController.protect,*/ userController.deleteMe);

router.use(authController.restrictTo('admin')); //now below routes can only be accessed by admin
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(
    /*authController.protect,*/
    /*authController.restrictTo('admin'),*/
    userController.deleteUser
  );

module.exports = router;
