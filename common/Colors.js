define(
[
	'happy/_libs/threejs'
],
function (
	THREE
){

	"use strict"

	var Color = function (argument) {
		this.object = new THREE.Vector3(0.0, 0.26, 0.76);
		this.background = new THREE.Vector3(1,1,1);
		this.baseLight = new THREE.Vector3(1,1,1);
		this.spotLight = new THREE.Vector3(1,1,1);
		this.spot2Light = new THREE.Vector3(1,1,1);
		this.clone = function(){
			var color = new Color();
			color.object = this.object.clone();
			color.background = this.background.clone();
			color.baseLight = this.baseLight.clone();
			color.spotLight = this.spotLight.clone();
			color.spot2Light = this.spot2Light.clone();
			return color;
		}
		return this;
	}

	var Colors = function(options){
		var 
		self = this,
		current,
		target,
		transtionDuration;
		
		var init = function(){
			current = new Color();
			target = current.clone();
			transtionDuration = 1;
		}
		
		var lerp = function(a, b, percent){
			return a * percent + b * (1 - percent);
		}
		var lerpColor = function(colorA, colorB, percent){
			colorA.x = lerp(colorA.x, colorB.x, percent);
			colorA.y = lerp(colorA.y, colorB.y, percent);
			colorA.z = lerp(colorA.z, colorB.z, percent);
		}
		var mixColors = function(mix, colorA, colorB, percent){
			mix.x = lerp(colorA.x, colorB.x, percent);
			mix.y = lerp(colorA.y, colorB.y, percent);
			mix.z = lerp(colorA.z, colorB.z, percent);
		}
		var update = function(dt, time) {
			var blendFactor;
			if(transtionDuration && transtionDuration > dt) blendFactor = 1.0 - 1.0 / (transtionDuration / dt);
			else blendFactor = 0.0;

			lerpColor(current.object, target.object, blendFactor);
			lerpColor(current.background, target.background, blendFactor);
			lerpColor(current.baseLight, target.baseLight, blendFactor);
			lerpColor(current.spotLight, target.spotLight, blendFactor);
			lerpColor(current.spot2Light, target.spot2Light, blendFactor);			
		}
		var getComputed = function(){
			return current;
		}

		var transition = function(color, duration) {
			target = current.clone();
			
			if(color.object) target.object = color.object;
			if(color.background) target.background = color.background;
			if(color.baseLight) target.baseLight = color.baseLight;
			if(color.spotLight) target.spotLight = color.spotLight;
			if(color.spot2Light) target.spot2Light = color.spot2Light;
			transtionDuration = duration;
		}

		init();
	
		Object.defineProperty(self, 'update', {
			value: update
		});
		Object.defineProperty(self, 'transition', {
			value: transition
		});
		Object.defineProperty(self, 'computed', {
			get: getComputed
		});

	}

	return Colors;
});