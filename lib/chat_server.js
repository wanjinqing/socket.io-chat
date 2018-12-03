var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};
/*
    // 使用socket.io的api:
    var io = socketio.listen(server);
    io.set('log level', 1);
    io.sockets.on('connection', function (socket) {
        socket.id;
        socket.join('roomName');
        socket.emit('listenName', params);
        socket.on('listenName', function () {});
        socket.broadcast.to('roomName').emit('listenName', function () {})
        socket.leave('roomName');
        socket.on('disconnect', function () {});
    })
    io.sockets.manager.rooms;
    io.sockets.clients(roomName);
 */



// exports.listen = function (server) {
//   io = socketio.listen(server);
  
// }

exports.listen = function (server) {
  io = socketio.listen(server);
  
  io.set('transports', ['websocket', 'xhr-polling', 'jsonp-polling', 'htmlfile', 'flashsocket']);
  io.set('origins', '*:*');

  // 0为error，1为warn，2为info，3为debug
  io.set('log level', 1);
  io.sockets.on('connection', function (socket) {
    // 为用户分配一个名称
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

    // 将用户加入到Lobby聊天室里
    joinRoom(socket, 'Lobby');

    // 处理用户的消息，更名，以及聊天室的创建和变更
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);

    // 用户发送请求时，向其提供已经被占用的聊天室的列表
    socket.on('rooms', function () {
      socket.emit('rooms', io.sockets.manager.rooms);
    })

    // 用户断开连接后的清楚逻辑
    handleClientDisconnection(socket, nickNames, namesUsed);
  })
}

// 为用户分配一个名称
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  var name = 'Guest' + guestNumber;
  nickNames[socket.id] = name;
  socket.emit('nameResult', {
    success: true,
    name: name
  })
  namesUsed.push(name);
  return guestNumber + 1;
}

// 用户加入房间
function joinRoom(socket, room) {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit('joinResult', { room: room });
  // 通知其他用户
  socket.broadcast.to(room).emit('message', {
    text: nickNames[socket.id] + ' has joined ' + room + '.'
  })

  // 在该房间里的所有用户
  var usersInRoom = io.sockets.clients(room);
  // 至少两个用户
  if (usersInRoom.length > 1) {
    var usersInRoomSummary = 'Users currently in ' + room + ': ';
    for (var index in usersInRoom) {
      //index: 0, 1
      var userSocketId = usersInRoom[index].id;
      // 过滤自身
      if (userSocketId != socket.id) {
        if (index > 0) {
          usersInRoomSummary += ', ';
        }
        // 只保存其他用户
        usersInRoomSummary += nickNames[userSocketId];
      }
    }
    usersInRoomSummary += '.';
    // 显示已在该房间用户
    socket.emit('message', { text: usersInRoomSummary });
  }

}

// 更换房间名
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', function (name) {
    if (name.indexOf('Guest') == 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with "Guest".'
      })
    } else {
      if (namesUsed.indexOf(name) == -1) {
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf(previousName);
        namesUsed.push(name);
        nickNames[socket.id] = name;
        delete namesUsed[previousNameIndex];
        socket.emit('nameResult', {
          success: true,
          name: name
        });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: previousName + ' is now known as ' + name + '.'
        });
      } else {
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use.'
        });
      }
    }
  })
}

// 监听客户端发送过来的消息，并且广播给其他的客户端
function handleMessageBroadcasting(socket, nickNames) {
  socket.on('message', function (message) {
    socket.broadcast.to(message.room).emit('message', {
      text: nickNames[socket.id] + ': ' + message.text
    });
  })
}

// 用户切换房间
function handleRoomJoining(socket) {
  socket.on('join', function (room) {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  })
}

// 用户离开房间
function handleClientDisconnection(socket, nickNames, namesUsed) {
  socket.on('disconnect', function () {
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  })
}
