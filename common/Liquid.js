define(
[
	'happy/_libs/mout/math/clamp',
	'happy/_libs/mout/math/lerp',
	'happy/_libs/threejs',

	'worker!../../common/Simulation.js',

	'../../common/GlobalGui',
	'../../common/Colors',

	'../../common/EffectComposer',
	'../../common/Shader'
],
function (
	clamp,
	lerp,
	THREE,

	Simulation,

	GlobalGui,
	Colors,

	EffectComposer,
	Shader
){

	"use strict"


	var CAMERA_FAR = -2.7;
	var CAMERA_CLOSE = -1;

	var Liquid = function(container){
		var 
		self = this,

		renderer,
		textContainer,

		composer,
		shader,
		maxNumPixels,
		screenSize,

		colors,
		attractionPoints,
		bassBeatLevel,
		trebleBeatLevel,
		tapMode,
		doAttraction,
		doRepulsion,
		cameraPosition,
		texture,
		cubemap,

		textTimer,
		explodeTimer,
		tapTimer;
		
		var init = function(){
			renderer = new THREE.WebGLRenderer({
				preserveDrawingBuffer: true,
				precision: 'lowp'
			});
			renderer.autoClear = false;

			renderer.domElement.style.position = 'absolute';
			renderer.domElement.style.top = '0';
			renderer.domElement.style.left = '0';
			renderer.domElement.style.transformOrigin = '0 0 0';
			renderer.domElement.style.webkitTransformOrigin = '0 0 0';

			container.appendChild(renderer.domElement);

			textContainer = document.createElement('div');
			textContainer.id = "text";

			container.appendChild(textContainer);

			composer = new EffectComposer( renderer );
			shader = composer.createShaderPass( Shader );
			shader.renderToScreen = true;
			composer.addPass( shader );

			maxNumPixels = 1280 * 720;

			colors = new Colors();
			attractionPoints = [];
			bassBeatLevel = 0;
			trebleBeatLevel = 0;
			doAttraction = true;
			doRepulsion = false;
			tapMode = 'OFF';
			cameraPosition = new THREE.Vector3(
				0.0,
				0.0,
				CAMERA_FAR
			);

				

			for (var i = 0; i < 20; i++) {
				
				shader.uniforms.metaballs.value[i].x = 0;
				shader.uniforms.metaballs.value[i].y = 0;
				shader.uniforms.metaballs.value[i].z = 0;
				shader.uniforms.metaballs.value[i].w = 0.5;
			}
		}

		var update = function(dt, time) {
			var cameraPositionUniform;
			
			// Simulation -------------------------------------------------
			if(dt < 0.7){
				Simulation.postMessage({
					dt: dt,
					time: time,
					
					attractionPoints: attractionPoints,
					attractionPointsMaxRadius: GlobalGui['Attraction Points Max Radius'],
					attractionPointsAmount: GlobalGui['Attraction Points Amount'],
					
					doAttraction: doAttraction,
					attractionMaxRadius: GlobalGui['Center Attraction Max Radius'],
					attractionAmount: GlobalGui['Center Attraction Amount'],
					
					doRepulsion: doRepulsion,
					repulsionMaxRadius: GlobalGui['Center Repulsion Max Radius'],
					repulsionAmount: GlobalGui['Center Repulsion Amount'],
					
					lowSpinningAmount: GlobalGui['Low Spinning Amount'],
					highSpinningAmount: GlobalGui['High Spinning Amount'],

					tapMode: tapMode
				})
			}

			// Explosion --------------------------------------------------
			if(doRepulsion){
				cameraPosition.z = cameraPosition.z * 0.95 + CAMERA_CLOSE * 0.05;
			}
			else{
				cameraPosition.z = cameraPosition.z * 0.99 + CAMERA_FAR * 0.01;
			}
			cameraPositionUniform = cameraPosition.clone();
			
			// Beat level ------------------------------------------------
			//cameraPositionUniform.z += beatLevel * 0.2;

			shader.uniforms.time.value = time;

			colors.update(dt, time);
			shader.uniforms.objectColor.value = colors.computed.object;
			shader.uniforms.backgroundColor.value = colors.computed.background;
			shader.uniforms.baseLightColor.value = colors.computed.baseLight;
			shader.uniforms.spotLightColor.value = colors.computed.spotLight;
			shader.uniforms.spot2LightColor.value = colors.computed.spot2Light;

			shader.uniforms.deformationFrequency.value = GlobalGui['Deformation Frequency'] * (trebleBeatLevel * 2);
			shader.uniforms.deformationAmount.value = GlobalGui['Deformation Amount'] * (trebleBeatLevel * 1.5);
			
			shader.uniforms.camera.value = cameraPositionUniform;

			if(texture) shader.uniforms.texture.value = texture;
			if(cubemap) shader.uniforms.cubemap.value = cubemap;
		}
		var draw = function(dt, time) {
			composer.render();
		}
		var onResize = function(size) {
			screenSize = size;
			var resolution = clamp( Math.sqrt( maxNumPixels / (size.width * size.height) ), 0, 1);
			var canvasSize = {
				width: (size.width * resolution ),
				height: (size.height * resolution )
			}

			renderer.setSize(canvasSize.width, canvasSize.height);
			var scale = (1.0 / resolution) ;
			var scaleString = 'scale3d('+scale+', '+scale+', 1.0)';
			renderer.domElement.style.transform = scaleString;
			renderer.domElement.style.webkitTransform = scaleString;

			shader.uniforms[ 'resolution' ].value = new THREE.Vector2( canvasSize.width * window.devicePixelRatio, canvasSize.height * window.devicePixelRatio) ;
		}

		Simulation.onmessage = function (e) {
			var simulationData = e.data;

			for (var i = 0; i < simulationData.length; i++) {
				if(isNaN(simulationData[i].x)) simulationData[i].x = 0;
				if(isNaN(simulationData[i].y)) simulationData[i].y = 0;
				if(isNaN(simulationData[i].z)) simulationData[i].z = 0;
				
				shader.uniforms.metaballs.value[i].x = simulationData[i].x;
				shader.uniforms.metaballs.value[i].y = simulationData[i].y;
				shader.uniforms.metaballs.value[i].z = simulationData[i].z;
				shader.uniforms.metaballs.value[i].w = simulationData[i].radius + (simulationData[i].radius * bassBeatLevel) * 0.5;
			}
		}

		var setColors = function(background, foreground, transitionDuration){
			colors.transition({
				object : new THREE.Vector3(foreground.r, foreground.g, foreground.b),
				background : new THREE.Vector3(background.r, background.g, background.b)
			},transitionDuration);

		}
		var setAttractionPoints = function(points){
			attractionPoints = points;
		}
		var setTexture = function(tex, cube){
			texture = tex;
			cubemap = cube;
		}
		var setBeatLevel = function(bassLevel, trebleLevel){
			bassBeatLevel = bassLevel;
			trebleBeatLevel = Math.pow(trebleLevel,0.5);
		}
		var displayText = function(heading, body, duration){
			textContainer.className = "fade-out";
			clearTimeout(textTimer);
			textTimer = setTimeout(function() {
				textContainer.innerHTML = '<div class="heading">'+heading+'</div><div class="body">'+body+'</div>';
				textContainer.className = "fade-in";
				clearTimeout(textTimer);
				textTimer = setTimeout(function() {
					textContainer.className = "fade-complete";
					clearTimeout(textTimer);
					textTimer = setTimeout(function() {
						textContainer.className = "fade-out";
					}, duration * 1000)
				},1000)
			},1000)


		}
		var explode = function(duration){
			clearTimeout(explodeTimer);
			doRepulsion = true;
			explodeTimer = setTimeout(function () {
				doRepulsion = false;
			}, duration * 1000);
		}
		var setTapMode = function(mode){
			if(mode && (tapMode != 'ON' && tapMode != "SPEEDING" ) ){
				tapMode = 'SPEEDING';
				clearTimeout(tapTimer);
				tapTimer = setTimeout(function () {
					tapMode = 'ON';
				}, 500)
			}
			else if(!mode && (tapMode != 'OFF' && tapMode != "SLOWING" ) ){
				tapMode = "SLOWING"
				clearTimeout(tapTimer);
				tapTimer = setTimeout(function () {
					tapMode = 'OFF';
				}, 500)
			}
		}
		var setMaxNumPixels = function (num) {
			maxNumPixels = num;
			if(screenSize)onResize(screenSize);
		}
		var getMaxNumPixels = function () {
			return maxNumPixels;
		}

		init();
			
		Object.defineProperty(self, 'update', {
			value: update
		});
		Object.defineProperty(self, 'draw', {
			value: draw
		});
		Object.defineProperty(self, 'onResize', {
			value: onResize
		});
		Object.defineProperty(self, 'setColors', {
			value: setColors
		});
		Object.defineProperty(self, 'setAttractionPoints', {
			value: setAttractionPoints
		});
		Object.defineProperty(self, 'setBeatLevel', {
			value: setBeatLevel
		});
		Object.defineProperty(self, 'setTexture', {
			value: setTexture
		});
		Object.defineProperty(self, 'displayText', {
			value: displayText
		});
		Object.defineProperty(self, 'explode', {
			value: explode
		});
		Object.defineProperty(self, 'setTapMode', {
			value: setTapMode
		});
		Object.defineProperty(self, 'maxNumPixels', {
			set: setMaxNumPixels,
			get: getMaxNumPixels
		});

	}

	return Liquid;
});