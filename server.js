var express = require('express');
var app = express()
          ,http = require('http')
          ,server = http.createServer(app)
          ,io = require('socket.io').listen(server);

//var io = require('socket.io').listen(app);
//io.set('log level', 2);

//app.listen(process.env['app_port'] || 3000);
server.listen(8080);


app.use("/js", express.static(__dirname + '/js'));
app.use("/css", express.static(__dirname + '/css'));
app.use("/imgs", express.static(__dirname + '/imgs'));
app.get('/', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});

/***********************/
/* Connection Handles  */
/***********************/

function trace(msg) {
    console.log(msg)
}

io.sockets.on('connection', function (socket) {
    
    trace("Client Connected");
    
    switch (io.sockets.clients('room').length) {
        case 0:
            trace("Room empty");
            socket.join('room');
            io.sockets.socket(io.sockets.clients('room')[0]['id']).emit('initiate_peer_1');
            break;
        case 1:
            trace("Room has 2 clients");
            socket.join('room');
            io.sockets.socket(io.sockets.clients('room')[1]['id']).emit('initiate_peer_2');
            break;
        case 2:
            trace("Room is full");
            break;
    }

    socket.on('addIceCandidate_peer_1', function(data) {
         console.log(data);
         io.sockets.socket(io.sockets.clients('room')[0]['id']).emit('addIceCandidate_peer_1', data );
    });
        
    socket.on('addIceCandidate_peer_2', function(data) {
         io.sockets.socket(io.sockets.clients('room')[1]['id']).emit('addIceCandidate_peer_2', data );
    });	

    socket.on('setDescription_peer_2', function(data) {
         io.sockets.socket(io.sockets.clients('room')[1]['id']).emit('setDescription_peer_2', data );
    });
    
    socket.on('setDescription_peer_1', function(data) {
         io.sockets.socket(io.sockets.clients('room')[0]['id']).emit('setDescription_peer_1', data );
    });

    // Handles Disconnection
    socket.on('disconnect', function() {
        socket.leave('room');
    });	
});

    