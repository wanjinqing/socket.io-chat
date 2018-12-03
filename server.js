var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {};

var chatServer = require('./lib/chat_server');

// 提供静态http文件服务
function send404(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
  response.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");

  response.writeHead(404, { 'Content-Type': 'text/plain' });
  response.write('Error 404: resource not found');
  response.end();
}
function sendFile(response, filePath, fileContents) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
  response.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");

  response.writeHead(200, { 'Content-Type': mime.lookup(path.basename(filePath)) });
  response.end(fileContents);
}
function serverStatic(response, cache, absPath) {
  if (cache[absPath]) {
    sendFile(response, absPath, cache[absPath]);
  } else {
    fs.exists(absPath, function (exists) {
      if (exists) {
        fs.readFile(absPath, function (err, data) {
          if (err) {
            send404(response);
          } else {
            cache[absPath] = data;
            sendFile(response, absPath, data);
          }
        })
      } else {
        send404(response);
      }
    })
  }
}
var server = http.createServer(function (request, response) {
  var filePath = false;
  if (request.url == '/') {
    filePath = 'public/index.html';
  } else {
    filePath = 'public' + request.url;
  }
  var absPath = './' + filePath;
  serverStatic(response, cache, absPath);
})
server.listen(3000, function () {
  console.log('Server listening on port 3000');
})


// 跟http服务器共享一个TCP/IP端口
chatServer.listen(server);

