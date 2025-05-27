const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const users = {}; // phoneNumber => { name, socketId, room }

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ name, phoneNumber, room }) => {
    users[phoneNumber] = { name, socketId: socket.id, room };
    socket.join(room);
    socket.to(room).emit("message", {
      sender: "System",
      text: `${name} has joined the room.`,
    });
  });

  socket.on("chatMessage", ({ phoneNumber, message }) => {
    const user = users[phoneNumber];
    if (user) {
      io.to(user.room).emit("message", {
        sender: user.name,
        text: message,
      });
    }
  });

  socket.on("disconnect", () => {
    for (const phone in users) {
      if (users[phone].socketId === socket.id) {
        const user = users[phone];
        io.to(user.room).emit("message", {
          sender: "System",
          text: `${user.name} has left the room.`,
        });
        delete users[phone];
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
