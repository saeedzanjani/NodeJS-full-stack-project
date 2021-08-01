const fs = require('fs');
const Post = require("../models/Post");
const multer = require("multer");
const uuid = require("uuid").v4;
const sharp = require("sharp");
const shortId = require("shortid");
const appRoot = require("app-root-path");

exports.dashboard = async (req, res) => {
  const page = +req.query.page || 1;
  const postPerPage = 2;

  try {
    const postsNumbers = await Post.find({
      user: req.user._id,
    }).countDocuments();
    const posts = await Post.find({ user: req.user._id })
      .skip((page - 1) * postPerPage)
      .limit(postPerPage);

    res.render("dashboard", {
      pageTitle: "Dashboard",
      path: "/dashboard",
      posts,
      currentPage: page,
      prevPage: page - 1,
      nextPage: page + 1,
      hasPrevPage: page > 1,
      hasNextPage: page * postPerPage < postsNumbers,
      lastPage: Math.ceil(postsNumbers / postPerPage),
      fullname: req.user.fullname,
    });
  } catch (err) {
    console.log(err);
    res.redirect("/404");
  }
};

exports.getAddPost = async (req, res) => {
  res.render("private/addPost", {
    pageTitle: "Create New Post",
    path: "/dashboard/add-post",
  });
};

exports.createPost = async (req, res) => {
  const errorArr = [];

  const thumbnail = req.files ? req.files.thumbnail : {};
  const fileName = `${shortId.generate()}_${thumbnail.name}`;
  const uploadPath = `${appRoot}/public/uploads/thumbnails/${fileName}`;

  try {
    req.body = { ...req.body, thumbnail };

    await Post.postValidation(req.body);

    await sharp(thumbnail.data)
      .jpeg({ quality: 60 })
      .toFile(uploadPath)
      .catch((err) => console.log(err));

    await Post.create({ ...req.body, user: req.user._id, thumbnail: fileName });

    res.redirect("/dashboard");
  } catch (err) {
    console.log(err);
    err.inner.forEach((e) => {
      errorArr.push({
        name: e.path,
        message: e.message,
      });
    });
    res.render("private/addPost", {
      pageTitle: "Add Post",
      path: "/dashboard/add-post",
      fullname: req.user.fullname,
      errors: errorArr,
    });
  }
};

exports.uploadImage = (req, res) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "/public/uploads/");
    },
    filename: (req, file, cb) => {
      cb(null, `${uuid}_${file.originalname}`);
    },
  });

  const fileFilte = (req, file, cb) => {
    if (file.mimetype == "image/jpej") {
      cb(null, true);
    } else {
      cb("Just jpeg format supported ...!", false);
    }
  };

  const upload = multer({
    limits: { fileSize: 4000000 },
    // dest: 'uploads/',
    // storage: storage,
    fileFilte: fileFilte(),
  }).single("image");

  upload((req, res), async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).send("Image size not be must 4mb");
      }
      res.status(400).send(err);
    } else {
      if (req.file) {
        const fileName = `${shortId.generate()}_${req.file.originalname}`;
        await sharp(req.files.image.data)
          .jpeg({ quality: 60 })
          .toFile(`./public/uploads/${fileName}`)
          .catch((err) => console.log(err));
        res.status(200).send(`http://localhost:3000/uploads/${fileName}`);
      } else res.send("Please slelct image for upload");
    }
  });
};

exports.getEditPost = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id });

    if (!post) {
      return res.redirect("/404");
    }

    if (post.user.toString() != req.user._id) {
      return res.redirect("/dashboard");
    } else {
      res.render("private/editPost", {
        pageTitle: "Edit Post",
        path: "/dashboard/edit-post",
        post,
      });
    }
  } catch (err) {
    console.log(err);
  }
};



exports.editPost = async (req, res) => {
  const errorArr = [];

  const thumbnail = req.files ? req.files.thumbnail : {};
  const fileName = `${shortId.generate()}_${thumbnail.name}`;
  const uploadPath = `${appRoot}/public/uploads/thumbnails/${fileName}`;

  const post = await Post.findOne({ _id: req.params.id });
  try {
      if (thumbnail.name)
          await Post.postValidation({ ...req.body, thumbnail });
      else
          await Post.postValidation({
              ...req.body,
              thumbnail: {
                  name: "placeholder",
                  size: 0,
                  mimetype: "image/jpeg",
              },
          });

      if (!post) {
          return res.redirect("errors/404");
      }

      if (post.user.toString() != req.user._id) {
          return res.redirect("/dashboard");
      } else {
          if (thumbnail.name) {
              fs.unlink(
                  `${appRoot}/public/uploads/thumbnails/${post.thumbnail}`,
                  async (err) => {
                      if (err) console.log(err);
                      await sharp(thumbnail.data)
                      .jpeg({ quality: 60 })
                      .toFile(uploadPath)
                       .catch((err) => console.log(err));
                  }
              );
          }

          const { title, status, text } = req.body;
          post.title = title;
          post.status = status;
          post.text = text;
          post.thumbnail = thumbnail.name ? fileName : post.thumbnail;

          await post.save();
          return res.redirect("/dashboard");
      }
  } catch (err) {
      console.log(err);
      err.inner.forEach((e) => {
          errorArr.push({
              name: e.path,
              message: e.message,
          });
      });
      res.render("private/editPost", {
          pageTitle: "بخش مدیریت | ویرایش پست",
          path: "/dashboard/edit-post",
          layout: "./layouts/dashLayout",
          fullname: req.user.fullname,
          errors: errorArr,
          post,
      });
  }
};






exports.deletePost = async (req, res) => {
  try {
    await Post.findByIdAndRemove({ _id: req.params.id });
    res.redirect("/dashboard");
  } catch (err) {
    console.log(err);
  }
};

exports.getCaptcha = (req, res) => {
  CAPTCHA_NUM = parseInt(Math.random() * 9000 + 1000);
  const p = new captchapng(80, 30, CAPTCHA_NUM);
  p.color(0, 0, 0, 0);
  p.color(80, 80, 80, 255);

  const img = p.getBase64();
  const imgBase64 = Buffer.from(img, "base64");

  res.send(imgBase64);
};

exports.handleDashSearch = async (req, res) => {
  const page = +req.query.page || 1;
  const postPerPage = 2;

  try {
    const postsNumbers = await Post.find({
      status: "public",
      $text: { $search: req.body.search },
    }).countDocuments();

    const posts = await Post.find({
      status: "public",
      $text: { $search: req.body.search },
    })
      .sort({
        createdAt: "desc",
      })
      .skip((page - 1) * postPerPage)
      .limit(postPerPage);

    res.render("dashboard", {
      pageTitle: "Searching result",
      path: "/dashboard",
      fullname: req.user.fullname,
      posts,
      currentPage: page,
      prevPage: page - 1,
      nextPage: page + 1,
      hasPrevPage: page > 1,
      hasNextPage: page * postPerPage < postsNumbers,
      lastPage: Math.ceil(postsNumbers / postPerPage),
      fullname: req.user.fullname,
    });
  } catch (err) {
    console.log(err);
    res.render("errors/500", {
      pageTitle: "server error",
      path: "/500",
    });
  }
};
