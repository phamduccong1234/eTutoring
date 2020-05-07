var express = require("express");
var router = express.Router();
var { getDashboards } = require("../model/dashboard");
var constant = require("../utils/constants");
var User = require("../model/user");
var Allocate = require("../model/allocate");
var Messenger = require("../model/messenger");
var Metting = require("../model/Metting");
var nodemailer = require("nodemailer");
var mongoose = require("mongoose");
var moment = require("moment");
var fs = require("fs");
var mime = require("mime");

/* GET login page. */
router.get("/login", function (req, res, next) {
  var error = req.cookies["error"];

  var username = getUsername(req);
  var password = getPassword(req);
  res.clearCookie("error");
  res.render("login", {
    error: error,
    username: username,
    password: password,
  });
});

function getUsername(req) {
  if (typeof req.session.remember === "undefined") return "";
  else return req.session.remember.username;
}

function getPassword(req) {
  if (typeof req.session.remember === "undefined") return "";
  else return req.session.remember.password;
}

/* POST login page. */
router.post("/login", async function (req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  var remember = req.body.remember;

  if (remember == "on") {
    req.session.remember = {
      username: username,
      password: password,
    };
  } else {
    delete req.session.remember;
  }

  var query = [{ username: username }, { email: username }];
  var user = await User.findOne().or(query).exec();
  if (user) {
    if (user.password === password) {
      req.session.account = user;
      res.redirect("/");
    } else {
      res.cookie("error", "Password incorrect", { maxAge: 10000 });
      res.redirect("/login");
    }
  } else {
    res.cookie("error", "Username or email incorrect", { maxAge: 10000 });
    res.redirect("/login");
  }
});

/* GET login page. */
router.get("/logout", function (req, res, next) {
  if (req.session.account) delete req.session.account;
  res.redirect("/login");
});

/* GET index page. */
router.get("/index", function (req, res, next) {
  res.redirect("/");
});

/* GET index page. */
router.get("/dashboard", function (req, res, next) {
  res.redirect("/");
});

/* GET home page. */
router.get("/", async function (req, res, next) {
  var account = getAccount(req);
  var messengerCount = await getTotalMessenger(account._id);
  var mettingCount = await getTotalMettingRoom(account._id);
  var documentCount = await getTotalDocument(account._id);
  var commentCount = await getTotalComment(account._id);
  res.render("index", {
    title: "Dashboard",
    dashboards: getDashboards(req.session.account.role),
    message: getMessage(req),
    messengerCount: messengerCount,
    mettingCount: mettingCount,
    documentCount: documentCount,
    commentCount: commentCount,
  });
});

async function getTotalMessenger(_id) {
  var messengers = await Messenger.find();
  var count = 0;
  messengers.forEach((messenger) => {
    messenger.messages.forEach((message) => {
      if (message.fromId == _id) {
        count += 1;
      }
    });
  });
  return count;
}

async function getTotalMettingRoom(_id) {
  var mettings = await Metting.find();
  var count = 0;
  mettings.forEach((metting) => {
    metting.members.forEach((member) => {
      if (member._id == _id) {
        count += 1;
      }
    });
  });
  return count;
}

async function getTotalDocument(_id) {
  var mettings = await Metting.find();
  var count = 0;
  mettings.forEach((metting) => {
    metting.documents.forEach((document) => {
      if (document.from._id == _id) {
        count += 1;
      }
    });
  });
  return count;
}

async function getTotalComment(_id) {
  var mettings = await Metting.find();
  var count = 0;
  mettings.forEach((metting) => {
    metting.comments.forEach((comments) => {
      if (comments.from._id == _id) {
        count += 1;
      }
    });
  });
  return count;
}

/* GET user profile page for admin. */
router.get("/user-profile", function (req, res, next) {
  res.render("admin-user-profile", {
    title: "User Profile",
    dashboards: getDashboards(req.session.account.role),
  });
});

/* GET user profile page for admin. */
router.get("/tutor-profile", async function (req, res, next) {
  var tutors = await User.find({ role: constant.TUTOR_ROLE }).exec();
  // res.json(tutors);
  // return;
  res.render("tutor-profile", {
    title: "Tutor Profile",
    dashboards: getDashboards(req.session.account.role),
    tutors: tutors,
    message: getMessage(req),
  });
});

