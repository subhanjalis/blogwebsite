//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const multer = require('multer');
var GphApiClient = require('giphy-js-sdk-core');
client = GphApiClient("whBBdauufJ4Enp6BBxa2Wc0VUVQdUyek");
let file_name,file_name2,file_name3;
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './public/upload/');
  },
  filename: function(req, file, cb) {
var c=[],a,b,d,str=file.originalname;
a=str.substring(str.indexOf("."),str.length+1);

    file_name=new Date().toISOString() + req.user._id + a;
  cb(null, file_name);

// if( file_name2==undefined && file_name3==undefined && file_name!=undefined)
// file_name3=file_name;
// if( file_name3!=undefined && file_name2==undefined && file_name!=undefined)
// file_name2=file_name;
    // console.log("====" + file_name + " here in multer storage");

    // if(file_name!=file_name2 && file_name2===file_name3)
    // file_name2=file_name;

  }
});
const upload = multer({storage: storage});

var fs = require('fs');
const cors = require('cors');
var path = require('path');



const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-subhanjali:somya@15@blog.rhp08.mongodb.net/userDB", {useNewUrlParser: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  username: { type: String, sparse: true },
  password: String,
  googleId: String,
  displayname: String,
  about: String,
  secret: [{title: String, content: String,blogImg:  String, blogImg2:  String, blogImg3:  String , tags: [String], favourites: [String]}],
  profilepic: String,
  favourited: [String],
  followers: [String],
  following: [String]
 //  ,
 //  //img
 // img: String
 //    //img

});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log("google profile accessed succesfully \n");

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req, res){
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/me", function(req, res){
  if (req.isAuthenticated()){
    User.findById(req.user.id, function(err, foundUser){
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {

          res.render("me", {usersWithSecrets: foundUser, theuser: req.user.id});

        }
      }
    });
  } else {
    res.redirect("/login");
  }


});

//imgtest
//imgtest

app.get("/secrets", function(req, res){
  if (req.isAuthenticated()){
  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        // console.log(req.user.following.includes(JSON.stringify(foundUsers[0]._id)) + " this ");
        var them = [];
        for(var i =0 ;i<req.user.following.length;i++){
          for(var j=0;j<foundUsers.length;j++){
          if(JSON.stringify(req.user.following[i])===JSON.stringify(foundUsers[j]._id))
          them.push(foundUsers[j]);
        }
      }
        res.render("secrets", {usersWithSecrets: them, theuser: req.user});

      }
    }
  });
}   else {
    res.redirect("/login");
  }

});
//img



app.get("/submit", function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/lookfor", function(req, res){
  const requestedPostId = req.body.lookfor;

      // User.find({ "secret.title": requestedPostId}, function(err, posts){
      //
      //   res.render("post", {
      //   posts: posts,
      //   searched:requestedPostId
      //   });
      // });

      User.find(
    { $and: [ { $or:[{ "secret.title": { "$regex": requestedPostId, "$options": "i" }}, {"secret.tags": requestedPostId} ]}]},
    function(err, posts) {
      // console.log(posts+ "ca$$");
      res.render("post", {
      posts: posts,
      searched:requestedPostId
      });
    }
);
});

app.get("/myprofile", function(req, res){

  if (req.isAuthenticated()){
    User.findById(req.user.id, function(err, foundUser){
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {

          res.render("myprofile", {usersWithSecrets: foundUser});

        }
      }
    });
  } else {
    res.redirect("/login");
  }


});

