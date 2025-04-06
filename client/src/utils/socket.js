import { io } from "socket.io-client";

const ENDPOINT = "http://localhost:3000";

// var socket;

// function connectSocket(token) {
//     socket = io(ENDPOINT, {
//         query: { auth: token },
//     });
//     return socket;
// }

// export default connectSocket;

export const connectSocket = (token) => {
    const socket = io(ENDPOINT, {
        query: { auth: token },
    });
    return socket;
}; 