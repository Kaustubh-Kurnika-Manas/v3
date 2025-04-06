import React, { useState, useEffect, useRef, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router";
import { Box, Button, Typography, Paper, Alert, Tab, Tabs } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
    logoutMentor,
    mentorGetAllMentees,
    mentorGetDetails,
    mentorGetProfile,
} from "../../../actions/mentor.jsx";
import ChatAlt2Icon from "../../../assets/icons/ChatAlt2Icon.jsx";
import HomeIcon from "../../../assets/icons/HomeIcon.jsx";
import AnnotationIcon from "../../../assets/icons/AnnotationIcon.jsx";
import AcademicCapIcon from "../../../assets/icons/AcademicCapIcon.jsx";
import Code from "../../../assets/icons/Code.jsx";
import Chat from "./dashboardLinks/chat/Chat";
import MenteeInfo from "./dashboardLinks/menteeInfo/MenteeInfo.jsx";
import Post from "./dashboardLinks/post/Post.jsx";
import Profile from "./dashboardLinks/profile/Profile";
import AcademicDetails from "./dashboardLinks/academicdetails/AcademicDetails";
import ManageGroups from "./dashboardLinks/manageGroups/ManageGroups";
import Logs from "./dashboardLinks/logs/Logs";

import { getAllChat, logoutChats } from "../../../actions/chat";
import LogoutIcon from "../../../assets/icons/LogoutIcon.jsx";
import UserCircleIcon from "../../../assets/icons/UserCircleIcon.jsx";
import DotIcon from "../../../assets/icons/DotIcon.jsx";
import { SocketContext } from "../../../socket/socket";

import {
    addMessages,
    addNotification,
    addSingleChat,
    reorderChats,
    updateLatestMessage,
} from "../../../actions/chat";

import NotifySound from "../../../assets/sounds/light-562.ogg";
import BellIcon from "../../../assets/icons/BellIcon.jsx";
import Notification from "../../notification/Notification";
import {
    addGlobalNotification,
    getAllNotifications,
    logoutNotifications,
    markNotificationRead,
} from "../../../actions/notification";
import { CSSTransition } from "react-transition-group";
import NotificationCounter from "../../notification/NotificationCounter.jsx";
import NotificationModal from "../../notification/notificationModal/NotificationModal.jsx";
import ModalOverlay from "../../modal/ModalOverlay.jsx";
import {
    logoutStudent,
    studentGetDetails,
    studentGetProfileDetails,
} from "../../../actions/student";
import Home from "./dashboardLinks/home/Home";
import { getAllPosts, logoutPosts } from "../../../actions/post";
import { Roles } from "../../../utility.jsx";
import DocumentTextIcon from "../../../assets/icons/DocumentTextIcon.jsx";
import Plus from "../../../assets/icons/Plus.jsx";
import UserGroupIcon from "../../../assets/icons/UserGroupIcon.jsx";
import { adminFetchLogs, adminGetDetails, logoutAdmin } from "../../../actions/admin";
import Meetings from "./dashboardLinks/meetings/Meetings";
import { getMeetings } from "../../../actions/meeting";
import Loading from "../../loading/Loading";
import AdminInteractions from "./dashboardLinks/adminInteractions/AdminInteractions";
import { authContext } from "../../../contexts/authContext.jsx";