app.post("/submit",upload.array('blogImg',3), function(req, res){
  const submittedTitle = req.body.stitle;
  const submittedContent = req.body.scontent;
  const submittedTags = req.body.stags;
  var tags = submittedTags.split(" ");
  var submittedImg,submittedImg2,submittedImg3;


    if(req.files[0]!=undefined){
    submittedImg = req.files[0].filename;}
    if(req.files[1]!=undefined){
    submittedImg2 = req.files[1].filename;}
    if(req.files[2]!=undefined){
    submittedImg3 = req.files[2].filename;}
// console.log("====" + submittedImg+ " here in submit");
//Once the user is authenticated and their session gets saved, their user details are saved to req.user.
  // console.log(req.user.id);
//   client.search('gifs', {"q": "cats"})
//   .then((response) => {
//     response.data.forEach((gifObject) => {
//       console.log(gifObject);
//     });
//   })
//   .catch((err) => {
//
//   });
//
// /// Sticker Search
// client.search('stickers', {"q": "cats"})
//   .then((response) => {
//
//   })
//   .catch((err) => {
//
//   });

  User.findById(req.user.id, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {

        var friend = { title: submittedTitle, content: submittedContent, blogImg: submittedImg, blogImg2: submittedImg2, blogImg3: submittedImg3, tags: tags};
        // console.log(friend);
        if(foundUser.secret.length===0)
        {foundUser.following.push(req.user.id);
        foundUser.profilepic="nopic.png";
        foundUser.about="Hi reader!";}

        foundUser.secret.push(friend);

        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.post("/me", function(req, res){


User.findById(req.body.theuser, function(err, foundUser){
  if (err) {
    console.log(err);
  } else {
    if (foundUser) {

          foundUser.secret.pull({ _id: req.body.theid });

      foundUser.save(function(){
        res.redirect("/me");
      });
    }
  }
});

});

app.post("/myprofile",upload.single('profilepic'), function(req, res){
  const displayname = req.body.displayname;
  const about = req.body.about;
  var profilepic ;

  if(req.file !=undefined)
  profilepic = req.file.filename;

  User.findById(req.user.id, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.displayname=displayname;
        foundUser.about=about;
        if(profilepic===undefined);
        else foundUser.profilepic=profilepic;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});


app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.get("/contact", function(req, res){
  res.render("about");
});

app.post("/register", function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});

app.post("/favourited", function(req, res){
  if (req.isAuthenticated()){
  User.findById(req.user.id, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.favourited.push(req.body.theid);
        foundUser.save(function(){
        });
      }
    }
  });

  // User.find({'secret._id': req.body.theid},  function(err, foundUser){
  //   for(var i =0; i< 5;i++){
  //     console.log(i + " == yo nos");
  //   }
  //   console.log( foundUser.lean().favourited +".secret");
  //   // foundUser.secret.push({ favourites: req.user.theuser});
  // });
  User.findById(req.body.theuser, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {

            // foundUser.secret.push({ _id: req.body.theid });
// foundUser.findById(req.body.theid, function(err, foundUserf){
//   console.log(foundUserf + " =foundUserf");
// });
for(var i =0; i< foundUser.secret.length;i++){
  var hereid=JSON.stringify(foundUser.secret[i]._id);
  if(hereid===JSON.stringify(req.body.theid))
  foundUser.secret[i].favourites.push(req.body.theid);
    // console.log(foundUser.secret[0].favourites + " == yo nos");
  }

        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });

} else {
  res.redirect("/login");
}

});

app.post("/unfavourited", function(req, res){
  if (req.isAuthenticated()){
  User.findById(req.user.id, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.favourited.pull({ _id: req.body.theid });
        foundUser.save(function(){
        });
      }
    }
  });

  User.findById(req.body.theuser, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {

            // foundUser.secret.push({ _id: req.body.theid });
// foundUser.findById(req.body.theid, function(err, foundUserf){
//   console.log(foundUserf + " =foundUserf");
// });
for(var i =0; i< foundUser.secret.length;i++){
  var hereid=JSON.stringify(foundUser.secret[i]._id);
  if(hereid===JSON.stringify(req.body.theid))
    foundUser.secret[i].favourites.pull({ _id: req.body.theid });
    // console.log(foundUser.secret[0].favourites + " == yo nos");
  }

        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });

} else {
  res.redirect("/login");
}

});

app.post("/me", function(req, res){


User.findById(req.body.theuser, function(err, foundUser){
  if (err) {
    console.log(err);
  } else {
    if (foundUser) {

          foundUser.secret.pull({ _id: req.body.theid });

      foundUser.save(function(){
        res.redirect("/me");
      });
    }
  }
});

});






app.get("/eachpost/:postId", function(req, res){

const requestedPostId = req.params.postId;
// console.log(req.params);

  User.findOne({ "secret._id": requestedPostId}, function(err, posts){
    if (err) {
      console.log(err);
    res.render("eachpost");}else{
    res.render("eachpost", { posts:posts, theid:requestedPostId});}
  });




    // Post.findOne({title: requestedPostId}, function(err, post){
    //   console.log(post);
    //   res.render("post", {
    //     title: post.title,
    //     content: post.content
    //   });
    // });

    // Post.find({title: requestedPostId}, function(err, posts){
    //
    //   res.render("post", {
    //   posts: posts
    //   });
    // });

});

app.get("/eachuser/:userId", function(req, res){

const requesteduserId = req.params.userId;
// console.log(req.params);
User.findById(requesteduserId, function(err, foundUser){
  if (err) {
    console.log(err);
  } else {
    if (foundUser) {
      foundUser.save(function(){
          res.render("eachuser", { theuser: foundUser, following: req.user.following});});
      }
  }
});





    // Post.findOne({title: requestedPostId}, function(err, post){
    //   console.log(post);
    //   res.render("post", {
    //     title: post.title,
    //     content: post.content
    //   });
    // });

    // Post.find({title: requestedPostId}, function(err, posts){
    //
    //   res.render("post", {
    //   posts: posts
    //   });
    // });

});

app.post("/eachuser", function(req, res){
  User.findById(req.user.id, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.following.push(req.body.userid);
        foundUser.save(function(){
        });
      }
    }
  });

  User.findById(req.body.userid, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {

    foundUser.followers.push(req.user.id);

        foundUser.save(function(){
          var red = "/eachuser/" + req.body.userid;
          res.redirect(red);
        });
      }
    }
  });


});
app.post("/unfollow", function(req, res){
  User.findById(req.user.id, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.following.pull({ _id: req.body.userid});
        foundUser.save(function(){
        });
      }
    }
  });

  User.findById(req.body.userid, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {

    foundUser.followers.pull({ _id: req.user.id });

        foundUser.save(function(){
          var red = "/eachuser/" + req.body.userid;
          res.redirect(red);
        });
      }
    }
  });


});






app.listen('3000' || process.env.PORT, function() {
  console.log("Server started on port 3000.");
});
