var constant = require('../utils/constants');
function getDashboards(role) {
  var nav = [];
  if (role === constant.ADMIN_ROLE) nav = getDashboardForAdmin();
  else if(role === constant.STAFF_ROLE) nav = getDashboardForStaff();
  else  if(role === constant.TUTOR_ROLE) nav = getDashboardForTutor();
  else nav = getDashboardForStudent();
  return nav;
}

function getDashboardForAdmin() {
  var nav = [];
  nav.push({
    title: "Dashboard",
    icon: "dashboard",
    url: "/",
  });
  nav.push({
    title: "User Profile",
    icon: "supervisor_account",
    url: "/user-profile",
  });
  return nav;
}

function getDashboardForStaff() {
  var nav = [];
  nav.push({
    title: "Dashboard",
    icon: "dashboard",
    url: "/",
  });
  nav.push({
    title: "Tutor Profile",
    icon: "supervisor_account",
    url: "/tutor-profile",
  });
  nav.push({
    title: "Student Profile",
    icon: "supervisor_account",
    url: "/student-profile",
  });
  return nav;
}

function getDashboardForTutorPerson() {
  var nav = [];
  nav.push({
    title: "Dashboard",
    icon: "dashboard",
    url: "/dashboard",
  });
  nav.push({
    title: "Account",
    icon: "supervisor_account",
    url: "/account",
  });
  return nav;
}

function getDashboardForTutor() {
  var nav = [];
  nav.push({
    title: "Dashboard",
    icon: "dashboard",
    url: "/dashboard",
  });
  nav.push({
    title: "Messenger",
    icon: "chat",
    url: "/messenger",
  });
  nav.push({
    title: "Metting Room",
    icon: "meeting_room",
    url: "/metting",
  });
  
  return nav;
}

function getDashboardForStudent() {
  var nav = [];
  nav.push({
    title: "Dashboard",
    icon: "dashboard",
    url: "/dashboard",
  });
  nav.push({
    title: "Messenger",
    icon: "chat",
    url: "/messenger",
  });
  nav.push({
    title: "Metting Room",
    icon: "meeting_room",
    url: "/metting",
  });
  return nav;
}

module.exports = {
    getDashboards
}