/* GET user profile detailpage for admin. */
router.get("/tutor-detail/:id", async function (req, res, next) {
  var tutorId = req.params.id;
  var allocate = await getAllocateByTutorId(tutorId);
  var studentUnAllocated = await getAllStudentUnallocated();

  if (allocate != null && studentUnAllocated != null) {
    var tutor = allocate.tutor;
    var message = getMessage(req);
    res.render("tutor-detail", {
      title: tutor.firstname + " " + tutor.lastname + " - Profile",
      message: message,
      dashboards: getDashboards(req.session.account.role),
      allocate: allocate,
      tutor: tutor,
      studentUnAllocated: studentUnAllocated,
    });
  } else {
    res.redirect("/not-found");
  }
});

router.get("/tutor-allocate/:allocate_id/:student_id", async function (req, res, next) {
  var studentID = req.params.student_id;
  var allocateID = req.params.allocate_id;
  var allocate = await getAllocateById(allocateID);
  var student = await getStudentByID(studentID);
  var studentAllocated = await getAllStudentAllocated();

  if (allocate != null && student != null) {
    if (!containsObject(student, studentAllocated)) {
      allocate.students.push(student);
      await allocate.save();
      var tutor = allocate.tutor;
      await createMessenger(student, tutor);
      sendEmailWhenAllocated(student, tutor);
      var message = {
        content:
          "Allocate student " +
          student.firstname +
          " to " +
          tutor.firstname +
          " success",
        type: "success",
      };
      setMessage(req, message);
    } else {
      var message = {
        content: "Allocate student failed, please re-try letter!",
        type: "danger",
      };
      setMessage(req, message);
    }
    res.redirect("/tutor-detail/" + allocate.tutor._id);
  } else {
    res.redirect("/not-found");
  }
});

router.get("/tutor-reallocate/:allocate_id/:student_id", async function (
  req,
  res,
  next
) {
  var studentID = req.params.student_id;
  var allocateID = req.params.allocate_id;
  var allocate = await getAllocateById(allocateID);
  var tutor = allocate.tutor;

  var index = -1;
  if (allocate != null) {
    var students = allocate.students;
    for (var i = 0; i < students.length; ++i) {
      if (students[i]._id == studentID) {
        index = i;
        break;
      }
    }
    if (index >= 0) {
      var student = students[index];
      allocate.students.splice(index, 1);
      await allocate.save();
      await blockMessenger(student, tutor);
      var message = {
        content: "Reallocate student success!",
        type: "success",
      };
      setMessage(req, message);
      sendEmailWhenReallocated(tutor, student);
    } else {
      var message = {
        content: "Not found this student in list of tutor " + tutor.firstname,
        type: "danger",
      };
      setMessage(req, message);
    }
    res.redirect("/tutor-detail/" + allocate.tutor._id);
  } else {
    res.redirect("/not-found");
  }
});

router.get("/student-profile", async function (req, res, next) {
  var allocates = await getAllAllocate();
  var studentUnAllocated = await getAllStudentUnallocated();
  res.render("student-profile", {
    title: "Students Profile",
    dashboards: getDashboards(req.session.account.role),
    allocates: allocates,
    studentUnAllocated: studentUnAllocated,
    message: getMessage(req),
  });
});

/* GET messenger page. */
router.get("/messenger", async function (req, res, next) {
  var account = getAccount(req);
  var messengers = await getMessngers(account);
  res.render("messenger", {
    title: "Messenger",
    dashboards: getDashboards(req.session.account.role),
    message: getMessage(req),
    messengers: messengers,
    account: account,
  });
});

/* POST save user proofile to database. */
router.post("/user-profile", async function (req, res, next) {
  var data = req.body;
  var user = getUserData(data);
  // res.json(user);
  await user.save(async (error) => {
    if (error) res.json(error);
    else {
      if (user.role == constant.TUTOR_ROLE) {
        var allocate = new Allocate({
          tutor: user,
        });
        await allocate.save();
      }
      res.json("success");
    }
  });
});

router.get("/messenger-detail/:fromid/:toid", async function (req, res, next) {
  var fromid = req.params.fromid;
  var toid = req.params.toid;
  var messenger = await getMessenger(fromid, toid);
  res.json(messenger);
});

router.get("/metting-create", function (req, res, next) {
  res.render("metting-create", {
    title: "Create Metting Room",
    dashboards: getDashboards(req.session.account.role),
    message: getMessage(req),
  });
});

