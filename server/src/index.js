const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
const { Server } = require("socket.io");
const socket = require("./socket/socket");
const dotenv = require("dotenv");
const Chat = require("./models/Chat");

// middlewares
const { rateLimiter } = require("./middlewares/rateLimiter");

// mongoose config
require("./config/mongoose");
//env config
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Create necessary directories if they don't exist
const directories = [
    path.join(__dirname, '../public'),
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../logs')
];

directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Allows cross-origin requests
app.use(cors());
// Parse JSON bodies (as sent by API clients)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", true);
app.set("view engine", "hbs");
/** server HTTP request logging
 * :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"
 * */
//logging HTTP requests to logs/access.log file
// app.use(
//     morgan("combined", {
//         stream: fs.createWriteStream("./logs/access.log", { flags: "a" }),
//     })
// );

// app.use(rateLimiter);

// logging to console
app.use(morgan("dev"));

// define paths for express config
const publicDirPath = path.join(__dirname, '../public');
const uploadsDirPath = path.join(__dirname, '../uploads');

// serving public assets
app.use(express.static(publicDirPath));
app.use('/uploads', express.static(uploadsDirPath));

// importing routes
const adminRoutes = require("./routes/admin");
const mentorRoutes = require("./routes/mentor");
const studentRoutes = require("./routes/student");
const indexRoutes = require("./routes/index");
const postRoutes = require("./routes/post");
const chatRoutes = require("./routes/chat");
const messageRoutes = require("./routes/message");
const notificationRoutes = require("./routes/notification");
const meetingRoutes = require("./routes/meeting");

// setting routes
app.use("/", indexRoutes);
app.use("/admin", adminRoutes);
app.use("/mentor", mentorRoutes);
app.use("/student", studentRoutes);
app.use("/posts", postRoutes);
app.use("/chats", chatRoutes);
app.use("/messages", messageRoutes);
app.use("/notifications", notificationRoutes);
app.use("/meetings", meetingRoutes);

// route for 404 not found page
// app.get("*", (req, res) => {
//     res.render("notFound");
// })

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const server = app.listen(PORT, () => console.log(`server running on port ${PORT}`));

const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: "*",
    },
});

global.msgSocketMap = {};
global.notifySocketMap = {};

// socket connection start
socket.start(io);

// crons
require("./crons/interaction.cron");