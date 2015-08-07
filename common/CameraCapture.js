define(
[
	'happy/_libs/threejs',
	'happy/utils/Vendor',


	'../../common/GlobalGui'
],
function (
	THREE,
	Vendor,

	GlobalGui
){
	"use strict"
	
	var vendor = new Vendor();
	var getUserMedia = vendor.validateMethod('getUserMedia', navigator);

	var CameraCapture = function(){
		var 
		self = this,

		video,
		canvas,
		canvasContext,
		texture,
		cubemap,

		debug;

		var init = function () {
			video = document.createElement('video')
			video.autoplay = true;
			video.width = 640;
			video.height = 480

			canvas = document.createElement('canvas')
			canvas.style.position = 'absolute';
			canvas.width = 512;
			canvas.height = 512;

			canvasContext = canvas.getContext( '2d' );
			canvasContext.translate(canvas.width, 0);
			canvasContext.scale(-1,1)

			texture = new THREE.Texture( canvas );
			texture.minFilter = THREE.LinearFilter;
			texture.magFilter = THREE.LinearFilter;

			/*var path = "src/pisa/";
			var format = '.png';
			var urls = [
					path + 'px' + format, path + 'nx' + format,
					path + 'py' + format, path + 'ny' + format,
					path + 'pz' + format, path + 'nz' + format
				];

			cubemap = THREE.ImageUtils.loadTextureCube( urls );
			cubemap.format = THREE.RGBFormat;*/

			cubemap = new THREE.Texture(  );
			cubemap.image = [];
			for (var i = 0; i < 6; i++) {
				cubemap.image[i] = canvas;
			};

			debug = false;

			getUserMedia({video: true}, onCameraReady, function (error) {
				console.log(error)
			});

			setInterval(function () {
				update();
				draw();
			}, 30);
		}
		var onCameraReady = function(stream){
			if (window.URL){
				video.src = window.URL.createObjectURL(stream);
			} 
			else // Opera
			{
				video.src = stream;
			}

			video.onerror = function(e){
				stream.stop();
			};

			stream.onended = function (error) {
				console.log(error)
			};
		}

		var update = function() {
			if (video.readyState === video.HAVE_ENOUGH_DATA) {
				canvasContext.drawImage( video, 0, 0, canvas.width, canvas.height );
				
				if (texture) texture.needsUpdate = true;
				if(cubemap) cubemap.needsUpdate = true;
			}
	
		}
		var draw = function() {
			if(!debug) return;

		

		}
		
		var getDebug = function() {
			return debug;
		}
		var setDebug = function(value) {
			debug = value;
			if(debug){
				document.body.appendChild(canvas);
			}
			else{
				document.body.removeChild(canvas);
			}
		}
		var getTexture = function(){
			return texture;
		}
		var getCubemap = function(){
			return cubemap;
		}


		init();
		
		Object.defineProperty(self, 'update', {
			value: update
		});
		Object.defineProperty(self, 'draw', {
			value: draw
		});
		Object.defineProperty(self, 'debug', {
			get: getDebug,
			set: setDebug
		});
		Object.defineProperty(self, 'texture', {
			get: getTexture
		});
		Object.defineProperty(self, 'cubemap', {
			get: getCubemap
		});

		
	}
	return CameraCapture;
});