router.get("/metting-block/:id", async function (req, res, next) {
  var id = req.params.id;
  var metting = await getMettingById(id);
  if (metting != null) {
    metting.isBlocked = true;
    await metting.save();
    var message = {
      content: "Metting room '" + metting.title + "' has been closed!",
      type: "success",
    };
    setMessage(req, message);
    res.redirect("/metting-join/" + id);
  } else {
    res.redirect("/not-found");
  }
});

router.get("/metting-open/:id", async function (req, res, next) {
  var id = req.params.id;
  var metting = await getMettingById(id);
  if (metting != null) {
    metting.isBlocked = false;
    await metting.save();
    var message = {
      content: "Metting room '" + metting.title + "' has been opened!",
      type: "success",
    };
    setMessage(req, message);
    res.redirect("/metting-join/" + id);
  } else {
    res.redirect("/not-found");
  }
});

router.post("/metting-create", async function (req, res, next) {
  var data = req.body;
  var metting = getMettingData(data, req);
  var account = getAccount(req);
  if (account.role == constant.TUTOR_ROLE) {
    await metting.save();
    var message = {
      content: "Create metting room: '" + metting.title + "' success",
      type: "success",
    };
    setMessage(req, message);
    res.render("metting-create", {
      title: "Create Metting Room",
      dashboards: getDashboards(req.session.account.role),
      message: getMessage(req),
      metting: metting,
    });
  } else {
    var message = {
      content: "You are not authorized to perform this function!",
      type: "danger",
    };
    setMessage(req, message);
    res.render("metting-create", {
      title: "Create Metting Room",
      dashboards: getDashboards(req.session.account.role),
      message: getMessage(req),
    });
  }
});

/* GET metting page. */
router.get("/metting", async function (req, res, next) {
  res.render("metting", {
    title: "Metting Room",
    dashboards: getDashboards(req.session.account.role),
    message: getMessage(req),
    mettings: await getMettings(),
  });
});

/* GET metting detail page. */
router.get("/metting-join/:id", async function (req, res, next) {
  var id = req.params.id;
  var metting = await getMettingById(id);
  var account = getAccount(req);
  if (metting != null) {
    var members = metting.members;
    if (
      containsObject1(account, members) ||
      metting.mode == constant.PUBLIC_MODE
    ) {
      await joinMettingRoom(metting, account, req);
      res.render("metting-room", {
        title: "Metting Room: '" + metting.title + "'",
        dashboards: getDashboards(req.session.account.role),
        message: getMessage(req),
        metting: metting,
        account: account,
        moment: moment,
      });
    } else {
      await requestJoinMettingRoom(metting, account, req);
      res.redirect("/metting");
    }
  } else {
    res.redirect("/not-found");
  }
});

/* GET metting detail page. */
router.get("/metting-agree/:mettingid/:userid", async function (
  req,
  res,
  next
) {
  var mettingid = req.params.mettingid;
  var userid = req.params.userid;
  var metting = await getMettingById(mettingid);
  var user = await getUserByid(userid);
  var account = getAccount(req);
  if (metting != null && user != null) {
    if (account._id == metting.creator._id) {
      await joinMettingRoom(metting, user, req);
      var message = {
        content:
          user.firstname + " " + user.lastname + " has been joined this room!",
        type: "success",
      };
      setMessage(req, message);
    } else {
      var message = {
        content: "You are not authorized to perform this function!",
        type: "danger",
      };
      setMessage(req, message);
    }
    res.redirect("/metting-join/" + mettingid);
  } else {
    res.redirect("/not-found");
  }
});

router.get("/metting-reject/:mettingid/:userid", async function (
  req,
  res,
  next
) {
  var mettingid = req.params.mettingid;
  var userid = req.params.userid;
  var metting = await getMettingById(mettingid);
  var user = await getUserByid(userid);
  var account = getAccount(req);
  if (metting != null && user != null) {
    if (account._id == metting.creator._id) {
      await rejectMettingRoom(metting, user, req);
      var message = {
        content:
          user.firstname +
          " " +
          user.lastname +
          " has been rejected this room!",
        type: "success",
      };
      setMessage(req, message);
    } else {
      var message = {
        content: "You are not authorized to perform this function!",
        type: "danger",
      };
      setMessage(req, message);
    }
    res.redirect("/metting-join/" + mettingid);
  } else {
    res.redirect("/not-found");
  }
});

