importScripts('../../node_modules/requirejs/require.js');

require(
{
	baseUrl: "../../common/"
},
[
	"cannon"
],
function(
	CANNON
)
{
	"use strict"

	var NUM_OBJECTS = 20;
	var OBJECT_RADIUS = 1.0;
	var CENTER = new CANNON.Vec3(0,0,0);

	var world = new CANNON.World();
	world.gravity.set(0,0,0);
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 10;

	var material = new CANNON.Material("Water Material");
	var contactMaterial = new CANNON.ContactMaterial(material, material, 0.0, 0.0);
	contactMaterial.contactEquationStiffness = 1e8;
	contactMaterial.contactEquationRegularizationTime = 3;
	world.addContactMaterial(contactMaterial);

	var objects = [];
	setTimeout(
		function() {
			for (var i = 0; i < NUM_OBJECTS; i++) {
				var object = {};
				object.mass =  Math.random() * 0.1 + 0.1;
				object.radius = object.mass * 0.5;
				
				object.shape = new CANNON.Sphere( object.radius );
				object.body = new CANNON.RigidBody( object.mass, object.shape, material );
				object.body.linearDamping = 0.3;
				object.body.position.x = Math.sin( Math.random() * 360 );
				object.body.position.y = Math.sin( Math.random() * 360 );
				object.body.position.z = Math.sin( Math.random() * 360 );
				world.add(object.body);
				objects[i] = object;
			}
		},
		10
	)

	var update = function() {
		// do the physics!
		for (var i = 0; i < objects.length; i++) {
			applyForces(objects[i], i);
		}
		world.step(appData.dt * 0.5);

		// send data out to main application
		var data = []
		for (var i = 0; i < objects.length; i++) {
			data.push({
				x: objects[i].body.position.x,
				y: objects[i].body.position.y,
				z: objects[i].body.position.z,
				radius: objects[i].radius
			});
		}
		postMessage(data);
	}
	

	var applyForces = function (object, i) {
		var body = object.body;
		// wrap space
		if(body.position.x > 4.0) body.position.x = -4.0;
		if(body.position.y > 2.0) body.position.y = -2.0;
		if(body.position.x < -4.0) body.position.x = 4.0;
		if(body.position.y < -2.0) body.position.y = 2.0;

		// Attraction to center
		var diff = CENTER.vsub(body.position);
		var dist = CENTER.distanceTo(body.position);

		var spin = new CANNON.Vec3(
			((i%2 == 0) ? Math.sin(appData.time/5) : Math.cos(appData.time/5)) * -diff.y, 
			diff.x, 
			Math.sin(appData.time + i * 10) * 0.6 );

		var attractionInfluence = 1 - (dist / appData.attractionMaxRadius);
		var repulsionInfluence = 1 - (dist / appData.repulsionMaxRadius);
		
		if(appData.doAttraction && dist > appData.attractionMaxRadius) {
			var attraction = diff.copy();
			attraction = attraction.mult(appData.attractionAmount);
			attraction.x *= 0.1;
			body.applyForce(attraction, body.position);

		}
		else{
			body.applyForce(spin.mult(appData.lowSpinningAmount * attractionInfluence), body.position);
		}

		if(appData.doRepulsion && dist < appData.repulsionMaxRadius) {
			if(dist < appData.repulsionMaxRadius / 2) {
				var repulsion = diff.copy().negate();
				repulsion = repulsion.mult(appData.repulsionAmount);
				body.applyForce(repulsion, body.position);
			}
			body.applyForce(spin.mult(appData.highSpinningAmount * repulsionInfluence), body.position);
		}

		for (var i = 0; i < appData.attractionPoints.length; i++) {
			var point = new CANNON.Vec3( appData.attractionPoints[i].x, appData.attractionPoints[i].y, 0.0 );
			var pointDist = point.distanceTo(body.position);
			var pointDiff = point.vsub( body.position );
			var influence = pointDist / appData.attractionPointsMaxRadius;
			if(influence < 0) influence = 0;
			else if(influence > 1) influence = 1;
			//influence = Math.pow(influence, 1.3)

			if(pointDist < appData.attractionPointsMaxRadius){
				var attraction = pointDiff.copy();
				attraction.mult(influence);
				attraction = attraction.mult(appData.attractionPointsAmount);
				body.applyForce(attraction, body.position);
			}

		};

		if(appData.tapMode == 'SPEEDING'){
			var gravity = new CANNON.Vec3(0,-3.0,0);
			body.applyForce(gravity, body.position);
		}
		else if(appData.tapMode == 'ON'){
			var columnAttraction = diff.copy();
			columnAttraction.y *=0;
			columnAttraction.x *=0.2;

			var gravity = new CANNON.Vec3(0,-0.2,0);

			var tapForce = gravity.vadd(columnAttraction);
			body.applyForce(tapForce, body.position);
		}
		else if(appData.tapMode == 'SLOWING'){
			var antiGravity = new CANNON.Vec3(0,3.0,0);

			body.applyForce(antiGravity, body.position);
		}

	}

	// Incomming data from main application
	var appData = {
		dt: 0,
		time: 0,		
		attractionPoints: [],
		attractionPointsMaxRadius: 0,
		attractionPointsAmount: 0,		
		doAttraction: false,
		attractionMaxRadius: 0,
		attractionAmount: 0,		
		doRepulsion: false,
		repulsionMaxRadius: 0,
		repulsionAmount: 0,		
		lowSpinningAmount: 0,
		highSpinningAmount: 0,
		tapMode: 'OFF'
	}

	onmessage = function (e) {
		appData = e.data;
		update();
	}


});
