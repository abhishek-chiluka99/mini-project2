const User = require('../models/auth.model')
const expressJwt = require('express-jwt')
const _ = require('lodash')
const {OAuth2Client} = require('google-auth-library')
const fetch = require('node-fetch')
const {validationResult} = require('express-validator')
const jwt = require('jsonwebtoken')
//Custom error handler to get useful error from database error
const {errorHandler } = require('../helpers/dbErrorHandling')

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.MAIL_KEY)

exports.registerController =(req,res) => {
  const { name, email , password } = req.body
  const  errors = validationResult(req)

  if(!errors.isEmpty())
  {
    const firstError = errors.array().map(error => error.msg)[0]
    return res.status(422).json({
      error: firstError
    })
  }else{
    User.findOne({
      email
    }).exec((err , user)=>{
      if(user){
        return res.status(400).json({
          error: 'Email is taken'
        })
      }
    })
    const token = jwt.sign(
      {
        name,
        email,
        password
      },
      process.env.JWT_ACCOUNT_ACTIVATION,
      {
        expiresIn : '15m'
      }
    )
 
     const emailData = {
       from : process.env.EMAIL_FROM,
       to : `${email}`,
       subject:'Account activation link',
       html:`
       <h1>Please click to ink to activate</h1>
       <p>${process.env.CLIENT_URL}/users/activate/${token}</p>
       <hr/>
       <p>this is email contain sensetive info</p>
       <p>${process.env.CLIENT_URL}</p>`

     }
    sgMail.send(emailData).then(sent=>{
      return res.json({
        message: `Email has been sent to ${email}`
      })
    }).catch(err=> { 
      return res.status(400).json({
        error : errorHandler(err)
      })
    })
  }
}

//Activation and save to database

exports.activationController = (req,res) =>{
  const { token } =  req.body

  if(token){
    jwt.verify(token , process.env.JWT_ACCOUNT_ACTIVATION,
      (err,decoded)=>{
        if(err){
        return res.status(401).json({
          error : 'Expired Token. Signup again'
        });
      }else{
        //if  valid save to database
        //get name and all the things
        const {name, email, password } = jwt.decode(token);
        const user = new User({
          name,
          email,
          password
        });
        user.save((err,user)=>{
          if(err){
            return res.status(401).json({
              error : errorHandler(err)
            })
         
          }   else{
            return res.json({
              success : true,
              message:'Signup success'
            });
          }
        });
      }
      });
  }else{
    return res.json({
      message:'error happening please try again'
    })
  }
}

exports.loginController = (req,res) =>{
  const { email, password} = req.body
  const errors = validationResult(req)

  if(!errors.isEmpty()){
    const firstError = errors.array().map(error => error.msg)[0]
    return res.status(422).json({
      error: firstError
    })
  } else{
    // check if user exits
    User.findOne({
      email
    }).exec((err, user)=> {
      if( err || !user){
        return res.status(400).json({
          error: 'User with that email does not exit, Please Sign up'
        })
      }
      //Authenticate
      if(!user.authenticate(password)) {
        return res.status(400).json({
          error: 'Email and password do not match'
        })
      }
      const token = jwt.sign(
        {
        _id: user._id
      },process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
      )
      const{_id, name, email, role ,score} = user 
      return res.json({
        token,
        user:{
          _id,
          name,
          email,
          role,
          score
        }
      })
    })
  }
}

exports.forgotPasswordController = (req, res) =>{
  const { email } = req.body;
  const errors = validationResult(req)

  if( !errors.isEmpty()){
    const firstError = errors.array().map(error => error.msg)[0]
    return res.status(422).json({
      error: firstError
    })
  } else{

    User.findOne({email}, (err, user) => {
      if( err || !user) {
        return res.status(400).json({
          error: 'User with that email does not exits'
        })
      }
      const token = jwt.sign({
        _id: user._id 
      }, process.env.JWT_RESET_PASSWORD, {
        expiresIn: '10m'
      })
      
      const emailData = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
        subject: 'Password Reset link',
        html: `
        <h1>Please Click to link to reset your password</h1>
        <p>${process.env.CLIENT_URL}/users/password/reset/${token}</p>
        <hr/>
        <p>This is email contain sensetive info </p>
        <p>${process.env.CLIENT_URL}</p> `
      }
      return user.updateOne({
        resetPasswordLink: token
      },(err, success) => {
        if(err){
          return res.status(400).json({
            error: errorHandler(err)
          })
        }else {
          sgMail.send(emailData).then(sent => {
            return res.json({
              message: `Email has been sent to ${email}`
            })
          }).catch(err => {
            return res.json({
              message: err.message
            })
          })
        }
      })
    })
  }
}


exports.resetController = (req, res) => {
  const { resetPasswordLink , newPassword } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array().map(error => error.msg)[0];
    return res.status(422).json({
      error: firstError
    });
  } else {
    if (resetPasswordLink) {
      jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function(
        err,
      ) {
        if (err) {
          return res.status(400).json({
            error: 'Expired link. Try again'
          });
        }
        User.findOne(
          {
            resetPasswordLink
          },
          (err, user) => {
            if (err || !user) {
              return res.status(400).json({
                error: 'Something went wrong. Try later'
              });
            }

            const updatedFields = {
              password: newPassword,
              resetPasswordLink: ""
            };

            user = _.extend(user, updatedFields);

            user.save((err, result) => {
              if (err) {
                return res.status(400).json({
                  error: 'Error reseting user password'
                });
              }
              res.json({
                message: `Great! Now you can login with your new password`
              });
            });
          });
      });
    }
  }
};

exports.updatescore = (req,res) => {
  const {newscore, email} = req.body
  User.findOne(
    {
      email
    },
    (err, user) => {
      if (err || !user) {
        return res.status(400).json({
          error: 'Something went wrong. Try later'
        });
      }

      const updatedFields = {
    
       score: newscore
     
      };

      user = _.extend(user, updatedFields);

      user.save((err, result) => {
        if (err) {
          return res.status(400).json({
            error: 'Error reseting user password'
          });
        }
        res.json({
          message: `Your score updated`
        });
      });
    });
}