/* GET download document */
router.get("/document-download/:mettingid/:documentid", async function (
  req,
  res,
  next
) {
  var mettingid = req.params.mettingid;
  var documentid = req.params.documentid;
  var metting = await getMettingById(mettingid);
  var account = getAccount(req);
  if (metting != null) {
    var members = metting.members;
    if (containsObject1(account, members)) {
      var documents = metting.documents;
      var index = -1;
      for (let i = 0; i < documents.length; ++i) {
        if (documents[i]._id == documentid) {
          index = i;
          break;
        }
      }
      if (index >= 0) {
        var document = documents[index];
        var src = document.src;
        var srcLength = src.length;
        src = src.substring(
          src.lastIndexOf("base64,") + "base64,".length,
          srcLength
        );
        var bitmap = new Buffer.from(src, "base64");
        var index = document.nameFake.lastIndexOf(".");
        var extension = document.nameFake.substring(
          index,
          document.nameFake.length
        );
        var newName = document.name + extension;
        console.log(newName);
        var path = "public/" + newName;
        await fs.writeFileSync(path, bitmap);
        res.setHeader("Content-disposition", "attachment; filename=" + newName);
        res.download(path);
      } else {
        var message = {
          content: "Not found document",
          type: "danger",
        };
        setMessage(req, message);
        res.redirect("/metting");
      }
    } else {
      await requestJoinMettingRoom(metting, account, req);
      res.redirect("/metting");
    }
  } else {
    res.redirect("/not-found");
  }
});

async function joinMettingRoom(metting, account, req) {
  var members = metting.members;
  var newAwaintApprovals = [];
  var awaintApprovals = metting.awaiting_approval;
  awaintApprovals.forEach((awaintApproval) => {
    if (awaintApproval._id != account._id) {
      newAwaintApprovals.push(awaintApproval);
    }
  });
  metting.awaiting_approval = newAwaintApprovals;
  if (!containsObject1(account, members)) {
    metting.members.push(account);
    await metting.save();
    var message = {
      content: "You joined metting room '" + metting.title + "', success",
      type: "success",
    };
    setMessage(req, message);
  } else {
    await metting.save();
  }
}

async function rejectMettingRoom(metting, account, req) {
  var newAwaintApprovals = [];
  var awaintApprovals = metting.awaiting_approval;

  awaintApprovals.forEach((awaintApproval) => {
    if (awaintApproval._id != account._id) {
      newAwaintApprovals.push(awaintApproval);
    }
  });
  metting.awaiting_approval = newAwaintApprovals;
  await metting.save();
}

async function requestJoinMettingRoom(metting, account, req) {
  var awaiting_approval = metting.awaiting_approval;
  if (!containsObject(account, awaiting_approval)) {
    metting.awaiting_approval.push(account);
    await metting.save();
  }
  var message = {
    content:
      "You cannot join '" +
      metting.title +
      "', your request has been sent to the room administrator. Please try again later",
    type: "danger",
  };
  setMessage(req, message);
}

async function getMessenger(studentId, tutorId) {
  var query = {
    $or: [
      {
        $and: [
          { "student._id": mongoose.Types.ObjectId(studentId) },
          { "tutor._id": mongoose.Types.ObjectId(tutorId) },
        ],
      },
      {
        $and: [
          { "student._id": mongoose.Types.ObjectId(tutorId) },
          { "tutor._id": mongoose.Types.ObjectId(studentId) },
        ],
      },
    ],
  };
  return await Messenger.findOne(query).exec();
}

function getUserData(data) {
  var user = new User();
  user.firstname = data.firstname;
  user.lastname = data.lastname;
  user.address = data.address;
  user.city = data.city;
  user.country = data.country;
  user.phone = data.phone;
  user.email = data.email;
  user.username = data.username;
  user.password = data.password;
  user.aboutme = data.aboutme;
  user.imagebase64 = data.imagebase64;
  user.role = data.role;
  return user;
}

function getMettingData(data, req) {
  var metting = new Metting();
  metting.title = data.title;
  metting.description = data.description;
  metting.members = [getAccount(req)];
  metting.mode = data.mode;
  if (data.imagebase64.length == 0) {
    metting.imagebase64 = "/images/orez.jpg";
  } else {
    metting.imagebase64 = data.imagebase64;
  }
  metting.creator = getAccount(req);
  return metting;
}

function containsObject(obj, list) {
  var i;
  for (i = 0; i < list.length; i++) {
    if (list[i]._id.equals(obj._id)) {
      return true;
    }
  }
  return false;
}

function containsObject1(obj, list) {
  var i;
  for (i = 0; i < list.length; i++) {
    if (list[i]._id == obj._id) {
      return true;
    }
  }
  return false;
}

