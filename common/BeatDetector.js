define(
[
	'happy/audio/Node',
	'happy/utils/Vendor',
	'happy/_libs/signals',

	'../../common/GlobalGui'
],
function (
	Node,
	Vendor,
	Signal,

	GlobalGui
){
	"use strict"
	
	var vendor = new Vendor();
	var AudioContext = vendor.validateConstructor('AudioContext');
	var getUserMedia = vendor.validateMethod('getUserMedia', navigator);

	var FrequencyData = function(audioContext, destination) {
		var
		self = this,
		fftData,
		analyser,
		gain,
		filter,
		rawSum,
		averageSum,
		averageValley,
		variation,
		beat;

		var init = function(){
			analyser = new Node(audioContext.createAnalyser());
			analyser.native.fftSize = 32;
			analyser.native.smoothingTimeConstant = 0.8;

			gain = new Node(audioContext.createGain());
			filter = new Node(audioContext.createBiquadFilter());
			filter.native.type = 2;

			filter.connect(gain);
			gain.connect(analyser);
			analyser.connect(destination);

			fftData = new Uint8Array(analyser.native.frequencyBinCount);

			rawSum = 0;
			averageSum = 0;
			averageValley = 0;
			variation = 0;
			beat = 0;
		}

		var update = function() {
			analyser.native.getByteFrequencyData(fftData);
			rawSum = 0;
			for (var i = 0; i < fftData.length; i++) {
				rawSum += fftData[i];
			};
			rawSum /= fftData.length * 256;

			averageSum = averageSum * 0.99 + rawSum * 0.01;
			
			var relevance = (rawSum / averageSum);
			if(relevance < 0.8 && !isNaN(relevance)){
				relevance *= 0.7;
				averageValley = averageValley * relevance + rawSum * (1 - relevance);
			}

			variation = (rawSum - averageValley)  / ((averageSum - averageValley)* 2 );
			variation = Math.pow(variation, 3);
			if(isNaN(variation)) variation = 0;
			else if(variation > 1) variation = 1;
			else if(variation < 0) variation = 0;

			beat = beat * 0.9 + variation * 0.1;
		}

		var getGain = function () {
			return gain;
		}
		var getFilter = function () {
			return filter;
		}
		var getBeat = function () {
			return beat;
		}
		var getRawSum = function () {
			return rawSum;
		}
		var getVariation = function () {
			return variation;
		}
		var getData = function () {
			return fftData;
		}

		init();

		Object.defineProperty(self, 'update', {
			value: update
		});
		Object.defineProperty(self, 'gain', {
			get: getGain
		});
		Object.defineProperty(self, 'filter', {
			get: getFilter
		});
		Object.defineProperty(self, 'beat', {
			get: getBeat
		});
		Object.defineProperty(self, 'raw', {
			get: getRawSum
		});
		Object.defineProperty(self, 'variation', {
			get: getVariation
		});
		Object.defineProperty(self, 'data', {
			get: getData
		});
	}

	var BeatDetector = function(){
		var 
		self = this,
		audioContext,
		destination,
		microphone,
		bass,
		treble,
		
		canvas,
		canvasContext,
		canvasWidth,
		canvasHeight,
		
		debug;

		var init = function () {
			audioContext = new AudioContext();
			destination = new Node(audioContext.destination);
			
			bass = new FrequencyData(audioContext, destination);
			treble = new FrequencyData(audioContext, destination);

			canvasWidth = (bass.data.length + treble.data.length) * 2;
			canvasHeight = 256;
			canvas = document.createElement('canvas');
			canvas.width = canvasWidth;
			canvas.height = canvasHeight;
			canvas.style.width = canvasWidth + "px";
			canvas.style.height = canvasHeight + "px";
			canvas.style.position = "fixed";
			canvas.style.top = 0;
			canvas.style.left = 0;
			canvas.style.zIndex = 2;
			canvasContext = canvas.getContext("2d");

			debug = false;

			getUserMedia({audio: true}, onMicReady, function (error) {
				console.log(error)
			});

			setInterval(function () {
				update();
				draw();
			}, 10)
		}
		var onMicReady = function(stream){
			microphone = new Node(audioContext.createMediaStreamSource(stream));
			microphone.connect(bass.filter);
			microphone.connect(treble.filter);
		}

		var update = function() {
			bass.gain.native.gain.value =  GlobalGui['Bass Filter Gain'];
			bass.filter.native.frequency.value = GlobalGui['Bass Filter Frequency'];
			bass.filter.native.Q.value = GlobalGui['Bass Filter Q'];

			treble.gain.native.gain.value =  GlobalGui['Treble Filter Gain'];
			treble.filter.native.frequency.value = GlobalGui['Treble Filter Frequency'];
			treble.filter.native.Q.value = GlobalGui['Treble Filter Q'];

			bass.update();
			treble.update();
		}
		var draw = function() {
			if(!debug) return;

			canvasContext.fillStyle = "#FFFF00";
			canvasContext.fillRect(0, 0, canvasWidth*0.5, canvasHeight);

			canvasContext.fillStyle = "#FFFF00";
			canvasContext.fillRect(canvasWidth*0.5, 0, canvasWidth*0.5, canvasHeight);

			canvasContext.fillStyle = "#000000";
			for (var i = 0; i < bass.data.length; i++) {
				canvasContext.fillRect(i * (canvasWidth*0.5 / bass.data.length), canvasHeight, 1, -bass.data[i]);
			};

			for (var i = 0; i < treble.data.length; i++) {
				canvasContext.fillRect(canvasWidth * 0.5 + i * (canvasWidth * 0.5 / treble.data.length), canvasHeight, 1, -treble.data[i]);
			};
			
			canvasContext.fillStyle = "#000000";
			canvasContext.fillRect(canvasWidth * 0.5 * 0.5, canvasHeight, 4,  -bass.beat * canvasHeight);
			canvasContext.fillRect(canvasWidth * 0.5 + canvasWidth * 0.5 * 0.5, canvasHeight, 4,  -treble.variation * canvasHeight);

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

		var getBassBeat = function() {
			return bass.beat;
		}
		var getTrebleBeat = function() {
			return treble.beat;
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

		Object.defineProperty(self, 'bassBeat', {
			get: getBassBeat
		});
		Object.defineProperty(self, 'trebleBeat', {
			get: getTrebleBeat
		});
		
	}
	return BeatDetector;
});