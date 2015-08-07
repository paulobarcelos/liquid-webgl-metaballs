#define NUM_OBJECTS 20
#define THRESHOLD 2.0
#define NORMAL_EPSILON 0.01
#define INTERVALS 15
#define LIGHT_DIRECTION_1 vec3(0.0,2.0,0.0)
#define LIGHT_DIRECTION_2 vec3(-2.0,0.5,0.0)
#define REFLECTION_EPSILON 0.1
#define REFRACTION_EPSILON 0.1
#define REFRACTION_RATIO 0.98
#define REFLECTION_DEPTH 2
#define REFLECTION_AMOUNT 0.5
#define REFRACTION_DEPTH 2
#define REFRACTION_AMOUNT 1.0

const vec3 BOX_MIN = vec3 ( -7.0, -7.0, -10.0 );    
const vec3 BOX_AX = vec3 (  7.0,  7.0,  2.0 );
const vec3 VEC3_ZERO = vec3 ( 0.0 );
const vec3 VEC3_ONE = vec3 ( 0.0 );
const vec3 NORMAL_X_EPSILON = vec3 ( NORMAL_EPSILON, 0.0, 0.0 );
const vec3 NORMAL_Y_EPSILON = vec3 ( 0.0, NORMAL_EPSILON, 0.0 );
const vec3 NORMAL_Z_EPSILON = vec3 ( 0.0, 0.0, NORMAL_EPSILON );

uniform float time;
uniform vec2 resolution;
uniform vec3 objectColor;
uniform vec3 backgroundColor;
uniform vec3 baseLightColor;
uniform vec3 spotLightColor;
uniform vec3 spot2LightColor;
uniform float deformationFrequency;
uniform float deformationAmount;
uniform vec3 camera;
uniform vec4 metaballs [NUM_OBJECTS];


struct Ray{
	vec3 origin;	
	vec3 direction;
};

struct RaytraceInfo{
	Ray ray;
	bool intersected;
	vec3 point;
	vec3 normal;
};


float deformationRippleDisplacement( float distance, vec3 position, vec3 waveLength, vec3 waveSize ){
	float displacement = 
		(sin(waveLength.x * position.x) * waveSize.x) * 
		( sin(waveLength.y * position.y) * waveSize.y) * 
		(sin(waveLength.z * position.z ) * waveSize.z);
	return displacement + distance;
}

//-----------------------------------------------------------------------------
float distanceFunction ( vec3 point ){
	float distance = 0.0;
	
	for ( int i = 0; i < NUM_OBJECTS; ++i )	{
		vec3 delta = point - metaballs [i].xyz;

		float f = delta.x * delta.x + delta.y * delta.y + delta.z * delta.z;
		distance += metaballs [i].w / f;
	}
	
	distance =  THRESHOLD - distance;
	distance = deformationRippleDisplacement(distance, point, vec3(deformationFrequency), vec3(deformationAmount));
	return distance;
}

vec3 calculateNormal ( vec3 point ){
	vec3 normal = normalize ( vec3 (
		distanceFunction ( point + NORMAL_X_EPSILON ) - distanceFunction ( point - NORMAL_X_EPSILON ),
		distanceFunction ( point + NORMAL_Y_EPSILON ) - distanceFunction ( point - NORMAL_Y_EPSILON ),
		distanceFunction ( point + NORMAL_Z_EPSILON ) - distanceFunction ( point - NORMAL_Z_EPSILON )
	) );
	
	return normal;
}

bool IntersectBox ( in Ray ray, in vec3 minimum, in vec3 maximum, out float start, out float final ){
	vec3 OMIN = ( minimum - ray.origin ) / ray.direction;	
	vec3 OMAX = ( maximum - ray.origin ) / ray.direction;	
	vec3 MAX = max ( OMAX, OMIN );	
	vec3 MIN = min ( OMAX, OMIN );	
	final = min ( MAX.x, min ( MAX.y, MAX.z ) );	
	start = max ( max ( MIN.x, 0.0 ), max ( MIN.y, MIN.z ) );	
	return final > start;
}

float IntersectBox ( in Ray ray, in vec3 minimum, in vec3 maximum ){
	vec3 OMIN = ( minimum - ray.origin ) / ray.direction;   
	vec3 OMAX = ( maximum - ray.origin ) / ray.direction;	
	vec3 MAX = max ( OMAX, OMIN );	
	return min ( MAX.x, min ( MAX.y, MAX.z ) );
}

bool IntersectSurface ( in Ray ray, in float start, in float final, out float val ){
	float step = ( final - start ) / float ( INTERVALS );
	//----------------------------------------------------------
	float time = start;
	vec3 point = ray.origin + time * ray.direction;
	//----------------------------------------------------------	
	float right, left = distanceFunction ( point );
	//----------------------------------------------------------

	for ( int i = 0; i < INTERVALS; ++i ){
		time += step;
		point += step * ray.direction;
		right = distanceFunction ( point );
		
		if ( left * right < 0.0 )		{
			val = time + right * step / ( left - right );
			return true;
		}		
		left = right;
	}

	return false;
}

Ray GenerateReflectionRay ( RaytraceInfo info ){

	return Ray ( info.point - info.ray.direction * REFLECTION_EPSILON, normalize ( reflect ( info.ray.direction, info.normal ) ) );
}