async function getAllocateByTutorId(id) {
  if (id.length == constant.ID_LENGTH)
    return await Allocate.findOne({
      "tutor._id": mongoose.Types.ObjectId(id),
    });
  else return null;
}

async function getAllocateById(id) {
  if (id.length == constant.ID_LENGTH)
    return await Allocate.findOne({
      _id: new mongoose.Types.ObjectId(id),
    }).exec();
  else return null;
}

async function getStudentInAllocate(id) {
  var allocate = await getAllocateById(id);
  if (allocate != null) return allocate.students;
  else [];
}

async function getAllAllocate() {
  return await Allocate.find();
}

async function getAllStudent() {
  return await User.find({
    role: constant.STUDENT_ROLE,
  });
}

async function getStudentByID(id) {
  if (id.length == constant.ID_LENGTH)
    return await User.findOne({
      role: constant.STUDENT_ROLE,
      _id: new mongoose.Types.ObjectId(id),
    }).exec();
  else return null;
}

async function getAllStudentUnallocated() {
  var students = await getAllStudent();
  var studentAllocated = await getAllStudentAllocated();
  var studentUnAllocated = [];
  students.forEach((student) => {
    if (!containsObject(student, studentAllocated)) {
      studentUnAllocated.push(student);
    }
  });
  return studentUnAllocated;
}

async function getAllStudentAllocated() {
  var allocates = await getAllAllocate();
  var studentAllocated = [];
  allocates.forEach((item) => {
    studentAllocated = studentAllocated.concat(item.students);
  });
  return studentAllocated;
}

function getMessage(req) {
  if (typeof req.session.message === "undefined") {
    return {
      content: "",
      type: "",
    };
  } else {
    var message = req.session.message;
    delete req.session.message;
    return message;
  }
}

function setMessage(req, message) {
  req.session.message = message;
}

var transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: constant.EMAIL_USER,
    pass: constant.EMAIL_PASS,
  },
});

function sendEmail(to, subject, text) {
  var mailOptions = {
    from: constant.EMAIL_USER,
    to: to,
    subject: subject,
    text: text,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) res.json(error);
    else res.json(info);
  });
}

function sendEmailWhenAllocated(student, tutor) {
  sendEmailAllocatedToTutor(student, tutor);
  sendEmailAllocatedToStudent(student, tutor);
}

function sendEmailAllocatedToTutor(student, tutor) {
  sendEmail(tutor.email, "eTutoring","You have been assigned the task of supporting "+student.firstname+" students");
}

function sendEmailAllocatedToStudent(student, tutor) {
  sendEmail(student.email, "eTutoring","From now on you will get help from "+tutor.firstname);
}

function sendEmailWhenReallocated(student, tutor) {}

async function createMessenger(student, tutor) {
  var messenger = await findMessenger(student._id, tutor._id);
  if (messenger != null) {
    messenger.isBlocked = false;
    await messenger.save();
  } else {
    var newMessenger = Messenger();
    newMessenger.tutor = tutor;
    newMessenger.student = student;
    newMessenger.isBlocked = false;
    newMessenger.messages = [];
    await newMessenger.save();
  }
}

async function findMessenger(studentId, tutorId) {
  var query = [{ "student._id": studentId }, { "tutor._id": tutorId }];
  return await Messenger.findOne().and(query).exec();
}

async function blockMessenger(student, tutor) {
  var messenger = await findMessenger(student._id, tutor._id);
  messenger.isBlocked = true;
  await messenger.save();
}

async function getMessngers(account) {
  if (account.role == constant.TUTOR_ROLE)
    return await getMessngerForTutor(account);
  else return await getMessngerForStudent(account);
}

async function getMessngerForStudent(account) {
  return await Messenger.find({
    "student._id": mongoose.Types.ObjectId(account._id),
  }).exec();
}

async function getMessngerForTutor(account) {
  return await Messenger.find({
    "tutor._id": mongoose.Types.ObjectId(account._id),
  }).exec();
}

async function getMettings() {
  return await Metting.find().sort({ created_at: -1 });
}

async function getMettingById(id) {
  if (id.length == constant.ID_LENGTH) return await Metting.findById(id);
  else return null;
}

async function getUserByid(id) {
  if (id.length == constant.ID_LENGTH) return await User.findById(id);
  else return null;
}

function getAccount(req) {
  return req.session.account;
}

module.exports = router;
