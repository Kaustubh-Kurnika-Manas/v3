const express = require("express");
const router = express.Router();
const Auth = require("../middlewares/auth");
const adminController = require("../controllers/admin.controller");
const Authorize = require("../middlewares/authorize");
const Role = require("../utils/roles");
const Logger = require("../middlewares/logger");
const events = require("../utils/logEvents");
const multer = require("multer");
const path = require("path");
const response = require("../utils/responses.utils");

// Configure multer for Excel files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads/'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
        cb(null, true);
    } else {
        cb(new Error('Only Excel files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return response.badrequest(res, 'File size is too large. Maximum size is 5MB');
        }
        return response.badrequest(res, err.message);
    } else if (err) {
        return response.badrequest(res, err.message);
    }
    next();
};

/** All admin routes are in this file
 *  For protected routes we are passing the Authorize middleware to check if the user
 *  is authorized to perform the operation/action.
 *
 *  **This will prevent other users of the system from penetrating into the admin dashboard
 */

// admin login route
router.post("/login", adminController.adminLoginHandler, Logger(events.LOGIN));

// admin dashboard route
router.get("/dashboard", Auth, Authorize(Role.Admin), adminController.adminDashboardHandler);

// get all mentor and students
router.get("/getAllUsers", Auth, Authorize(Role.Admin), adminController.getAllUsers);

// saving student mentor groups
router.post(
    "/saveGroup",
    Auth,
    Authorize(Role.Admin),
    adminController.saveGroup,
    Logger(events.GROUP_UPDATE)
);

// assign mentees 
router.post("/assignMentees", Auth, Authorize(Role.Admin), adminController.assignMentees, Logger(events.GROUP_UPDATE));

// assign mentees 
router.post("/removeMentees", Auth, Authorize(Role.Admin), adminController.removeMentees, Logger(events.GROUP_UPDATE));

// get admin profile route
router.get("/profile", Auth, Authorize(Role.Admin), adminController.getProfile);

// admin profile update route
router.post("/profile", Auth, Authorize(Role.Admin), adminController.updateProfile);

// banning user route
router.patch("/banUser", Auth, Authorize(Role.Admin), adminController.banUser);

// get all interactions
router.get("/interactions", Auth, Authorize(Role.Admin), adminController.getAllInteractions);

// Import users from Excel file
router.post(
    "/importUsers",
    Auth,
    Authorize(Role.Admin),
    upload.single("excelFile"),
    handleMulterError,
    adminController.importUsersFromExcel,
    Logger(events.IMPORT_USERS)
);

// Import only mentors from Excel file
router.post(
    "/importMentors",
    Auth,
    Authorize(Role.Admin),
    upload.single("excelFile"),
    handleMulterError,
    adminController.importMentorsFromExcel,
    Logger(events.IMPORT_MENTORS)
);

// Import only mentees from Excel file
router.post(
    "/importMentees",
    Auth,
    Authorize(Role.Admin),
    upload.single("excelFile"),
    handleMulterError,
    adminController.importMenteesFromExcel,
    Logger(events.IMPORT_MENTEES)
);

module.exports = router;
