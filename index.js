var history=[];//chat history
var userList=[]; //current user list
let name=''; //nickname
let time;
let color;
let maxLen=200; // history length
let newName='';
let i=0;

// inspired by code on https://socket.io/get-started/chat
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});  

io.on('connection', (socket) => {
    console.log('a user connected'); 
    socket.on('disconnect', () => {
      console.log('user disconnected');
      userList=[];
      io.emit('getUserNames');
      console.log('user disconnected');
    });
});
  
server.listen(3000, () => {
  console.log('listening on *:3000');
});
// end of inspired code

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        let t=new Date(); //get current time
        //set hour, minutes, seconds to 2 digits number
        let m=t.getMinutes().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
        let s=t.getSeconds().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
        if(t.getHours()>12){ //add pm to time
            let h=t.getHours().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
            time=h + ':' + m+ ':' + s+' pm';
        }else{ //add am to time
            let h=t.getHours().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
            //console.log(h);
            time=h + ':' + m+ ':' + s+' am';
        }
        let arr=msg.split('!@#$'); // split to get user name, color, text message
        let message={time:time,name:arr[0].split(',')[0], color:arr[0].split(',')[1],msg:arr[1]};
        if(history.length<maxLen){
            history.push(message)
        }else{
            history.shift();
            history.push(message);
        }
        //console.log(history);
        io.emit('chat message', message);
    });
});

io.on('connection', (socket) => {
    socket.on('nickname', (msg) => {
        // make sure unique name
        if(userList.indexOf(msg)==-1 && msg.trim()!=''){   
            name=msg;
        }else{
            name="User"+i;
            i++;
        }
        userList.push(name);
        //console.log(userList);
        io.to(socket.id).emit('historyM',history);   
        io.emit('system message',name+' entered the chat room.');
        io.emit('updateUser',userList);
        io.to(socket.id).emit('changeName',name);
        //console.log(name+ "1");
    }); 
});

// get color and send message history to user
io.on('connection', (socket) => {
    socket.on('color', (msg) => {  
        color=msg;
    });  
});


// send all user name to server then update user list
io.on('connection', (socket) => {
    socket.on('sendName', (msg) => {  
        userList.push(msg);
        io.emit('updateUser',userList);
    });   
});

// change name
io.on('connection', (socket) => {
    socket.on('changeName', (msg) => { 
        if(userList.indexOf(msg.split(',')[0])==-1 && msg.split(',')[0].trim()!=''){  //change name if unique new name
            newName=msg.split(',')[0];
            name=msg.split(',')[1];
            let index=userList.indexOf(name); // postion of changed name
            userList.splice(index,1,newName);// remove the old name and insert new name
            io.emit('updateUser',userList);
            io.to(socket.id).emit('changeName',newName);
            io.to(socket.id).emit('system message','Your new name is '+newName);
        }else{ //send error message to user
            io.to(socket.id).emit('system message','Failed to change name, please try another name.');
        }
    });   
});


