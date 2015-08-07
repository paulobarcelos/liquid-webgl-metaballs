define(
[
	'happy/app/BaseApp',
	'happy/utils/Keyboard',
	'../../common/BeatDetector',
	'../../common/Socket',
	'../../common/Liquid'
],
function (
	BaseApp,
	Keyboard,
	BeatDetector,
	Socket,
	Liquid
){
	"use strict"
	
	var keyboard = new Keyboard();

	var App = function(){
		var 
		self = this,
		socket,
		beatDetector,
		beat,
		liquid;

		self.setup = function(){
			//socket = new Socket("ws://192.168.1.23:8000/ws");
			socket = new Socket("ws://echo.websocket.org");
			socket.messageSignal.add(onMessage);

			beatDetector = new BeatDetector();

			liquid = new Liquid(self.container);
			window.liquid = liquid; //Global! so we can access from command line
		}
		var onMessage = function (data) {
			if(!data) return;
			var value = data.value;
			
			switch (data.event){
				case "color":
				//console.log(value['background_color'].r,value['background_color'].g,value['background_color'].b)
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
				case "tap":
					liquid.setTapMode(value);
					break;
			}
		}
		self.update = function(dt, time){
			liquid.setBeatLevel(beatDetector.bassBeat, beatDetector.trebleBeat);
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
						background_color: {r: 184/255, g: 221/255, b:225/255},
						foreground_color: {r: 245/255, g: 224/255, b:207/255},
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
					socket.send({ event:"text", value: {heading:"protothon", body:"This awesome #LiquidData silk scarf goes pretty well with the leggings...See them in action this weekend at Atelier!", time_displayed: 3 } });
					break
				case "A":
					socket.send({ event:"attract", value: [{x: -1, y: -0.5}]});
					break
				case "S":
					socket.send({ event:"attract", value: [{x: 1, y: -0.5}]});
					break
				case "D":
					socket.send({ event:"attract", value: [{x: -1, y: 0.5}]});
					break
				case "F":
					socket.send({ event:"attract", value: [{x: 1, y: 0.5}]});
					break
				case "G":
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