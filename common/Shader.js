define(
[
	'happy/_libs/threejs',
	"text!frag.glsl",
	"text!../../common/vert.source.glsl",
],
function (
	THREE,
	frag,
	vert
){
	"use strict"

	var NUM_OBJECTS = 20;
	var objects = [];
	for (var i = 0; i < NUM_OBJECTS; i++) {
		objects[i] = new THREE.Vector4(0,0,0,0);
	}

	return {
		uniforms: {
			time : { type: "f", value: 0 },
			resolution : { type: "v2", value: new THREE.Vector2( 0, 0) }, 
			objectColor : { type: "v3", value: new THREE.Vector3( 0.3, 0.8, 1.0 ) }, 
			backgroundColor : { type: "v3", value: new THREE.Vector3( 0.98, 0.98, 0.98 ) }, 
			baseLightColor : { type: "v3", value: new THREE.Vector3( 1.0, 1.0, 1.0 ) }, 
			spotLightColor : { type: "v3", value: new THREE.Vector3( 1.0, 1.0, 1.0 ) }, 
			spot2LightColor : { type: "v3", value: new THREE.Vector3( 1.0, 1.0, 1.0 ) }, 
			deformationFrequency  : { type: "f", value: 10.0 },
			deformationAmount : { type: "f", value: 0.6 },
			metaballs : { type : "v4v", value: objects },
			camera: { type: "v3", value: new THREE.Vector3( 0, 0, 0.0) },
			texture: { type: "t", value: new THREE.Texture( ) },
			cubemap: { type: "t", value: new THREE.Texture( ) }

		},
		vertexShader: vert,
		fragmentShader: frag
	};
});
