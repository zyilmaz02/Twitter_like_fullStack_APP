const express = require('express')

const session = require('express-session')
const router = require('./router')
const flash = require('connect-flash')
const MongoStore = require('connect-mongo')(session)
const app = express()

let sessionOptions = session({
    secret: "javascript is cool",
    store: new MongoStore({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge:1000*60*60*24, httpOnly: true}
})
app.use(sessionOptions)
app.use(flash())

app.use(function(req,res,next){
    // make all error and success flash available
    res.locals.errors=req.flash("errors")
    res.locals.success = req.flash("success")

    if(req.session.user){ req.visitorId = req.session.user._id} else{req.visitorId = 0}
    //  make user session data available 
    res.locals.user = req.session.user
    next()
})
console.log(router)
app.set('views','views')
app.set('view engine', 'ejs')

app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use(express.static('public'))

app.use('/',router)


module.exports = app