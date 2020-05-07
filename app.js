var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session");
var mongoose = require("mongoose");
var constant = require("./utils/constants");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var User = require("./model/user");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// configure session in mongoes
app.use(
  session({
    secret: constant.SESSION_SECRET,
    cookie: { maxAge: constant.SESSION_MAX_AGE },
    store: new (require("express-sessions"))({
      storage: constant.MONGODB_NAME,
      instance: mongoose, // optional
      host: constant.LOCALHOST, // optional
      port: constant.SESSION_PORT, // optional
      db: constant.DATABASE_NAME, // optional
      collection: "sessions", // optional
      expire: constant.SESSION_MAX_AGE, // optional
    }),
    resave: true,
    saveUninitialized: true,
  })
);

//init mongoose
mongoose.connect(constant.DATABASE_PATH, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

app.use("/", requireLogin(), indexRouter);
app.use("/users", requireLogin(), usersRouter);
// check login
function requireLogin() {
  return async function (req, res, next) {
    var count = await User.find().count();
    if(count==0){
      var user = User();
      user.firstname = 'Admin';
      user.lastname = 'Admin';
      user.role = 'admin';
      user.username = 'admin';
      user.password = 'admin';
      user.email = 'admin@gmail.com';
      await user.save();
    }
    if (req.path === "/login") {
      if (typeof req.session.account === "undefined") next();
      else res.redirect("/");
    } else {
      if (typeof req.session.account === "undefined") res.redirect("/login");
      else next();
    }
  };
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
