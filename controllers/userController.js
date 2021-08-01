const passport = require("passport");
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const User = require("../models/User");
const { sendEmail } = require("../utils/mailer");

exports.register = (req, res) => {
  res.render("register", {
    pageTitle: "Register",
    path: "/register",
  });
};

exports.registerHandler = async (req, res, next) => {
  const errors = [];
  try {
    await User.userValidation(req.body);

    const { fullname, email, password } = req.body;

    const user = await User.findOne({ email: email });

    if (user) {
      errors.push({ message: "User is already exist" });
      return res.render("register", {
        pageTitle: "Register",
        path: "/register",
        errors
      });
    }

    await User.create({ fullname, email, password });

    sendEmail(email, fullname, "Welcome", "We happy you join to out site")

    req.flash("success_msg", "User Registered Successfully");
    res.redirect("/user/login");
  } catch (err) {
    console.log(err);

    err.inner.forEach((e) => {
      errors.push({
        name: e.path,
        message: e.message,
      });
    });

    return res.render("register", {
      pageTitle: "Register",
      path: "/register",
      errors
    });
  }
};

exports.login = (req, res) => {

  res.set("Cache-Control","no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0")

  res.render("login", {
    pageTitle: "Login",
    path: "/Login",
    message: req.flash("success_msg"),
    error: req.flash("error"),
  });
};

exports.loginHandler = async (req, res, next) => {

  if(!req.body['g-recaptcha-response']) {
    req.flash('error', 'Google captcha is require')
    res.redirect('/user/login')
  }

  const captchaKey = process.env.RECAPTCHE_KEY
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${captchaKey}
  &response=${req.body["g-recaptcha-response"]}&remoteip=${req.connection.remoteAddress}`

  const response = await fetch(verifyUrl, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
    }
  })

  const json = await response.json()

  if(json.success) {
    passport.authenticate("local", {
      // successRedirect: "/dashboard",
      failureRedirect: "/user/login",
      failureFlash: true,
    })(req, res, next);
  }else {
    req.flash('error', 'Your Captcha invalid please try again ...')
    res.redirect('/user/login')
  }


};

exports.logout = (req, res) => {
  // req.session = null
  req.logout()
  req.flash("success_msg", "Logout Successfuly")
  res.set("Cache-Control","no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0")
  res.redirect("/user/login")
}

exports.remember = (req, res) => {
  if(req.body.remember) {
    req.session.cookie.originalMaxAge = 24 * 60 * 60 * 1000
  } else {
    req.session.cookie.expire = null
  }

  res.redirect("/dashboard")
}

exports.forgetPassword = async (req, res) => {
  res.render('forgetpass', {
    pageTitle: "Forget Password",
    path: "/forget-password",
    message: req.flash("success_msg"),
    error: req.flash("error"),
  })
}


exports.handleForgetPassword = async (req, res) => {
  const {email} = req.body

  const user = await User.findOne({email: email})

  if(!user) {
    req.flash("error", "User Not Found")
    return res.render('forgetPass', {
      pageTitle: "Forget Password",
      path: "/forget-password",
      message: req.flash("success_msg"),
      error: req.flash("error"),
    })
  }

  const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: '1h'})

  const resetLink = `http://localhost:3000/users/reset-password/${token}`

  sendEmail(user.email, user.fullname, "Forget Password", `For change passwor click in link <a href="${resetLink}">Change Password</a>`)

  req.flash('success_msg', 'Reset Email Sent Successfully')

  res.render('forgetPass', {
    pageTitle: "Forget Password",
    path: "/forget-password",
    message: req.flash("success_msg"),
    error: req.flash("error"),
  })
}


exports.resetPassword = async (req, res) => {
  const token = req.params.id

  let decodedToken

  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET)
  } catch (err) {
    console.log(err)
    if(!decodedToken) {
      return res.redirect('/404')
    }
  }

  res.render('resetPass', {
      pageTitle: "Reset Password",
      path: "/reset-password",
      message: req.flash("success_msg"),
      error: req.flash("error"),
      userId: decodedToken.userId
  })
}


exports.handleResetPassword = async (req, res) => {
  const {password, confirmPassword} = req.body

  if(passport !== confirmPassword) {
    req.flash('error', "Password and confirmPassword is not same")

    return res.render('resetPass', {
      pageTitle: "Reset Password",
      path: "/reset-password",
      message: req.flash("success_msg"),
      error: req.flash("error"),
      userId: req.params.id
    })
  }

  const user = await User.findOne({_id: req.params.id})

  if(!user) {
    return res.redirect('/404')
  }

  user.password = password
  await user.save()

  req.flash('success_msg', 'Password Changed Successfully')
  res.redirect('/users/login')
}
