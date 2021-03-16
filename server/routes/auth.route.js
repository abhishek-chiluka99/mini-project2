const express = require('express')
const router = express.Router()

//Load controllers
//validation
const {
  validLogin,
  forgotPasswordValidator,
  resetPasswordValidator,
  validSign,
} =  require('../helpers/valid')

const{
    registerController,
    activationController,
    loginController,
    forgotPasswordController,
    resetController,
    updatescore
 } = require('../controllers/auth.controller.js')

router.post('/register',validSign,registerController)
router.post('/login',validLogin,loginController)
router.post('/activation',activationController)
router.post('/password/forget',forgotPasswordValidator,forgotPasswordController)
router.post('/password/reset',resetPasswordValidator, resetController)
router.post('/admin',updatescore)

module.exports = router;