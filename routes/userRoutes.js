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

router.patch('/updateMe', authController.protect, userController.updateMe);
//we will not actually delete a user from database, but as long as a user no longer accessible anywhere then its still okay to use this delete http method here
router.delete('/deleteMe', authController.protect, userController.deleteMe);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
