var socket = io.connect('http://localhost:9000');
var sendChannel,receiveChannel;

socket.on('initiate_peer_1', function(desc) {
    document.write("<h1>Send Channel</h1><button onclick='doCall()' type='button'>Start Call!</button><button onclick='checkStatus()' type='button'>Check Status</button>");
    createPeerConnection_pc1();
});

socket.on('initiate_peer_2', function(desc) {
    document.write("<h1>Receive Channel</h1>");
    createPeerConnection_pc2();
});

socket.on('addIceCandidate_peer_1', function(callback) {
    var remoteCandidate =  new RTCIceCandidate({ 'candidate' : callback.candidate, 'sdpMid' : callback.sdpMid, 'sdpMLineIndex' : callback.sdpMLineIndex });
    pc1.addIceCandidate(remoteCandidate);
});
    
socket.on('addIceCandidate_peer_2', function(callback) {
    var remoteCandidate =  new RTCIceCandidate({ 'candidate' : callback.candidate, 'sdpMid' : callback.sdpMid, 'sdpMLineIndex' : callback.sdpMLineIndex });
    pc2.addIceCandidate(remoteCandidate);
});

socket.on('setDescription_peer_2', function(callback) {
    trace('Offer from pc1 \n');
    var sessionDescription =  new RTCSessionDescription({ 'sdp' : callback.sdp, 'type' : callback.type });
    pc2.setRemoteDescription(sessionDescription);
    pc2.createAnswer(gotDescription2);    
});

socket.on('setDescription_peer_1', function(callback) {
    trace('Answer from pc2 \n');
    var sessionDescription =  new RTCSessionDescription({ 'sdp' : callback.sdp, 'type' : callback.type });
    pc1.setRemoteDescription(sessionDescription);
});

/***********************/
/*  Peer Connection    */
/***********************/

function checkStatus() {
    console.debug(sendChannel.readyState);
    if(sendChannel.readyState) {
        setInterval(function() {
            sendChannel.send("data");
        },100);
        
    }
}

function doCall() {
    pc1.createOffer(gotDescription1);
}
function createPeerConnection_pc1() {
    var servers = null;
    window.pc1 = new webkitRTCPeerConnection(servers, {optional: [{RtpDataChannels: true} ]});
    trace('Created local peer connection object pc 1');

    try {
      sendChannel = pc1.createDataChannel("sendDataChannel", {reliable: false});
      trace('Created send data channel');
    } catch (e) {
      alert('Failed to create data channel');
      trace('Create Data channel failed with exception: ' + e.message);
    }
    
    pc1.onicecandidate = iceCallback1;
    sendChannel.onopen = onSendChannelStateChange;
}

function createPeerConnection_pc2() {
    var servers = null;
    window.pc2 = new webkitRTCPeerConnection(servers, {optional: [{RtpDataChannels: true} ]});
    trace('Created remote peer connection object pc2');
    
    pc2.ondatachannel = receiveChannelCallback;    
    pc2.onicecandidate = iceCallback2;
}

function gotDescription1(desc) {
  pc1.setLocalDescription(desc);
  trace('Set local description and emit to peer 2.... \n');
  
  socket.emit('setDescription_peer_2', desc);  
  //pc2.setRemoteDescription(desc);
  //pc2.createAnswer(gotDescription2);
}

function gotDescription2(desc) {
  pc2.setLocalDescription(desc);
  socket.emit('setDescription_peer_1',desc);
  //pc1.setRemoteDescription(desc);
}

function iceCallback1(event) {
  trace('local ice callback');
  if (event.candidate) {
    socket.emit('addIceCandidate_peer_2',  event.candidate );
    trace('Local ICE candidate: \n' + event.candidate.candidate);
  }
}

function iceCallback2(event) {
  trace('remote ice callback');
  if (event.candidate) {
    socket.emit('addIceCandidate_peer_1', event.candidate );
    trace('Remote ICE candidate: \n ' + event.candidate.candidate);
  }
}

function onSendChannelStateChange() {
    alert("send channel open",sendChannel.readyState);
}

function onReceiveChannelStateChange() {
    alert("receive channel open",receiveChannel.readyState);
}

function receiveChannelCallback(event) {
  trace('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onmessage = onReceiveMessageCallback;
}

function onReceiveMessageCallback(event) {
  trace('Received Message');
  document.write(event.data);
}

function trace(text) {
  // This function is used for logging.
  if (text[text.length - 1] == '\n') {
    text = text.substring(0, text.length - 1);
  }
  console.log((performance.now() / 1000).toFixed(3) + ": " + text);
}
