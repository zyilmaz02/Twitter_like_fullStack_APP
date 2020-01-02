const Post = require('../models/Post')


exports.viewCreateScreen = function(req,res){
    res.render('create-post')
}

exports.create = function(req,res){
    let post = new Post(req.body,req.session.user._id)
    post.create().then(function(newId){
        req.flash("success", "New Post Created")
        req.session.save(()=>res.redirect(`/post/${newId}`))
    }).catch(function(errors){
        errors.forEach((error) => req.flash("errors",error))
        req.session.save(()=> res.redirect("/create-post"))
    })
}
exports.viewSingle = async function(req,res) {
    try{
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        res.render('single-post-screen', {post: post})
    } catch {

        res.render('404')
    }
}

exports.viewEditScreen = async function(req,res){
   try{
    let post = await Post.findSingleById(req.params.id)
    if(post.authorId == req.visitorId){
        res.render("edit-post",{post: post})
    }else{
        req.flash("errors","you do Not have permissson to perform this action")
        req.session.save(()=>req.redirect("/")

        )}
   }catch{
       res.render('404')
   }
}
exports.edit = function(req,res){
    let post = new Post(req.body, req.visitorId,req.params.id)
    post.update().then((status)=>{
        // if the post successfully updated in the database
        // or user have permission to make change but left the title or body of post blink
        if(status == "success"){
            // post updated in db
            req.flash("success","post Successfully updated")
            req.session.save(function(){
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }else {
            post.errors.forEach(function(error){
                req.flash("errors",error)
            })

            req.session.save(function(){
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }

    }).catch(()=>{
        // if post with the requested id does not match 
        // or if the current user is not the owner of the post 
        req.flash("errors","you do NOT have permission for this action")
        req.session.save(function() {
            res.redirect("/")
        })

    })
}