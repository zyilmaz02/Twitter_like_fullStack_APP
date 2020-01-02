
const postCollection = require('../db').db().collection("posts")
const ObjectID = require('mongodb').ObjectID
const User = require('./User')
let Post = function(data,userId, requestedPostId){
this.data = data
this.errors = []
this.userId = userId
this.requestedPostId = requestedPostId
}
Post.prototype.cleanUp = function(){
    if(typeof(this.data.title) != "string"){this.data.title = ""}
    if(typeof(this.data.body) != "string"){this.data.body = ""}

// get rid of any bogus properties
this.data = {
    title: this.data.title.trim(),
    body: this.data.body.trim(),
    createdDate: new Date(),
    author: ObjectID(this.userId)
}

}
Post.prototype.validate= function(){
    if(this.data.title == "") {this.errors.push("you must add a title for the post")}
    
    if(this.data.body == "") {this.errors.push("you must add a body for the post")}
}

Post.prototype.create = function(){
return new Promise((resolve,reject)=>{
    this.cleanUp()
    this.validate()
    if(!this.errors.length){
        // save the post to the database
        postCollection.insertOne(this.data).then((info) => {
           resolve(info.ops[0]._id) 

        }).catch(()=>{
            this.errors.push("please try it later")
            reject(this.errors)
        })
        
    }else{
        reject(this.errors)
    }
})
}

Post.prototype.update = function(){
    return new Promise(async (resolve,reject) => {
        try{
            let post = await Post.findSingleById(this.requestedPostId,this.userId)
            
            if(post.isVisitorOwner){
               let status = await this.actuallyUpdate()
                resolve(status)
            } else{
                reject()
            } 
        }catch{
            reject()
        }
    })
}

Post.prototype.actuallyUpdate = function(){
  return new Promise (async (resolve, reject) => {
      this.cleanUp()
      this.validate()
      if(!this.errors.length){
          await postCollection.findOneAndUpdate({_id: new ObjectID(this.requestedPostId)},{$set: {title: this.data.title, body: this.data.body}})
          resolve("success")
      }else {
          resolve("failure")
      }

  })  
}

Post.findSingleById = function(id, visitorId){
    return new Promise(async function(resolve,reject){
        if(typeof(id) != "string" || !ObjectID.isValid(id)){
            reject()
            return
        }
       let posts = await Post.reusablePostQuery([
           {$match: {_id: new ObjectID(id)}}
       ], visitorId)
        if(posts.length){
            console.log(posts[0])
            resolve(posts[0])
        }else{
            reject()
        }
    })
}

/// doublicate 

Post.reusablePostQuery = function(uniqueOperation,visitorId){
    return new Promise(async function(resolve,reject){
        let aggOperation = uniqueOperation.concat(
            [
           
                {$lookup:{from: "users", localField:"author",foreignField: "_id", as: "authorDocument"}},
                {$project:{
                    title: 1,
                    body:1,
                    createdDate:1,
                    authorId:"$author",
                    author:{$arrayElemAt: ["$authorDocument",0]}
    
                }}
            ]
        )
        let posts = await postCollection.aggregate(aggOperation).toArray()

        // clean up author property in each object
        posts = posts.map(function(post){
            post.isVisitorOwner = post.authorId.equals(visitorId)
            
            post.author = {
                username: post.author.username,
                avatar:new User(post.author, true).avatar
            }
            return post
        })
        resolve(posts)
    })
}






Post.findByAuthorId = function(authorId) {
    return Post.reusablePostQuery([
    {$match:{author:authorId}},
    {$sort: {createdDate:-1}}

    ])
}


module.exports = Post