Ray GenerateRefractionRay ( RaytraceInfo info, bool inside ){
	vec3 normal = info.normal;
	float ratio = REFRACTION_RATIO;

	vec3 direction =  normalize ( refract ( info.ray.direction, normal, ratio ) );
	vec3 position = info.point + direction * REFRACTION_EPSILON;
	return Ray ( position, direction );
}

RaytraceInfo Raytrace ( in Ray ray ){
	float start, final, time;
	vec3 point, normal;    

	RaytraceInfo info;
	info.ray = ray;
	info.intersected = false;

	if ( IntersectBox ( ray, BOX_MIN, BOX_AX, start, final ) )	{
		if ( IntersectSurface ( ray, start, final, time ) )		{
			point = ray.origin + ray.direction * time;					
			normal = calculateNormal ( point );			
			info.intersected = true;
			info.point = point;
			info.normal = normal;
		}
	}
	
	return info;
}

vec3 BackgroundMaterial ( vec3 direction ){

	float light1 = dot( direction, LIGHT_DIRECTION_1);
	float light2 = dot( direction, LIGHT_DIRECTION_2);
	
	float base = clamp(sin(light1) +1.0, 0.0, 1.0);
	base = max(pow(base, 0.15), 0.5) ;
	
	float spotA = clamp(sin(light1) - 0.83, 0.0, 1.0);
	spotA = pow(spotA, 0.2);
	spotA *= pow(sin(light1) - 0.9, 0.4);

	float spotB = clamp(sin(light2) - 0.9, 0.0, 1.0);
	spotB = pow(spotB, 0.3);
	spotB *= pow(sin(light2) - 0.9, 0.4);

	vec3 baseColor = clamp(vec3(base) * baseLightColor, vec3(0.0), vec3(1.0));
	vec3 spotAColor = clamp(vec3(spotA) * spotLightColor, vec3(0.0), vec3(1.0));
	vec3 spotBColor = clamp(vec3(spotB) * spot2LightColor, vec3(0.0), vec3(1.0));

	vec3 color = baseColor + spotAColor + spotBColor;

	return color;
}

vec3 ObjectMaterial ( RaytraceInfo info ){
	vec3 color = vec3(0.0);

	// Refractions -------------------------------------------------
	RaytraceInfo refractionInfo = info;

	Ray refractedRay = GenerateRefractionRay( refractionInfo, true);

	vec3 refractionColor =  BackgroundMaterial( refractedRay.direction );
	
	for (int i = 0; i < REFRACTION_DEPTH; i++){
		refractionInfo = Raytrace( refractedRay );
		
		if( refractionInfo.intersected ){
			refractedRay = GenerateRefractionRay( refractionInfo, true );
			
			vec3 c = BackgroundMaterial( refractedRay.direction );
			refractionColor = mix(refractionColor, c, REFRACTION_AMOUNT);
		}
		else break;
	}

	refractionColor *= objectColor;
	color = mix(color, refractionColor, REFRACTION_AMOUNT);
	
	// Reflections -------------------------------------------------
	RaytraceInfo reflectionInfo = info;

	Ray reflectedRay = GenerateReflectionRay( reflectionInfo );
	vec3 reflectionColor =  BackgroundMaterial( reflectedRay.direction );
	
	for (int i = 0; i < REFLECTION_DEPTH; i++){
		reflectionInfo = Raytrace( reflectedRay );
		
		if( reflectionInfo.intersected ){
			reflectedRay = GenerateReflectionRay( reflectionInfo );
			vec3 c = BackgroundMaterial( reflectedRay.direction );
			reflectionColor = mix(reflectionColor, c, REFLECTION_AMOUNT);
		}
		else break;
	}

	color = mix(color, reflectionColor, REFLECTION_AMOUNT);
	
	color += clamp( pow( abs(info.normal.x), 8.0) + pow(abs(info.normal.y), 8.0), 0.0, 0.2);

	return color;
}

void main ( void ){

	vec2 uv = gl_FragCoord.xy / resolution.xy - 0.5;
	uv.x *= resolution.x / resolution.y;
	float uvLength  = length(uv);
	
	vec3 direction = vec3(uv,1.0);

	Ray ray = Ray ( camera, direction );

	RaytraceInfo info = Raytrace ( ray );

	
	vec3 color = backgroundColor;
	if(info.intersected){
		//float fog = clamp(max(info.point.z * 0.6, uvLength ), 0.0, 1.0);
		//vec3 objectColor = ObjectMaterial(info);
		//color = mix(objectColor, color, fog );
		
		//vec3 outline = vec3( clamp ( pow( dot( info.normal, direction ) * 6.0, 0.3), 0.0, 1.0) );
		//color = mix(color, ObjectMaterial(info), outline );
		color = ObjectMaterial(info);
		//vec3 outline = vec3( pow( 1.0 - dot( info.normal, direction ), 2.0) );
		//color = outline;

	}
	

	// post processing
	color = pow(color, vec3(2.5));
	color -= min( pow(uvLength, 5.0) * 0.45, 0.1); //vignette
	
	
	gl_FragColor =  vec4 (  color, 1.0 );
}