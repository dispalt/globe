function constrain(v, min, max){
  if( v < min )
    v = min;
  else
  if( v > max )
    v = max;
  return v;
}

function calculateParticles(splineGeo, particlesGeo, particleColors) {
  var points = splineGeo.vertices;
  var particleColor = splineGeo.colors[splineGeo.colors.length - 1].clone();		
  var particleCount = Math.floor(100000 / 8000 / points.length) + 1;

  particleCount = 1000;//constrain(particleCount,1,100);

  var particleSize = splineGeo.size;			
  for( var s=0; s<particleCount; s++ ){
    // var rIndex = Math.floor( Math.random() * points.length );
    // var rIndex = Math.min(s,points.length-1);

    var desiredIndex = s / particleCount * points.length;
    var rIndex = constrain(Math.floor(desiredIndex),0,points.length-1);

    var point = points[rIndex];
    var particle = point.clone();
    particle.moveIndex = rIndex;
    particle.nextIndex = rIndex+1;
    if(particle.nextIndex >= points.length )
      particle.nextIndex = 0;
    particle.lerpN = 0;
    particle.path = points;
    particlesGeo.vertices.push( particle );
    particle.size = particleSize;
    particleColors.push( particleColor );
  }
}

function addParticles(splineOutline) {
  var lineColors = [];

  var particleColors = [];
  var particlesGeo = new THREE.Geometry();

  attributes = {
    size: {	type: 'f', value: [] },
    customColor: { type: 'c', value: [] }
  };

  uniforms = {
    amplitude: { type: "f", value: 10.0 },
    color:     { type: "c", value: new THREE.Color( 0xffffff ) },
    flare:   { type: "t", value: THREE.ImageUtils.loadTexture( "images/particleA.png" ) }
  };

  var particleShader = new THREE.ShaderMaterial( {

    uniforms:       uniforms,
    attributes:     attributes,
    vertexShader:   document.getElementById( 'vertexshader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentshader' ).textContent,

    blending:     THREE.AdditiveBlending,
    depthTest:    true,
    depthWrite:   false,
    transparent:  true
    //sizeAttenuation: true,
  });


  calculateParticles(splineOutline.geometry, particlesGeo, particleColors);

  var particleMat = new THREE.ParticleBasicMaterial({ 
    map: THREE.ImageUtils.loadTexture("images/map_mask.png"),
    color: 0xffffff,
    size: 60,
    blending: THREE.NormalBlending,
    transparent:true,
    depthWrite: false,
    vertexColors: true
   // sizeAttenuation: true
  });

  particlesGeo.colors = particleColors;
  var pSystem = new THREE.ParticleSystem( particlesGeo, particleShader);
  pSystem.dynamic = true;
  splineOutline.add( pSystem );

  var vertices = pSystem.geometry.vertices;
  var values_size = attributes.size.value;
  var values_color = attributes.customColor.value;

  for( var v = 0; v < vertices.length; v++ ) {		
    values_size[ v ] = pSystem.geometry.vertices[v].size;
    values_color[ v ] = particleColors[v];
  }

  pSystem.update = function(){	
    // var time = Date.now()									
    for( var i in this.geometry.vertices ){						
      var particle = this.geometry.vertices[i];
      var path = particle.path;
      var moveLength = path.length;

      particle.lerpN += 0.05;
      if(particle.lerpN > 1){
        particle.lerpN = 0;
        particle.moveIndex = particle.nextIndex;
        particle.nextIndex++;
        if( particle.nextIndex >= path.length ){
          particle.moveIndex = 0;
          particle.nextIndex = 1;
        }
      }

      var currentPoint = path[particle.moveIndex];
      var nextPoint = path[particle.nextIndex];


      particle.copy( currentPoint );
      particle.lerp( nextPoint, particle.lerpN );			
    }
    this.geometry.verticesNeedUpdate = true;
  };

  return splineOutline;
}
