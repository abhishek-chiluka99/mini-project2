const mongoose = require('mongoose')
const crypto = require('crypto')


//User schema

const userSchema = new mongoose.Schema({
    email:{
        type : String,
        trim : true,
        required : true,
        unique:true,
        lowercase : true
    },
    name:{
        type : String,
        trim : true,
        required: true
    },
    score : {
         type: String,
         default: '0'
    },
    hashed_password:{
         type: String,
         required: true
    },
    salt:String,
    role:{
        type: String,
        default: 'admin'
    },
    resetpasswordLink:{
        data: String,
        default: ''
    }
},{
    timestamps :true
})

userSchema.virtual('password')
         .set(function(password){
             this._password = password;
             this.salt = this.makeSalt();
             this.hashed_password = this.encryptPassword(password);
         })
         .get(function(){
             return this._password
         })

 //methods
 userSchema.methods = {
     //Generic Salt
     authenticate : function(plainText){
         return this.encryptPassword(plainText) === this.hashed_password;
     },
     encryptPassword : function(password){
         if(!password) return '';
         try{
             return crypto
             .createHmac('sha1', this.salt)
             .update(password)
             .digest('hex');
         }catch (err){
             return '';         
            }
     },
     makeSalt: function(plainText){
         return Math.round(new Date().valueOf() * 100 * Math.random()) + '';
     },

     //Encrypt Password
    
   
 }        

 module.exports = mongoose.model('User',userSchema);