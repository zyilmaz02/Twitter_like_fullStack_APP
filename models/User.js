
const bcrypt = require("bcryptjs")

const userCollection = require('../db').db().collection("users")
const validator = require("validator")

const md5 = require("md5")

let User = function(data,getAvatar){
    this.data = data
    this.errors = []
    if(getAvatar == undefined){getAvatar = false}
    if(getAvatar){this.getAvatar}
}

User.prototype.cleanUp = function(){
    if(typeof(this.data.username ) != "string") {this.data.username = ""}
    if(typeof(this.data.email ) != "string") {this.data.email = ""}
    if(typeof(this.data.password ) != "string") {this.data.password = ""}

    // get rid of any bogus properties
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}
User.prototype.validate = function(){
    return new Promise(async (resolve,reject) => {
        if(this.data.username == ""){
            this.errors.push("you must provide username")
        }
        if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)){ this.errors.push("your username should be alphanumeric")}
        if(!validator.isEmail(this.data.email)){
            this.errors.push("you must provide valid email")
        }
        if(this.data.password == ""){
            this.errors.push("you must provide valid password")
        }
        if(this.data.password.length > 0 && this.data.password.length < 8){ this.errors.push("password must be more than 12 character")}
        if(this.data.password.length > 50){this.errors.push("passcode can not be more than 50 character!!")}
        if(this.data.username.length > 0 && this.data.username.length < 4){ this.errors.push("username must be more than 12 character")}
      // only if username is valid then check to see if it is already taken 
      if(this.data.username.length> 2 && this.data.username.length<31 && validator.isAlphanumeric(this.data.username)){
          let usernameExists = await userCollection.findOne({username:this.data.username})
          if(usernameExists){
              this.errors.push("this username is already taken.!!")
          }
      }
      // only if email valid. check if the email exist
      if(this.data.email.length> 2 && this.data.email.length<31 && validator.isAlphanumeric(this.data.email)){
        let usernameExists = await userCollection.findOne({username:this.data.email})
        if(usernameExists){
            this.errors.push("this email is already taken.!!")
        }
    }
    resolve()
    })
}

User.prototype.login = function(){
    return new Promise((resolve,reject) => {
        this.cleanUp()
    userCollection.findOne({username: this.data.username}).then((attemptedUser) => {
        if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)){
            this.data=attemptedUser
            this.getAvatar()
            resolve("congrats")

        }else{
            reject("invalid")
        }
    }).catch(function(){
        reject("try it again")
    })

    })
}

User.prototype.register = function(){
    return new Promise(async (resolve,reject) => {
        this.cleanUp()
        await this.validate()
        if(!this.errors.length){
            // hash user password
            let salt = bcrypt.genSaltSync(10)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
           await userCollection.insertOne(this.data)
           this.getAvatar()
           resolve()
        }else{
            reject(this.errors)
        }
    })
}
User.prototype.getAvatar = function(){
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.findByUsername = function(username){
    return new Promise(function(resolve,reject){
        if(typeof(username) != "string"){
            reject()
            return
        }
        userCollection.findOne({username: username}).then(function(userDoc){
            if(userDoc){
                userDoc = new User(userDoc,true)
                userDoc = {
                    _id: userDoc.data._id,
                    username:userDoc.data.username,
                    avatar:userDoc.avatar
                }
                resolve(userDoc)
            }else{
                reject()
            }
        }).catch(function(){
            reject()
        })
    })
}


module.exports = User