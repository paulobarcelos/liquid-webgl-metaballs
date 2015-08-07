define(
[
	'happy/app/BaseApp',
	'happy/utils/Keyboard',
	'../../common/CameraCapture',
	'../../common/Socket',
	'../../common/Liquid'
],
function (
	BaseApp,
	Keyboard,
	CameraCapture,
	Socket,
	Liquid
){
	"use strict"
	
	var keyboard = new Keyboard();

	var App = function(){
		var 
		self = this,
		socket,
		cameraCapture,
		beat,
		liquid;

		self.setup = function(){
			//socket = new Socket("ws://192.168.1.20:8000/ws");
			socket = new Socket("ws://echo.websocket.org");
			socket.messageSignal.add(onMessage);

			cameraCapture = new CameraCapture();

			liquid = new Liquid(self.container);
			window.liquid = liquid; //Global! so we can access from command line

			liquid.setColors({r:1.0, g:1.0, b:1.0}, {r:1.0, g:1.0, b:1.0},0);

			setInterval(function(){
				liquid.explode(5);
			}, 60000)
			liquid.explode(5);
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
				/*case "beat":
					liquid.setBeatLevel(value);
					break;*/
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
			liquid.setTexture(cameraCapture.texture, cameraCapture.cubemap);
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
					cameraCapture.debug = !cameraCapture.debug;
					break;
			}

		}
		self.onResize = function(size){	
			liquid.onResize(size);
		}
	}
	App.prototype = new BaseApp();
	return App;
});