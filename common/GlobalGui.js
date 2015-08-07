define(
[
	'happy/_libs/datgui',
	'text!settings.json'
],
function (
	GUI,
	settings
){
	"use strict";

	var Data = function(gui){
		var self = this,
		folders = {},
		callbacks = {},
		callbacksCallbacks = {};

		gui.remember(self);
		
		self.add = function(folderName, name, original, min, max, step){
			if(!folders[folderName]) self.folder(folderName);

			var controller;
			if(typeof min === 'undefined' || typeof max === 'undefined'){
				controller = folders[folderName].add(self, self.property(name, original));
			}
			else {
				controller = folders[folderName].add(self, self.property(name, original), min, max);
			}
			if(typeof step !== 'undefined') controller.step(step);

			self.registerController(controller, name);
			
		}
		self.addColor = function(folderName, name, original){
			if(!folders[folderName]) self.folder(folderName);
			var controller = folders[folderName].addColor(self, self.property(name, original));
			self.registerController(controller, name);
		}
		self.registerController = function(controller, name){
			if(!callbacks[name]) callbacks[name] = function(value){
				for (var i = 0; i < callbacksCallbacks[name].length; i++) {
					callbacksCallbacks[name][i].call(this, value);
				};
			}
			if(!callbacksCallbacks[name]) callbacksCallbacks[name] = [];
			controller.onChange(callbacks[name]);
		}
		self.addCallback = function(name, callback){
			if(!callbacksCallbacks[name]) callbacksCallbacks[name] = [];
			callbacksCallbacks[name].push(callback);
		}

		self.property = function(name, value){
			self[name] = value;
			return name;
		}
		self.folder = function(name){
			folders[name] = gui.addFolder(name);
			return folders[name];
		}
		
	}
	var gui = new GUI({
		load: JSON.parse(settings),
		preset: 'Default'
	});

	GUI.toggleHide();
	var data = new Data(gui);

	data.add('Center Attraction', 'Center Attraction Amount', 0.2, 0, 1);
	data.add('Center Attraction', 'Center Attraction Max Radius', 0.5, 0, 1);
	
	data.add('Center Repulsion', 'Center Repulsion Amount', 0.20, 0, 1);
	data.add('Center Repulsion', 'Center Repulsion Max Radius', 1., 0, 3);

	data.add('Attraction Points', 'Attraction Points Amount',  1.7, 0, 3);
	data.add('Attraction Points', 'Attraction Points Max Radius', 3.0, 0, 7.0);

	data.add('Spinning', 'Low Spinning Amount', 1.5, 0, 3);
	data.add('Spinning', 'High Spinning Amount', 1.5, 0, 3);

	data.add('Deformation', 'Deformation Frequency',  10.0, 0.0, 50.0);
	data.add('Deformation', 'Deformation Amount',  0.4, 0.0, 1.0);

	data.add('Audio', 'Bass Filter Frequency', 68, 0, 10000);
	data.add('Audio', 'Bass Filter Q', 99, 0, 1000);
	data.add('Audio', 'Bass Filter Gain', 9.9, -40, 40);

	data.add('Audio', 'Treble Filter Frequency', 7720, 0, 10000);
	data.add('Audio', 'Treble Filter Q', 99, 0, 1000);
	data.add('Audio', 'Treble Filter Gain', 9, -40, 40);

	
	
	return data;
});