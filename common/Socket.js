define(
[
	'happy/_libs/signals'
],
function (
	Signal
){

	var Socket = function(address, subProtocols){
		var 
		self = this,
		websocket,
		messageSignal = new Signal(),
		retries = 0,
		retryTimer,
		monitorTimer;


		var connect = function () {
			if (!websocket || websocket.readyState === undefined || websocket.readyState > 1) {
				websocket = new WebSocket(address, subProtocols);
				websocket.onopen = onOpen;
				websocket.onmessage = onMessage;
				websocket.onclose = onClose;
				websocket.onerror = onError;
			}
		}
		var onOpen = function (e) {
			console.log("Socket open:   ", e);
		}
		var onMessage = function (message) {
			//console.log("Socket message:" + message);
			var data;
			try { data = JSON.parse(message.data); }
			catch(e) { console.log(e); }
			messageSignal.dispatch(data);
		}
		var onClose = function (e) {
			console.log("Socket close:  ", e);
			retry();
		}
		var onError = function (e) {
			console.log("Socket error:  ", e);
			retry();
		}
		var retry = function () {
			clearTimeout(retryTimer);
			retryTimer = setTimeout(connect, 1000);
		}
		var monitor = function (argument) {
			clearTimeout(monitorTimer);
			setTimeout(monitor, 5000);
			clearTimeout(retryTimer);
			connect();
		}
		var send = function (data) {
			if(websocket.readyState == 1){
				websocket.send(JSON.stringify(data))
			}
		}
		monitor();

		var getMessageSignal = function () {
			return messageSignal;
		}

		Object.defineProperty(self, 'send', {
			value: send
		});
		Object.defineProperty(self, 'messageSignal', {
			get: getMessageSignal
		});
		
	}
	return Socket;
});