
var express = require('express');
var app     = express();
var jade    = require('jade');

//View engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set("view options", { layout: false });

app.use(express.static(__dirname + '/public'));

var http   = require('http'),
    server = http.createServer(app).listen(3000, function(){console.log('listening to port: 3000\n');}),
    io     = require('socket.io').listen(server);


require('./routes/main')({app:app, io:io});