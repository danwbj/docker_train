const _ = require('lodash');
const EVENT_KEYS = require('./event_keys.js');

/**
 * 处理mobile接入请求,并通知screen端
 * @param {*} wss 
 * @param {*} ws 
 * @param {*mobile发送的消息} message 
 */
let on_join = (wss, ws, message) => {
    try {
        let exist = _.find(global.users, function (u) { return u.openid == message.data.openid; })
        if (!exist) {
            message.data.ws_id = ws.id
            global.users.push(message.data)
        }
        wss.broadcastOther(ws, JSON.stringify({event:EVENT_KEYS.RECEIVE_USER,data:global.users}))
        ws.send(JSON.stringify({event:EVENT_KEYS.JOIN_STATUS,status:1,message:'加入成功'})) 
        
    } catch (err) {
        ws.send(JSON.stringify({event:EVENT_KEYS.JOIN_STATUS,status:0,message:'加入失败'}))
    }
    
}
/**
 * 处理mobile摇冰块事件，并通知screen
 * @param {*} wss 
 * @param {*} ws 
 * @param {*} message 
 */
let on_rock = (wss, ws, message) => {
    try {
        //记录每个用户摇的冰块数目
        global.users.map(item => {
            if (item.openid == message.data.openid) {
                if (item.icenum) {
                    item.icenum++
                } else {
                    item.icenum = 1
                }
            }
        })
        //通知screen，发送冰块信息
        wss.broadcastOther(ws, JSON.stringify({ event: EVENT_KEYS.RECEIVE_ICE, data: message.data }))
        ws.send(JSON.stringify({ event: EVENT_KEYS.ROCK_STATUS, status: 1, message: '成功!' }))
    } catch (err) {
        ws.send(JSON.stringify({ event: EVENT_KEYS.ROCK_STATUS, status: 0, message: '出错！' }))
    }
    
}
/**
 * 处理用户一分钟游戏结束事件
 * @param {*} wss 
 * @param {*} ws 
 * @param {*} message 
 */
let on_time_end = (wss, ws, message) => {
    _.remove(global.users, function (u) {
        return u.openid == message.data.openid;
    });
    message.data.users = global.users
    wss.broadcastOtherScreen(ws, JSON.stringify(message))
}
/**
 * 处理大屏发过来的用户一局分数，通知手机端
 * @param {*} wss 
 * @param {*} ws 
 * @param {*} message 
 */
let time_end_result = (wss, ws, message) => {
    //通知手机端游戏结果
    console.log('通知手机端游戏结果-------------',JSON.stringify(message))
    wss.broadcastOtherMobile(ws,JSON.stringify(message))
}
/**
 * 处理screen游戏重置事件
 * @param {*} wss 
 * @param {*} ws 
 * @param {*} message 
 */
let reset = (wss, ws, message) => {
    console.log('reset----')
    try {
        //推送游戏所有参与人
        wss.broadcastOther(ws, JSON.stringify(message))
        //置空游戏参与人
        global.users = []
        ws.send(JSON.stringify({event:EVENT_KEYS.RESET_STATUS,status:1,message:'重置成功'}))
    } catch (err) {
        ws.send(JSON.stringify({event:EVENT_KEYS.RESET_STATUS,status:0,message:'重置失败'}))
    }
    
}
let init = function (wss,ws, req) {
    ws.on('message', function incoming(message) {
        message = JSON.parse(message)
        switch (message.event) {
            case 'join':
                on_join(wss,ws,message) 
                break;    
            case 'rock':
                on_rock(wss,ws,message) 
                break;    
            case 'reset':
                reset(wss, ws, message) 
                break;
            case 'time_end':
                on_time_end(wss, ws, message) 
                break;
            case 'time_end_result':
                time_end_result(wss,ws,message)
                break;    
            default : break;     
        }
    });
};
module.exports = {
    init: init
}