/**
 *  This middleware is used to check if the user has been assigned any mentor or not.
 *  If mentor is not assigned it blocks the request and responds the user with a error response.
 *
 *  It is used in the post module to ensure that only students which have been assigned any mentor can only
 *  have access to features like creating a post, editing, commenting on post, etc.
 *  Refer to the post module.
 *
 */

const roles = require("../utils/roles");
const response = require("../utils/responses.utils");

const groupChecker = async (req, res, next) => {
    try {
        if (req.user.role === roles.Student && (!req.user.mentoredBy || req.user.mentoredBy.length === 0)) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to any mentor group",
            });
        }
        next();
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = groupChecker;
