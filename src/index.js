const http = require("http");
const path = require("path");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app); //why we made a raw server ? because socketio(raw_server)  and with express we dont have access to it

const io = socketio(server);

const port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("connection is created with a client");

  socket.on("join", ({ username, room }, callback) => {
    //here we are creating rooms
    const { error, user } = addUser({ id: socket.id, username, room }); //ye accha tarika when function returns it will return either of two

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.emit("message", generateMessage("Admin","Welcome!"));

    socket.broadcast.to(user.room).emit("message", generateMessage(user.username,`${user.username} is joined`));
    
    io.to(user.room).emit("roomData",{
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback();

    //in case of socket .. the functions to send data are socket.emit , io.emit, socket.broadcast.emit
    //in case of rooms .. the server will use function like.. socket.to().emit,io.to().emit, socket.broadcast.to().emit
  });
  
  socket.on("sendmessage", (msg, callback) => {
    const user= getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(msg)) {
      return callback("Profanity is not allowed");
    }
    io.to(user.room).emit("message", generateMessage(user.username,msg));
    callback();
  });

  socket.on("send-location", (data, callback) => {
    const user= getUser(socket.id);
    socket.broadcast.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(user.username,
        `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
      )
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", generateMessage(user.username,`${user.username} has left`));
      io.to(user.room).emit("roomData",{
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  });
});

server.listen(port, () => {
  console.log(`listening at port ${port}`); //${} this only works with backticks
});
