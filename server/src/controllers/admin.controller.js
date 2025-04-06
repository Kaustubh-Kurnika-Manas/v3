const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const Mentor = require("../models/Mentor");
const Student = require("../models/Student");
const Meeting = require("../models/Meeting");
const Post = require("../models/Post");
const Log = require("../models/Log");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs")
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

// importing utils
const response = require("../utils/responses.utils");

// importing helpers methods
const studentHelpers = require("../helpers/student.helper");
const mentorHelpers = require("../helpers/mentor.helper");

// env config
dotenv.config();

/**
 * This module consists of all the handler function for the admin route
 */

module.exports = {
    /** Admin Login Handler */
    adminLoginHandler: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                // if email/pass does not exists
                return response.badrequest(res, "Please provide valid email/password", {});
            }

            const admin = await Admin.findByCredentials(email, password);
            const token = await admin.generateAuthToken();
            response.success(res, "Login successful", { auth_token: token, role: "ADMIN" });

            req.user = admin;
            next();
        } catch (err) {
            console.log(err);
            response.error(res);
        }
    },

    // admin dashboard handler function
    adminDashboardHandler: (req, res, next) => {
        response.success(res, "", { user: req.user });
        next();
    },

    // this route handler returns the list of all users i.e, all mentors and students
    getAllUsers: async (req, res, next) => {
        const students = await studentHelpers.getAllStudents();
        const mentors = await mentorHelpers.getAllMentors();
        response.success(res, "", { mentors, students });
        next();
    },

    /**
     *  saveGroup route saves the mentor and students group.
     *  We store the mentor's id in every student's property named "mentordBy" , to establish a link
     *  between a mentor and the students mentored by him.
     *
     * Add/Update and unassigned students operations are in this route
     * */
    saveGroup: async (req, res, next) => {
        try {
            const { mentorId, studentIds } = req.body;

            // Validate input
            if (!mentorId || !studentIds || !Array.isArray(studentIds)) {
                return response.badrequest(res, "Invalid input data");
            }

            // Find the mentor
            const mentor = await Mentor.findById(mentorId);
            if (!mentor) {
                return response.notfound(res, "Mentor not found");
            }

            // Get current students under this mentor
            const currentStudents = await Student.find({ mentoredBy: mentorId });

            // Remove mentor from students not in the new list
            for (const student of currentStudents) {
                if (!studentIds.includes(student._id.toString())) {
                    student.mentoredBy = student.mentoredBy.filter(id => id.toString() !== mentorId);
                    await student.save();
                }
            }

            // Add mentor to new students
            for (const studentId of studentIds) {
                const student = await Student.findById(studentId);
                if (!student) {
                    console.log(`Student not found: ${studentId}`);
                    continue;
                }

                // Add mentor to student's mentoredBy array if not already present
                if (!student.mentoredBy.includes(mentorId)) {
                    student.mentoredBy.push(mentorId);
                    await student.save();
                }
            }

            // Update mentor's student count
            mentor.studentCount = studentIds.length;
            await mentor.save();

            response.success(res, "Group saved successfully");
            next();
        } catch (err) {
            console.log(err);
            response.error(res);
        }
    },
    // this handler assign students to a mentor
    assignMentees: async (req, res, next) => {
        try {
            const { mentorId, studentIds } = req.body;
            console.log("Assigning mentees:", { mentorId, studentIds });

            // Validate input
            if (!mentorId || !studentIds || !Array.isArray(studentIds)) {
                console.log("Invalid input data");
                return response.badrequest(res, "Invalid input data");
            }

            // Find the mentor
            const mentor = await Mentor.findById(mentorId);
            if (!mentor) {
                console.log("Mentor not found:", mentorId);
                return response.notfound(res, "Mentor not found");
            }

            // Add mentor to each student
            for (const studentId of studentIds) {
                const student = await Student.findById(studentId);
                if (!student) {
                    console.log(`Student not found: ${studentId}`);
                    continue;
                }

                console.log(`Processing student ${studentId}:`, {
                    currentMentoredBy: student.mentoredBy,
                    mentorId: mentorId
                });

                // Add mentor to student's mentoredBy array if not already present
                if (!student.mentoredBy.includes(mentorId)) {
                    student.mentoredBy.push(mentorId);
                    await student.save();
                    console.log(`Updated student ${studentId} with mentor ${mentorId}`);
                } else {
                    console.log(`Student ${studentId} already has mentor ${mentorId}`);
                }
            }

            // Update mentor's student count
            const studentCount = await Student.countDocuments({ mentoredBy: mentorId });
            mentor.studentCount = studentCount;
            await mentor.save();
            console.log(`Updated mentor ${mentorId} student count to ${studentCount}`);

            response.success(res, "Mentees assigned successfully");
            next();
        } catch (err) {
            console.error("Error in assignMentees:", err);
            response.error(res);
        }
    },
    // Remove mentees from mentor
    removeMentees: async (req, res, next) => {
        try {
            const { mentorId, studentIds } = req.body;

            // Validate input
            if (!mentorId || !studentIds || !Array.isArray(studentIds)) {
                return response.badrequest(res, "Invalid input data");
            }

            // Find the mentor
            const mentor = await Mentor.findById(mentorId);
            if (!mentor) {
                return response.notfound(res, "Mentor not found");
            }

            // Update each student
            for (const studentId of studentIds) {
                const student = await Student.findById(studentId);
                if (!student) {
                    console.log(`Student not found: ${studentId}`);
                    continue;
                }

                // Remove mentor from student's mentoredBy array
                student.mentoredBy = student.mentoredBy.filter(id => id.toString() !== mentorId);
                await student.save();

                // Decrease mentor's student count
                mentor.studentCount = Math.max(0, mentor.studentCount - 1);
            }

            await mentor.save();
            response.success(res, "Mentees removed successfully");
            next();
        } catch (err) {
            console.log(err);
            response.error(res);
        }
    },

    // get admin profile
    getProfile: async (req, res, next) => {
        try {
            const admin = req.user;
            response.success(res, "", admin);
            next();
        } catch (err) {
            console.log(err);
            response.error(res);
        }
    },

    // update Profile
    updateProfile: async (req, res, next) => {
        try {
            const { firstname, middlename, lastname } = req.body;
            const admin = req.user;

            admin.firstname = firstname || admin.firstname;
            admin.middlename = middlename || admin.middlename;
            admin.lastname = lastname || admin.lastname;
            await admin.save();
            response.success(res, "", admin);
            next();
        } catch (err) {
            console.log(err);
            response.error(res);
        }
    },

    // user banning handler
    banUser: async (req, res, next) => {
        try {
            const { id } = req.body;
            let user;

            if (!user) {
                user = await Mentor.findById(id);
            }

            if (!user) {
                user = await Student.findById(id);
            }

            if (!user) {
                return response.notfound(res);
            }

            if (user.isBanned) {
                user.isBanned = false;
            } else {
                user.isBanned = true;
            }

            await user.save();

            if (user.isBanned) response.success(res, "User has been banned");
            else response.success(res, "User has been unbanned");
            next();
        } catch (err) {
            console.log(err);
            response.error(res);
        }
    },

    // get all interactions for admin
    getAllInteractions: async (req, res, next) => {
        try {
            const mentors = await Mentor.find();
            const result = [];

            for await (const mentor of mentors) {
                const posts = await Post.find({ group_id: mentor._id }).populate("author");
                const meetings = await Meeting.find({ host: mentor._id })
                    .populate("host")
                    .populate("participants.user");

                result.push({
                    mentor,
                    posts,
                    meetings,
                });
            }

            response.success(res, "", { count: result.length, interactions: result });
        } catch (err) {
            console.log(err);
            response.error(res);
        }
    },

    // Import users from Excel file
    importUsersFromExcel: async (req, res, next) => {
        try {
            if (!req.file) {
                return response.badrequest(res, "Please upload an Excel file");
            }

            const workbook = xlsx.readFile(req.file.path);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = xlsx.utils.sheet_to_json(worksheet);

            const results = {
                mentors: [],
                mentees: [],
                errors: []
            };

            // Create a map to store mentor-email to mentor-id mapping
            const mentorMap = new Map();

            // First pass: Create all mentors
            for (const row of data) {
                try {
                    // Validate required fields
                    if (!row.menteeName || !row.menteeEmail || !row.menteeEnrollment || 
                        !row.mentorName || !row.mentorEmail || !row.mentorDepartment) {
                        results.errors.push(`Missing required fields in row: ${JSON.stringify(row)}`);
                        continue;
                    }

                    // Check if mentor already exists
                    let mentor = await Mentor.findOne({ email: row.mentorEmail });
                    
                    // If mentor doesn't exist, create new mentor
                    if (!mentor) {
                        const hashedPassword = await bcrypt.hash("abcd1234", 10);
                        mentor = new Mentor({
                            email: row.mentorEmail,
                            password: hashedPassword,
                            firstname: row.mentorName,
                            middlename: "",
                            lastname: "",
                            department: row.mentorDepartment,
                            studentCount: 0,
                            isEmailVerified: true,
                            gender: row.mentorGender || "",
                            seniority: row.mentorSeniority || ""
                        });
                        await mentor.save();
                        results.mentors.push(`Created mentor: ${row.mentorName}`);
                    } else {
                        // Update existing mentor with new fields if provided
                        if (row.mentorGender) mentor.gender = row.mentorGender;
                        if (row.mentorSeniority) mentor.seniority = row.mentorSeniority;
                        await mentor.save();
                        results.mentors.push(`Updated mentor: ${row.mentorName}`);
                    }

                    // Store mentor email to id mapping
                    mentorMap.set(row.mentorEmail, mentor._id);
                } catch (err) {
                    console.error('Error processing mentor:', err);
                    results.errors.push(`Error processing mentor in row ${JSON.stringify(row)}: ${err.message}`);
                }
            }

            // Create a map to store mentee-email to mentor-emails mapping
            const menteeMentorMap = new Map();

            // First pass: Build mentee-mentor relationships
            for (const row of data) {
                try {
                    if (!row.menteeEmail || !row.mentorEmail) continue;

                    if (!menteeMentorMap.has(row.menteeEmail)) {
                        menteeMentorMap.set(row.menteeEmail, new Set());
                    }
                    menteeMentorMap.get(row.menteeEmail).add(row.mentorEmail);
                } catch (err) {
                    console.error('Error building mentee-mentor relationships:', err);
                }
            }

            // Second pass: Create mentees and assign them to mentors
            for (const [menteeEmail, mentorEmails] of menteeMentorMap.entries()) {
                try {
                    const row = data.find(r => r.menteeEmail === menteeEmail);
                    if (!row) continue;

                    // Get mentor IDs from map
                    const mentorIds = Array.from(mentorEmails)
                        .map(email => mentorMap.get(email))
                        .filter(id => id); // Remove any undefined IDs

                    if (mentorIds.length === 0) {
                        results.errors.push(`No valid mentors found for mentee: ${menteeEmail}`);
                        continue;
                    }

                    // Check if mentee already exists
                    let mentee = await Student.findOne({ email: menteeEmail });
                    
                    // If mentee doesn't exist, create new mentee
                    if (!mentee) {
                        const hashedPassword = await bcrypt.hash(row.menteeEnrollment, 10);
                        mentee = new Student({
                            email: menteeEmail,
                            password: hashedPassword,
                            firstname: row.menteeName,
                            middlename: "",
                            lastname: "",
                            enrollment_no: row.menteeEnrollment,
                            year: row.menteeYear || 'I', // Default to first year if not specified
                            department: row.mentorDepartment,
                            mentoredBy: mentorIds,
                            isEmailVerified: true
                        });
                        await mentee.save();
                        results.mentees.push(`Created mentee: ${row.menteeName} with ${mentorIds.length} mentors`);

                        // Update each mentor's student count
                        for (const mentorId of mentorIds) {
                            const mentor = await Mentor.findById(mentorId);
                            if (mentor) {
                                mentor.studentCount += 1;
                                await mentor.save();
                            }
                        }
                    } else {
                        // If mentee exists, update their mentors
                        // Add new mentors without removing existing ones
                        const existingMentors = new Set(mentee.mentoredBy.map(id => id.toString()));
                        const newMentorIds = mentorIds.filter(id => !existingMentors.has(id.toString()));
                        
                        if (newMentorIds.length > 0) {
                            mentee.mentoredBy = [...mentee.mentoredBy, ...newMentorIds];
                            await mentee.save();
                            
                            // Update new mentors' student counts
                            for (const mentorId of newMentorIds) {
                                const mentor = await Mentor.findById(mentorId);
                                if (mentor) {
                                    mentor.studentCount += 1;
                                    await mentor.save();
                                }
                            }
                            
                            results.mentees.push(`Updated mentee: ${row.menteeName} with ${newMentorIds.length} additional mentors`);
                        }
                    }
                } catch (err) {
                    console.error('Error processing mentee:', err);
                    results.errors.push(`Error processing mentee ${menteeEmail}: ${err.message}`);
                }
            }

            // Clean up: Delete the uploaded file
            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Error deleting file:', err);
            }

            response.success(res, "Import completed", results);
            next();
        } catch (err) {
            console.error('Error in importUsersFromExcel:', err);
            response.error(res, "Error processing Excel file");
        }
    },

    // Import only mentors from Excel file
    importMentorsFromExcel: async (req, res, next) => {
        try {
            if (!req.file) {
                return response.badrequest(res, "Please upload an Excel file");
            }

            const workbook = xlsx.readFile(req.file.path);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = xlsx.utils.sheet_to_json(worksheet);

            const results = {
                mentors: [],
                errors: []
            };

            // Process each row for mentor creation
            for (const row of data) {
                try {
                    // Validate required fields for mentor
                    if (!row.mentorName || !row.mentorEmail || !row.mentorDepartment) {
                        results.errors.push(`Missing required mentor fields in row: ${JSON.stringify(row)}`);
                        continue;
                    }

                    // Check if mentor already exists
                    let mentor = await Mentor.findOne({ email: row.mentorEmail });
                    
                    if (!mentor) {
                        // Create new mentor using the signup format
                        const mentorData = {
                            email: row.mentorEmail,
                            password: "abcd1234",
                            confirmPassword: "abcd1234",
                            firstName: row.mentorName,
                            lastName: "",
                            middleName: "",
                            department: row.mentorDepartment,
                            gender: row.gender || "",
                            seniority: row.seniority || ""
                        };

                        // Create new mentor
                        mentor = new Mentor({
                            email: mentorData.email,
                            password: await bcrypt.hash(mentorData.password, 8),
                            firstname: mentorData.firstName,
                            middlename: mentorData.middleName,
                            lastname: mentorData.lastName,
                            department: mentorData.department,
                            gender: mentorData.gender,
                            seniority: mentorData.seniority,
                            isEmailVerified: true,
                            emailVerifyToken: ""
                        });
                        await mentor.save();

                        results.mentors.push(`Created mentor: ${row.mentorName}`);
                    } else {
                        // Update existing mentor with new fields if provided
                        if (row.gender) mentor.gender = row.gender;
                        if (row.seniority) mentor.seniority = row.seniority;
                        await mentor.save();
                        results.mentors.push(`Updated mentor: ${row.mentorName}`);
                    }
                } catch (err) {
                    console.error('Error processing mentor:', err);
                    results.errors.push(`Error processing mentor ${row.mentorEmail}: ${err.message}`);
                }
            }

            // Clean up: Delete the uploaded file
            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Error deleting file:', err);
            }

            response.success(res, "Mentor import completed", results);
            next();
        } catch (err) {
            console.error('Error in importMentorsFromExcel:', err);
            response.error(res, "Error processing Excel file");
        }
    },

    // Import only mentees from Excel file
    importMenteesFromExcel: async (req, res, next) => {
        try {
            if (!req.file) {
                return response.badrequest(res, "Please upload an Excel file");
            }

            const workbook = xlsx.readFile(req.file.path);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = xlsx.utils.sheet_to_json(worksheet);

            const results = {
                mentees: [],
                errors: []
            };

            // Process each row for mentee creation
            for (const row of data) {
                try {
                    // Validate required fields for mentee
                    if (!row.menteeName || !row.menteeEmail || !row.menteeEnrollment || !row.menteeDepartment) {
                        results.errors.push(`Missing required mentee fields in row: ${JSON.stringify(row)}`);
                        continue;
                    }

                    // Check if mentee already exists
                    let mentee = await Student.findOne({ email: row.menteeEmail });
                    
                    if (!mentee) {
                        // Create new mentee using the signup format
                        const hashedPassword = await bcrypt.hash(row.menteeEnrollment, 10);
                        mentee = new Student({
                            email: row.menteeEmail,
                            password: hashedPassword,
                            firstname: row.menteeName,
                            middlename: "",
                            lastname: "",
                            enrollment_no: row.menteeEnrollment,
                            year: row.menteeYear || 'I', // Default to first year if not specified
                            department: row.menteeDepartment,
                            isEmailVerified: true
                        });
                        await mentee.save();
                        results.mentees.push(`Created mentee: ${row.menteeName}`);
                    } else {
                        results.mentees.push(`Mentee already exists: ${row.menteeName}`);
                    }
                } catch (err) {
                    console.error('Error processing mentee:', err);
                    results.errors.push(`Error processing mentee ${row.menteeEmail}: ${err.message}`);
                }
            }

            // Clean up: Delete the uploaded file
            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Error deleting file:', err);
            }

            // Trigger auto-pairing after importing mentees
            try {
                console.log("Starting auto-pairing process after mentee import...");
                const pairingResult = await mentorHelpers.autoPairMentorsAndAssignMentees();
                if (pairingResult.success) {
                    results.autoPairing = "Auto-pairing completed successfully";
                    console.log("Auto-pairing completed:", pairingResult.message);
                } else {
                    results.autoPairingError = pairingResult.message;
                    console.error("Auto-pairing failed:", pairingResult.message);
                }
            } catch (err) {
                console.error('Error in auto-pairing:', err);
                results.autoPairingError = err.message;
            }

            response.success(res, "Mentee import completed", results);
            next();
        } catch (err) {
            console.error('Error in importMenteesFromExcel:', err);
            response.error(res, "Error processing Excel file");
        }
    },
};

