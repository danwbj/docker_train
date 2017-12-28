const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
var uuid = require('node-uuid')
const _ = require('lodash');
var SocketEventInit = require('./socket_event.js');
const EVENT_KEYS = require('./event_keys.js');
const config = require('./config')
global.screen = []
global.users =  []
const app = express();

app.use(function (req, res) {
  res.send({ msg: "hello" });
});

const server = http.createServer(app);

/**
 * 验证client端是否被允许加入
 * @param {*} protocol 
 */
let socketVerify = (info) => {
  let protocol = info.req.headers['sec-websocket-protocol']
  switch (protocol) { 
    case 'screen':
      return true  
      break;  
    case 'mobile':  
      console.log('global.screen--',global.screen)  
      return global.screen.length>0  
      break;    
    default:
      return false   
      break;  
  }  
}
const wss = new WebSocket.Server({
  verifyClient: socketVerify,
  server
});



// Broadcast to all screen else.
wss.broadcastOtherScreen = function broadcast(ws, data) {
  wss.clients.forEach(function each(client) {
    if (client !== ws && client.readyState === WebSocket.OPEN && client.protocol == 'screen') {
      client.send(data, function ack(error) {
        if (error) { 
          console.log('error: ', error);
        }
      });
    }
  });
};

// Broadcast to all mobile else.
wss.broadcastOtherMobile = function broadcast(ws, data) {
  wss.clients.forEach(function each(client) {
    if (client !== ws && client.readyState === WebSocket.OPEN && client.protocol == 'mobile') {
      client.send(data, function ack(error) {
        if (error) { 
          console.log('error: ', error);
        }
      });
    }
  });
};

// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data, function ack(error) {
        if (error) { 
          console.log('error: ', error);
        }
      });
    }
  });
};
// Broadcast to everyone else.
wss.broadcastOther = function broadcast(ws,data) {
  wss.clients.forEach(function each(client) {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(data,function ack(error) {
        if (error) { 
          console.log('error: ', error);
        }
      });
    }
  });
};

//监听手机或者大屏关闭事件
let onClientClose = (ws) => {
  //如果有大屏断开，将大屏的id从global.screen中移除
  if (ws.protocol == 'screen') {
    _.remove(global.screen, function(id) {
      return id == ws.id;
    });
    //游戏中途如果所有大屏都断开，则通知手机端，防止大屏已经断开连接，而手机端还可以摇冰块
    if (global.screen.length == 0) { 
      wss.broadcastOtherMobile(ws, JSON.stringify({event:EVENT_KEYS.ALL_SCREEN_CLOSED}))
    }
  }
  //手机断开清除用户参与信息，并广播给大屏
  if (ws.protocol == 'mobile') {
    let u = _.find(global.users, function (u) { return u.ws_id == ws.id; })
    if (u) { 
      _.remove(global.users, function(user) {
        return user.ws_id == ws.id;
      });
      wss.broadcastOtherScreen(ws, JSON.stringify({ event: EVENT_KEYS.MOBILE_LEAVE, data: {openid:u.openid}}))
    }
    
  }
}


function heartbeat() {
  this.isAlive = true;
}
wss.on('connection', function connection(ws, req) {
  //为每一个client手动分配一个id
  ws.id = uuid.v4();
  console.log(ws.protocol+'--'+ws.id,'已连接');
  if (ws.protocol == 'screen') {
    //保存加入的大屏
    global.screen.push(ws.id)
    //给大屏发送所有参与人
    ws.send(JSON.stringify({event:EVENT_KEYS.RECEIVE_USER,data:global.users}))
  }
  ws.isAlive = true;
  ws.on('pong', heartbeat);
  //初始化message监听
  SocketEventInit.init(wss, ws, req)
  
  ws.on('close', function () {
    onClientClose(ws)
    console.log(ws.protocol+'--'+ws.id,'已断开连接');
  });
  ws.on('error', function (e) {
    console.log('error---: ', e);
  });
});

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) { 
      onClientClose(ws)
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping('', false, true);
  });
}, 30000);
server.listen(config.port, function listening() {
  console.log('Listening on %d', server.address().port);
});