define(
[
	'happy/app/BaseApp',
	'happy/utils/Keyboard',
	'../../common/Socket',
	'../../common/Liquid'
],
function (
	BaseApp,
	Keyboard,
	Socket,
	Liquid
){
	"use strict"
	
	var keyboard = new Keyboard();

	var App = function(){
		var 
		self = this,
		socket,
		beat,
		liquid;

		self.setup = function(){
			//socket = new Socket("ws://192.168.1.20:8000/ws");
			socket = new Socket("ws://echo.websocket.org");
			socket.messageSignal.add(onMessage);

			liquid = new Liquid(self.container);
			window.liquid = liquid; //Global! so we can access from command line
			liquid.setColors({r:0.4, g:0.4, b:0.4}, {r:1.0, g:1.0, b:1.0},0);
			liquid.maxNumPixels = 720 * 480;

		}
		var onMessage = function (data) {
			if(!data) return;
			var value = data.value;
			switch (data.event){
				case "color":
					liquid.setColors(
						value['background_color'],
						value['foreground_color'],
						value['transition_duration']);
					break;
				case "attract":
					liquid.setAttractionPoints(value);
					break;
				case "text":
					liquid.displayText(
						value['heading'],
						value['body'],
						value['time_displayed']
					);
					break;
				case "explode":
					liquid.explode(value);
					break;
				case "sink":
					liquid.setTapMode(value);
					break;
			}
		}
		self.update = function(dt, time){
			liquid.update(dt, time);			
		}
		self.draw = function(dt, time){
			liquid.draw(dt, time);
		}
		self.onKeyUp = function(e){
			var key = keyboard.codeToChar(e.keyCode);
			
			switch(key){
				case "SPACEBAR":
					self.toggleFullscreen();
					break;
				case "H":
					beatDetector.debug = !beatDetector.debug;
					cameraCapture.debug = !cameraCapture.debug;
					break;
				case "1":
					socket.send({event:"color", value: {
						background_color: {r: 1.0, g: 0.0, b:0.0},
						foreground_color: {r: 1.0, g: 1.0, b:0.0},
						transition_duration: 0
					}});
					break
				case "2":
					socket.send({event:"color", value: {
						background_color: {r: 0.0, g: 1.0, b:0.0},
						foreground_color: {r: 0.0, g: 1.0, b:1.0},
						transition_duration: 5
					}});
					break;
				case "E":
					socket.send({ event:"explode", value: 10 });
					break
				case "Q":
					socket.send({ event:"tap", value: true });
					break
				case "W":
					socket.send({ event:"tap", value: false });
					break
				case "T":
					socket.send({ event:"text", value: {heading:"Paulo Barcelos & Magdalena", body:"Let's get this Plutt's party started. äöå", time_displayed: 20 } });
					break
				case "A":
					socket.send({ event:"attract", value: [{x: -1, y: -0.3}]});
					break
				case "S":
					socket.send({ event:"attract", value: [{x: -1, y: -1},{x: 1, y: 0}]});
					break
				case "D":
					socket.send({ event:"attract", value: [{x: -0, y: 0.5},{x: 1, y: 0},{x: -1, y: -0.5}]});
					break
				case "F":
					socket.send({ event:"attract", value: []});
					break
			}

		}
		self.onResize = function(size){	
			liquid.onResize(size);
		}
	}
	App.prototype = new BaseApp();
	return App;
});