const MentorDashboard = () => {
    let uid = "";
    let role = "";

    // getting the socket context from the provider
    const socket = useContext(SocketContext);

    // setting the admin auth token
    const dispatch = useDispatch();
    const history = useHistory();

    // getting uid and role of the logged in user
    if (localStorage.getItem("authData") == null) {
        history.push("/");
    } else {
        uid = JSON.parse(localStorage.getItem("authData"))["uid"];
        role = JSON.parse(localStorage.getItem("authData"))["role"];
    }

    // accessing profile data of the required user
    const profileData = useSelector((state) => {
        if (role === Roles.MENTOR) {
            const mentorState = state.mentor;
            console.log("Mentor state:", mentorState);
            return mentorState?.profileData || mentorState?.mentorData?.data;
        }
        else if (role === Roles.STUDENT) {
            const studentState = state.student;
            console.log("Student state:", studentState);
            // First try to get profileData, then fallback to studentData.data
            const data = studentState?.profileData || studentState?.studentData?.data;
            console.log("Student profile data:", data);
            // Ensure we have all required fields
            if (data) {
                // Handle name fields specifically
                const nameFields = {
                    firstname: data.firstname || data.menteeName || data.name || "",
                    middlename: data.middlename || "",
                    lastname: data.lastname || "",
                };

                // If we have a full name, try to split it
                if (nameFields.firstname && !nameFields.middlename && !nameFields.lastname) {
                    const nameParts = nameFields.firstname.split(' ');
                    if (nameParts.length >= 3) {
                        nameFields.firstname = nameParts[0];
                        nameFields.middlename = nameParts[1];
                        nameFields.lastname = nameParts.slice(2).join(' ');
                    } else if (nameParts.length === 2) {
                        nameFields.firstname = nameParts[0];
                        nameFields.lastname = nameParts[1];
                    }
                }

                // Log the name fields for debugging
                console.log("Name fields:", nameFields);

                // Return the profile data with all fields properly set
                return {
                    ...data,
                    ...nameFields,
                    avatar: data.avatar || { url: "" },
                    email: data.email || data.menteeEmail || "",
                    phone_no: data.phone_no || "",
                    address: data.address || "",
                    department: data.department || data.menteeDepartment || "",
                    programme: data.programme || "",
                    semester: data.semester || "",
                    enrollment_no: data.enrollment_no || data.menteeEnrollment || "",
                    enrollment_year: data.enrollment_year || "",
                    gender: data.gender || "",
                    blood_group: data.blood_group || "",
                    home_place: data.home_place || "",
                    hobbies: data.hobbies || "",
                    guardian_name: data.guardian_name || "",
                    guardian_ph_no: data.guardian_ph_no || "",
                    guardian_address: data.guardian_address || "",
                    family_details: data.family_details || "",
                    hostel_name: data.hostel_name || "",
                    warden_name: data.warden_name || "",
                    asst_warden_name: data.asst_warden_name || "",
                    warden_ph_no: data.warden_ph_no || "",
                    asst_warden_ph_no: data.asst_warden_ph_no || "",
                    responsible_contact_person_at_residence: data.responsible_contact_person_at_residence || "",
                    contact_no_of_contact_person: data.contact_no_of_contact_person || "",
                    residence_address: data.residence_address || "",
                    mentoredBy: data.mentoredBy || { name: "" }
                };
            }
            return null;
        }
        return null;
    });

    // accesing admin data
    const adminData = useSelector((state) => {
        if (role === Roles.ADMIN) return state.admin?.adminData;
        return null;
    });

    // Add a loading state
    const [loading, setLoading] = useState(true);

    // fetching details
    useEffect(() => {
        const dis = [];
        if (role === Roles.ADMIN) {
            dis.push(dispatch(adminGetDetails(history)));
            dis.push(dispatch(adminFetchLogs(history)));
        } else {
            if (role === Roles.MENTOR) {
                dis.push(dispatch(mentorGetDetails(history)));
                dis.push(dispatch(mentorGetProfile(history)));
                dis.push(dispatch(mentorGetAllMentees(history)));
            } else if (role === Roles.STUDENT) {
                dis.push(dispatch(studentGetDetails(history)));
                dis.push(dispatch(studentGetProfileDetails(history)));
            }

            dis.push(dispatch(getAllChat(history)));
            dis.push(dispatch(getAllNotifications(history)));
            dis.push(dispatch(getMeetings(history)));
        }

        const func = async (disArray) => {
            try {
                await Promise.all(disArray);
            } catch (e) {
                console.error("Error fetching data:", e);
            }
            setLoading(false);
        };
        func(dis);

        if (localStorage.getItem("persistChat") !== null) {
            localStorage.removeItem("persistChat");
        }
        if (localStorage.getItem("selectedChat") !== null) {
            localStorage.removeItem("selectedChat");
        }
        if (localStorage.getItem("chats") !== null) {
            localStorage.removeItem("chats");
        }
        if (localStorage.getItem("0") !== null) {
            localStorage.removeItem("0");
        }
        if (localStorage.getItem("visible") !== null) {
            localStorage.removeItem("visible");
        }
        localStorage.setItem("chatRoute", JSON.stringify(false));
        localStorage.setItem("postRoute", JSON.stringify(false));
    }, [dispatch, history, role]);

    // state for maintaining the side nav bar
    const [route, setRoute] = useState({
        home: role === Roles.ADMIN ? false : true,
        post: false,
        menteeInfo: false,
        profile: false,
        chat: false,
        academicDetails: false,
        manageGroups: false,
        logs: false,
        meetings: false,
        allInteractions: role === Roles.ADMIN ? true : false,
        importUsers: false
    });

    // state to control the chat notification on the dashboard tab
    const [newMsgNotify, setNewMsgNotify] = useState(false);

    console.log("profile data in dashboard", profileData);
    console.log("admin data in dashboard", adminData);

    // state variable to control the stream updated button
    const [streamUpdated, setStreamUpdated] = useState(false);

    // socket to setup the user for the socket and to listen to new notification
    useEffect(() => {
        socket.emit("setup", uid);
        console.log("socket", socket);

        const handleNewNoti = (data) => {
            console.log("new socket Notification", data);
            if (
                data.event.type === "POST_CREATED" &&
                localStorage.getItem("postRoute") !== null &&
                JSON.parse(localStorage.getItem("postRoute"))
            ) {
                setStreamUpdated(true);
                // make the received notification as read
                dispatch(markNotificationRead(history, [{ id: data._id, willReceive: false }]));
            } else {
                dispatch(addGlobalNotification(history, data));
            }
        };

        socket.on("new Notification", handleNewNoti);

        return () => {
            socket.off("new Notification", handleNewNoti);
            //socket.disconnect();
        };
    }, []);

    // useeffect call when message is received
    useEffect(() => {
        const notification = (data) => {
            const id = data.data.chat._id.toString();
            dispatch(addNotification(id));
            dispatch(reorderChats(id));
            playNotifySound();
        };

        const handleMsgRec = (data) => {
            /* this is to create the chat automatically if chat not shown and message came in user chat */
            if (localStorage.getItem("chats") !== null) {
                let chats = JSON.parse(localStorage.getItem("chats"));
                let val = false;
                for (let i = 0; i < chats.length; i++) {
                    if (chats[i]._id.toString() === data.data.chat._id.toString()) {
                        val = true;
                        break;
                    }
                }
                if (val === false) {
                    dispatch(addSingleChat(data.data.chat));
                }
            }

            if (localStorage.getItem("selectedChat") === data.data.chat._id.toString()) {
                if (
                    localStorage.getItem("visible") !== null &&
                    JSON.parse(localStorage.getItem("visible"))
                )
                    notification(data); // notification when scroll to bottom button visible
                else if (!JSON.parse(localStorage.getItem("chatRoute"))) {
                    setNewMsgNotify(true);
                    // notification when selected chat is same but in different tab
                    notification(data);
                }
                dispatch(addMessages(data));
                dispatch(updateLatestMessage(data));
            } else {
                if (!JSON.parse(localStorage.getItem("chatRoute"))) setNewMsgNotify(true);
                // if message for unintended person then store chat id in global store to show notification
                notification(data);
                dispatch(updateLatestMessage(data));
            }
        };

        if (role !== Roles.ADMIN) {
            socket.on("message received", handleMsgRec);
        }

        return () => {
            socket.off("message received", handleMsgRec);
            //socket.disconnect();
        };
    }, []);

    // function to set the states of the chatRoute and the postRoute
    const setVals = ({ chatRoute, postRoute }) => {
        localStorage.setItem("chatRoute", JSON.stringify(chatRoute));
        localStorage.setItem("postRoute", JSON.stringify(postRoute));
    };

    // function to chnage the tabs screens of the dashboard
    const handleRouteChange = (e) => {
        const selectedTab = e.target.id;
        switch (selectedTab) {
            case "home":
                setVals({ chatRoute: false, postRoute: false });
                setRoute({
                    home: true,
                    post: false,
                    menteeInfo: false,
                    profile: false,
                    chat: false,
                    academicDetails: false,
                    manageGroups: false,
                    logs: false,
                    meetings: false,
                    allInteractions: false,
                    importUsers: false
                });
                break;
            case "post":
                setVals({ chatRoute: false, postRoute: true });
                setRoute({
                    home: false,
                    post: true,
                    menteeInfo: false,
                    profile: false,
                    chat: false,
                    academicDetails: false,
                    manageGroups: false,
                    logs: false,
                    meetings: false,
                    allInteractions: false,
                    importUsers: false
                });
                break;
            case "profile":
                setVals({ chatRoute: false, postRoute: false });
                setRoute({
                    home: false,
                    post: false,
                    menteeInfo: false,
                    profile: true,
                    chat: false,
                    academicDetails: false,
                    manageGroups: false,
                    logs: false,
                    meetings: false,
                    allInteractions: false,
                    importUsers: false
                });
                break;
            case "menteeInfo":
                setVals({ chatRoute: false, postRoute: false });
                setRoute({
                    home: false,
                    post: false,
                    menteeInfo: true,
                    profile: false,
                    chat: false,
                    academicDetails: false,
                    manageGroups: false,
                    logs: false,
                    meetings: false,
                    allInteractions: false,
                    importUsers: false
                });
                break;
            case "chat":
                setVals({ chatRoute: true, postRoute: false });
                setNewMsgNotify(false);
                setRoute({
                    home: false,
                    post: false,
                    menteeInfo: false,
                    profile: false,
                    chat: true,
                    academicDetails: false,
                    manageGroups: false,
                    logs: false,
                    meetings: false,
                    allInteractions: false,
                    importUsers: false
                });
                break;
            case "academicDetails":
                setVals({ chatRoute: false, postRoute: false });
                setRoute({
                    home: false,
                    post: false,
                    menteeInfo: false,
                    profile: false,
                    chat: false,
                    academicDetails: true,
                    manageGroups: false,
                    logs: false,
                    meetings: false,
                    allInteractions: false,
                    importUsers: false
                });
                break;
            case "manageGroups":
                setRoute({
                    home: false,
                    post: false,
                    menteeInfo: false,
                    profile: false,
                    chat: false,
                    academicDetails: false,
                    manageGroups: true,
                    logs: false,
                    meetings: false,
                    allInteractions: false,
                    importUsers: false
                });
                break;
            case "logs":
                setRoute({
                    home: false,
                    post: false,
                    menteeInfo: false,
                    profile: false,
                    chat: false,
                    academicDetails: false,
                    manageGroups: false,
                    logs: true,
                    meetings: false,
                    allInteractions: false,
                    importUsers: false
                });
                break;
            case "allInteractions":
                setRoute({
                    home: false,
                    post: false,
                    menteeInfo: false,
                    profile: false,
                    chat: false,
                    academicDetails: false,
                    manageGroups: false,
                    logs: false,
                    meetings: false,
                    allInteractions: true,
                    importUsers: false
                });
                break;
            case "meetings":
                setVals({ chatRoute: false, postRoute: false });
                setRoute({
                    home: false,
                    post: false,
                    menteeInfo: false,
                    profile: false,
                    chat: false,
                    academicDetails: false,
                    manageGroups: false,
                    logs: false,
                    meetings: true,
                    allInteractions: false,
                    importUsers: false
                });
                break;
            case "importUsers":
                setVals({ chatRoute: false, postRoute: false });
                setRoute({
                    home: false,
                    post: false,
                    menteeInfo: false,
                    profile: false,
                    chat: false,
                    academicDetails: false,
                    manageGroups: false,
                    logs: false,
                    meetings: false,
                    allInteractions: false,
                    importUsers: true
                });
                break;
            default:
                break;
        }
    };

    // function to handle the logout
    const handleLogout = () => {
        if (role === Roles.MENTOR) dispatch(logoutMentor());
        if (role === Roles.STUDENT) dispatch(logoutStudent());
        if (role === Roles.ADMIN) dispatch(logoutAdmin());
        dispatch(logoutChats());
        dispatch(logoutNotifications());
        dispatch(logoutPosts());
        //socket.disconnect();
        history.push("/");
    };

    // play sound on notification
    const playNotifySound = () => {
        var audio = new Audio(NotifySound);
        audio.play();
    };

    // state variable to store and show the notification content in the notification modal
    const [modalContent, setModalContent] = useState(null);

    // state to control notification panel show and dont show
    const [showNotificationDropDown, setShowNotificationDropDown] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);

    // node ref used in css transition for the notification panel
    const notificationDropDownRef = useRef(null);
    const overlayRef = useRef(null);
    const notificationModalRef = useRef(null);

    const [selectedTab, setSelectedTab] = useState(0);
    const [file, setFile] = useState(null);
    const [mentorFile, setMentorFile] = useState(null);
    const [menteeFile, setMenteeFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleFileChange = (event, type) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                selectedFile.type === 'application/vnd.ms-excel') {
                if (type === 'mentor') {
                    setMentorFile(selectedFile);
                } else {
                    setMenteeFile(selectedFile);
                }
                setError('');
            } else {
                setError('Please upload an Excel file (.xlsx or .xls)');
                if (type === 'mentor') {
                    setMentorFile(null);
                } else {
                    setMenteeFile(null);
                }
            }
        }
    };

    const handleUpload = async (type) => {
        const selectedFile = type === 'mentor' ? mentorFile : menteeFile;
        if (!selectedFile) {
            setError('Please select a file first');
            return;
        }

        // Get the auth token from localStorage
        const authData = JSON.parse(localStorage.getItem('authData'));
        if (!authData || !authData.auth_token) {
            setError('Please log in to upload files');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        formData.append('excelFile', selectedFile);

        try {
            const endpoint = type === 'mentor' ? '/admin/importMentors' : '/admin/importMentees';
            const response = await axios.post(`http://localhost:3000${endpoint}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${authData.auth_token}`
                }
            });

            if (response.data.success) {
                setSuccess('File uploaded successfully!');
                toast.success(`${type === 'mentor' ? 'Mentors' : 'Mentees'} imported successfully!`, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                
                const results = response.data.data;
                if (type === 'mentor' && results.mentors.length > 0) {
                    toast.info(`Created ${results.mentors.length} mentors`, {
                        position: "top-right",
                        autoClose: 5000,
                    });
                }
                if (type === 'mentee' && results.mentees.length > 0) {
                    toast.info(`Created ${results.mentees.length} mentees`, {
                        position: "top-right",
                        autoClose: 5000,
                    });
                    
                    // Handle auto-pairing results
                    if (results.autoPairing) {
                        toast.success(results.autoPairing, {
                            position: "top-right",
                            autoClose: 5000,
                        });
                    }
                    if (results.autoPairingError) {
                        toast.error(`Auto-pairing failed: ${results.autoPairingError}`, {
                            position: "top-right",
                            autoClose: 5000,
                        });
                    }
                }
                if (results.errors.length > 0) {
                    toast.error(`Encountered ${results.errors.length} errors during import`, {
                        position: "top-right",
                        autoClose: 5000,
                    });
                }
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Error uploading file');
            toast.error(error.response?.data?.message || 'Error uploading file', {
                position: "top-right",
                autoClose: 5000,
            });
        } finally {
            setUploading(false);
            if (type === 'mentor') {
                setMentorFile(null);
            } else {
                setMenteeFile(null);
            }
        }
    };

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };

    return (
        <>
            {loading ? (
                <Loading />
            ) : (
                <authContext.Provider value={{ uid, role }}>
                    <div className="h-screen flex bg-gray-50 overflow-hidden">
                        <nav className="w-3/20 h-screen bg-white flex flex-col z-10">
                            <div className="h-1/10 flex items-center justify-center">
                                <Code alt={true} myStyle={"w-7 h-7 mr-4"} />
                                {role === Roles.MENTOR && <h1>Mentor</h1>}
                                {role === Roles.STUDENT && <h1>Student</h1>}
                                {role === Roles.ADMIN && <h1>Admin</h1>}
                            </div>
                            {role === Roles.ADMIN && (
                                <button
                                    id="manageGroups"
                                    onClick={handleRouteChange}
                                    className={`flex items-center justify-between text-left bg-blue-600 hover:bg-blue-800 text-white mt-5 mb-9 ml-8 mr-8 pt-3 pb-3 pl-8 pr-8 rounded-md`}
                                >
                                    Manage groups
                                    <Plus
                                        alt={true}
                                        myStyle={"h-6 w-6 text-white pointer-events-none"}
                                    />
                                </button>
                            )}
                            {role !== Roles.ADMIN && (
                                <button
                                    onClick={handleRouteChange}
                                    id="home"
                                    className={`${route.home ? "text--gray-700 bg-gray-100" : "text-gray-400"
                                        } flex items-center text-left hover:bg-gray-100 mt-5 ml-8 mr-8 pt-3 pb-3 pl-10 rounded-md`}
                                >
                                    <HomeIcon
                                        myStyle={"h-5 w-5 mr-3 pointer-events-none"
                                            .concat(" ")
                                            .concat(route.home && "text-blue-600")}
                                        alt={true}
                                    />
                                    Home
                                </button>
                            )}
                            {role === Roles.ADMIN && (
                                <button
                                    onClick={handleRouteChange}
                                    id="allInteractions"
                                    className={`${route.allInteractions
                                        ? "text--gray-700 bg-gray-100"
                                        : "text-gray-400"
                                        } flex items-center text-left hover:bg-gray-100 mt-5 ml-8 mr-8 pt-3 pb-3 pl-10 rounded-md`}
                                >
                                    <UserGroupIcon
                                        alt={true}
                                        myStyle={"h-5 w-5 mr-3 pointer-events-none"
                                            .concat(" ")
                                            .concat(route.allInteractions && "text-blue-600")}
                                    />
                                    Users
                                </button>
                            )}
                            {role !== Roles.ADMIN && (
                                <button
                                    onClick={handleRouteChange}
                                    id="post"
                                    className={`${route.post ? "text--gray-700 bg-gray-100" : "text-gray-400"
                                        } flex items-center text-left hover:bg-gray-100 mt-5 ml-8 mr-8 pt-3 pb-3 pl-10 rounded-md`}
                                >
                                    <AnnotationIcon
                                        myStyle={"h-5 w-5 mr-3 pointer-events-none"
                                            .concat(" ")
                                            .concat(route.post && "text-blue-600")}
                                        alt={true}
                                    />
                                    Post
                                </button>
                            )}
                            {role !== Roles.ADMIN && (
                                <button
                                    onClick={handleRouteChange}
                                    id="meetings"
                                    className={`${route.meetings
                                        ? "text--gray-700 bg-gray-100"
                                        : "text-gray-400"
                                        } flex items-center text-left hover:bg-gray-100 mt-5 ml-8 mr-8 pt-3 pb-3 pl-10 rounded-md`}
                                >
                                    <UserGroupIcon
                                        myStyle={"h-5 w-5 mr-3 pointer-events-none"
                                            .concat(" ")
                                            .concat(route.meetings && "text-blue-600")}
                                        alt={true}
                                    />
                                    Meetings
                                </button>
                            )}
                            {role === Roles.MENTOR && (
                                <button
                                    onClick={handleRouteChange}
                                    id="menteeInfo"
                                    className={`${route.menteeInfo
                                        ? "text--gray-700 bg-gray-100"
                                        : "text-gray-400"
                                        } flex items-center text-left hover:bg-gray-100 mt-5 ml-8 mr-8 pt-3 pb-3 pl-10 rounded-md`}
                                >
                                    <AcademicCapIcon
                                        myStyle={"h-5 w-5 mr-3 pointer-events-none"
                                            .concat(" ")
                                            .concat(route.menteeInfo && "text-blue-600")}
                                        alt={true}
                                    />
                                    Mentees
                                </button>
                            )}
                            {role === Roles.STUDENT && (
                                <button
                                    onClick={handleRouteChange}
                                    id="academicDetails"
                                    className={`${route.academicDetails
                                        ? "text--gray-700 bg-gray-100"
                                        : "text-gray-400"
                                        } flex items-center text-left hover:bg-gray-100 mt-5 ml-8 mr-8 pt-3 pb-3 pl-10 rounded-md`}
                                >
                                    <AcademicCapIcon
                                        myStyle={"h-5 w-5 mr-3 pointer-events-none"
                                            .concat(" ")
                                            .concat(route.academicDetails && "text-blue-600")}
                                        alt={true}
                                    />
                                    Academics
                                </button>
                            )}
                            {role !== Roles.ADMIN && (
                                <button
                                    onClick={handleRouteChange}
                                    id="chat"
                                    className={`${route.chat ? "text--gray-700 bg-gray-100" : "text-gray-400"
                                        } flex items-center space-x-12 text-left hover:bg-gray-100 mt-5 ml-8 mr-8 pt-3 pb-3 pl-10 rounded-md`}
                                >
                                    <span className="flex items-center pointer-events-none">
                                        <ChatAlt2Icon
                                            alt={true}
                                            myStyle={"h-5 w-5 mr-3 pointer-events-none"
                                                .concat(" ")
                                                .concat(route.chat && "text-blue-600")}
                                        />
                                        Chat
                                    </span>
                                    {newMsgNotify && (
                                        <DotIcon
                                            myStyle={"h-3 w-3 bg-blue-500 rounded-full float-right"}
                                        />
                                    )}
                                </button>
                            )}
                            {role !== Roles.ADMIN && (
                                <button
                                    onClick={handleRouteChange}
                                    id="profile"
                                    className={`${route.profile
                                        ? "text--gray-700 bg-gray-100"
                                        : "text-gray-400"
                                        } flex items-center text-left hover:bg-gray-100 mt-5 ml-8 mr-8 pt-3 pb-3 pl-10 rounded-md`}
                                >
                                    <UserCircleIcon
                                        alt={true}
                                        myStyle={"h-5 w-5 mr-3 pointer-events-none"
                                            .concat(" ")
                                            .concat(route.profile && "text-blue-600")}
                                    />
                                    Profile
                                </button>
                            )}
                            {role === Roles.ADMIN && (
                                <button
                                    onClick={handleRouteChange}
                                    id="logs"
                                    className={`${route.logs ? "text-gray-700 bg-gray-100" : "text-gray-400"
                                        } flex items-center text-left hover:bg-gray-100 mt-5 ml-8 mr-8 pt-3 pb-3 pl-10 rounded-md`}
                                >
                                    <DocumentTextIcon
                                        myStyle={"h-5 w-5 mr-3 pointer-events-none"
                                            .concat(" ")
                                            .concat(route.logs && "text-blue-600")}
                                        alt={true}
                                    />
                                    Logs
                                </button>
                            )}
                            {role === Roles.ADMIN && (
                                <button
                                    onClick={handleRouteChange}
                                    id="importUsers"
                                    className={`${route.importUsers ? "text--gray-700 bg-gray-100" : "text-gray-400"
                                        } flex items-center text-left hover:bg-gray-100 mt-5 ml-8 mr-8 pt-3 pb-3 pl-10 rounded-md`}
                                >
                                    <DocumentTextIcon
                                        myStyle={"h-5 w-5 mr-3 pointer-events-none"
                                            .concat(" ")
                                            .concat(route.importUsers && "text-blue-600")}
                                        alt={true}
                                    />
                                    Import Users
                                </button>
                            )}
                            <button
                                onClick={handleLogout}
                                id="profile"
                                className={`flex items-center text-left hover:bg-red-200 text-gray-800 mt-10  ml-8 mr-8 pt-3 pb-3 pl-10 rounded-md bg-red-100 transition-all`}
                            >
                                <LogoutIcon
                                    myStyle={"h-5 w-5 mr-3 text-red-600 pointer-events-none"}
                                    alt={true}
                                />
                                Logout
                            </button>
                        </nav>
                        <div className="w-17/20 h-screen">
                            <CSSTransition
                                nodeRef={overlayRef}
                                in={showOverlay}
                                timeout={300}
                                classNames="overlay"
                                unmountOnExit
                            >
                                <ModalOverlay nodeRef={overlayRef} />
                            </CSSTransition>
                            <CSSTransition
                                nodeRef={notificationModalRef}
                                in={showNotificationModal}
                                timeout={300}
                                classNames="modal"
                                unmountOnExit
                            >
                                <NotificationModal
                                    nodeRef={notificationDropDownRef}
                                    setShowNotificationModal={setShowNotificationModal}
                                    setShowOverlay={setShowOverlay}
                                    notification={modalContent}
                                />
                            </CSSTransition>
                            <div className="relative w-full h-1/10 bg-white shadow-md flex items-center justify-end">
                                <div className="flex items-center justify-evenly w-1/5">
                                    <div className="relative">
                                        <button
                                            onClick={() => {
                                                setShowNotificationDropDown(
                                                    !showNotificationDropDown
                                                );
                                            }}
                                            className="hover:bg-gray-200 transition-all p-2 rounded-full relative"
                                        >
                                            <BellIcon
                                                myStyle={"h-7 w-7 text-blue-600"}
                                                alt={!showNotificationDropDown}
                                            />
                                            <NotificationCounter />
                                        </button>
                                        <CSSTransition
                                            nodeRef={notificationDropDownRef}
                                            in={showNotificationDropDown}
                                            timeout={300}
                                            classNames="modal"
                                            unmountOnExit
                                        >
                                            <Notification
                                                nodeRef={notificationDropDownRef}
                                                setShowNotificationModal={setShowNotificationModal}
                                                setShowOverlay={setShowOverlay}
                                                setModalContent={setModalContent}
                                            />
                                        </CSSTransition>
                                    </div>

                                    <span className="flex items-center justify-between gap-x-3">
                                        {role === Roles.ADMIN ? (
                                            <>
                                                <img
                                                    src={
                                                        adminData?.avatar?.url === ""
                                                            ? `https://api.dicebear.com/9.x/personas/svg`
                                                            : adminData?.avatar?.url
                                                    }
                                                    alt="avatar"
                                                    className="w-14 h-14 rounded-full"
                                                />
                                                <span>
                                                    <h3>{`${adminData?.firstname || ''} ${adminData?.middlename || ''} ${adminData?.lastname || ''}`}</h3>
                                                    <h6>{`${adminData?.email || ''}`}</h6>
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <img
                                                    src={
                                                        profileData?.avatar?.url === ""
                                                            ? `https://api.dicebear.com/9.x/personas/svg`
                                                            : profileData?.avatar?.url
                                                    }
                                                    alt={`${profileData?.firstname || ''} ${profileData?.lastname || ''}`}
                                                    className="w-14 h-14 rounded-full"
                                                />
                                                <span>
                                                    <h3>{`${profileData?.firstname || ''} ${profileData?.middlename || ''} ${profileData?.lastname || ''}`}</h3>
                                                    <h6>{`${profileData?.email || ''}`}</h6>
                                                </span>
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className={`h-9/10 bg-gray-100 overflow-hidden}`}>
                                {route.importUsers && (
                                    <div className="p-6">
                                        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
                                            <h2 className="text-2xl font-bold mb-4">Import Users from Excel</h2>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Mentor Import Section */}
                                                <div className="border rounded-lg p-4">
                                                    <h3 className="text-lg font-semibold mb-3">Import Mentors</h3>
                                                    <p className="text-gray-600 mb-3">
                                                        Upload an Excel file containing mentor information. The file should have the following columns:
                                                    </p>
                                                    <ul className="list-disc pl-4 mb-4 text-gray-600">
                                                        <li>mentorName</li>
                                                        <li>mentorEmail</li>
                                                        <li>mentorDepartment</li>
                                                    </ul>

                                                    <div className="flex flex-col gap-3">
                                                        <label className="block">
                                                            <span className="sr-only">Choose Excel file for mentors</span>
                                                            <input
                                                                type="file"
                                                                accept=".xlsx,.xls"
                                                                onChange={(e) => handleFileChange(e, 'mentor')}
                                                                className="block w-full text-sm text-gray-500
                                                                    file:mr-4 file:py-2 file:px-4
                                                                    file:rounded-full file:border-0
                                                                    file:text-sm file:font-semibold
                                                                    file:bg-blue-50 file:text-blue-700
                                                                    hover:file:bg-blue-100"
                                                            />
                                                        </label>

                                                        {mentorFile && (
                                                            <p className="text-sm text-gray-600">
                                                                Selected file: {mentorFile.name}
                                                            </p>
                                                        )}

                                                        <button
                                                            onClick={() => handleUpload('mentor')}
                                                            disabled={!mentorFile || uploading}
                                                            className={`px-4 py-2 rounded-md text-white font-medium
                                                                ${!mentorFile || uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                        >
                                                            {uploading ? 'Uploading...' : 'Import Mentors'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Mentee Import Section */}
                                                <div className="border rounded-lg p-4">
                                                    <h3 className="text-lg font-semibold mb-3">Import Mentees</h3>
                                                    <p className="text-gray-600 mb-3">
                                                        Upload an Excel file containing mentee information. The file should have the following columns:
                                                    </p>
                                                    <ul className="list-disc pl-4 mb-4 text-gray-600">
                                                        <li>menteeName</li>
                                                        <li>menteeEmail</li>
                                                        <li>menteeEnrollment</li>
                                                    </ul>

                                                    <div className="flex flex-col gap-3">
                                                        <label className="block">
                                                            <span className="sr-only">Choose Excel file for mentees</span>
                                                            <input
                                                                type="file"
                                                                accept=".xlsx,.xls"
                                                                onChange={(e) => handleFileChange(e, 'mentee')}
                                                                className="block w-full text-sm text-gray-500
                                                                    file:mr-4 file:py-2 file:px-4
                                                                    file:rounded-full file:border-0
                                                                    file:text-sm file:font-semibold
                                                                    file:bg-blue-50 file:text-blue-700
                                                                    hover:file:bg-blue-100"
                                                            />
                                                        </label>

                                                        {menteeFile && (
                                                            <p className="text-sm text-gray-600">
                                                                Selected file: {menteeFile.name}
                                                            </p>
                                                        )}

                                                        <button
                                                            onClick={() => handleUpload('mentee')}
                                                            disabled={!menteeFile || uploading}
                                                            className={`px-4 py-2 rounded-md text-white font-medium
                                                                ${!menteeFile || uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                        >
                                                            {uploading ? 'Uploading...' : 'Import Mentees'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {error && (
                                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
                                                    {error}
                                                </div>
                                            )}

                                            {success && (
                                                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4">
                                                    {success}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {route.post && (
                                    <Post
                                        socket={socket}
                                        streamUpdated={streamUpdated}
                                        setStreamUpdated={setStreamUpdated}
                                    />
                                )}
                                {route.menteeInfo && <MenteeInfo />}
                                {route.chat && <Chat />}
                                {route.profile && profileData && (
                                    <Profile profileData={profileData} />
                                )}
                                {route.academicDetails && <AcademicDetails />}
                                {route.home && (
                                    <Home
                                        name={
                                            profileData !== undefined
                                                ? `${profileData?.firstname} ${profileData?.middlename} ${profileData?.lastname}`
                                                : `${adminData?.firstname} ${adminData?.middlename} ${adminData?.lastname}`
                                        }
                                    />
                                )}
                                {route.manageGroups && <ManageGroups />}
                                {route.logs && <Logs />}
                                {route.meetings && <Meetings />}
                                {route.allInteractions && <AdminInteractions />}
                            </div>
                        </div>
                    </div>
                </authContext.Provider>
            )}
            <ToastContainer limit={5} draggable={false} pauseOnFocusLoss={false} />
        </>
    );
};

export default MentorDashboard;
