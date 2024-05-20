const path = require("path");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const {
  addUser,
  removeUser,
  getUser,
  getUserInRoom,
} = require("./utils/users");

const port = 3000 || process.env.PORT;
const directPath = path.join(__dirname, "../public");
const {
  generateMessages,
  generateLocationMessage,
} = require("./utils/messages");

app.use(express.static(directPath));

io.on("connection", (socket) => {
  console.log("New Websoket connected");

  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.emit("message", generateMessages("Admin", "Welcome!")); //بتبعت رساله لشخص محدد

    socket.broadcast
      .to(user.room)
      .emit("message", generateMessages(`${user.username} has joined!`));
    //بتبعت رساله لكل الاشخاص ما عدا اللي عمل الحدث
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUserInRoom(user.room),
    });
    callback();
  });

  socket.on("SendMessage", (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback("this massega is bad word");
    }

    io.to(user.room).emit("message", generateMessages(user.username, message)); //بتبعت رساله لكل الاشخاص
    callback();
  });

  socket.on("SendLocation", (coords, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit(
      "locationmessage",
      generateLocationMessage(
        user.username,
        `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessages(`${user.username} has left`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUserInRoom(user.room),
      });
    }
  });

  /*
  socket.emit("countUpdated", count);
  socket.on("increment", () => {
    count++;
    //socket.emit("countUpdated", count);
    io.emit("countUpdated", count);
  });
  */
});

server.listen(port, () => console.log(`connected to server ${port}`));
