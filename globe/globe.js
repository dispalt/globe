/**
 * dat.globe Javascript WebGL Globe Toolkit
 * http://dataarts.github.com/dat.globe
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var DAT = DAT || {};

DAT.Globe = function(container, colorFn) {

  colorFn = colorFn || function(x) {
    var c = new THREE.Color();
    c.setHSL( ( 0.6 - ( x * 0.5 ) ), 1.0, 1.0 );
    return c;
  };

  var Shaders = {
    'earth' : {
      uniforms: {
        'texture': { type: 't', value: null }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          'vNormal = normalize( normalMatrix * normal );',
          'vUv = uv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D texture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'vec3 diffuse = texture2D( texture, vUv ).xyz;',
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
          'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
        '}'
      ].join('\n')
    },
    'atmosphere' : {
      uniforms: {},
      vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'vNormal = normalize( normalMatrix * normal );',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
          'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
        '}'
      ].join('\n')
    }
  };

  var camera, scene, sceneAtmosphere, renderer, w, h;
  var vector, mesh, atmosphere, point;

  var overRenderer;

  var imgDir = '../globe/images/';
  var vec3Origin = new THREE.Vector3(0,0,0);
  var globeRadius = 200;

  var curZoomSpeed = 0;
  var zoomSpeed = 50;

  var mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
  var rotation = { x: 0, y: 0 },
      target = { x: Math.PI*3/2, y: Math.PI / 6.0 },
      targetOnDown = { x: 0, y: 0 };

  var distance = 100000, distanceTarget = 100000;
  var padding = 40;
  var PI_HALF = Math.PI / 2;

  function init() {

    container.style.color = '#fff';
    container.style.font = '13px/20px Arial, sans-serif';

    var shader, uniforms, material;
    w = container.offsetWidth || window.innerWidth;
    h = container.offsetHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera( 30, w / h, 1, 10000);
    camera.position.z = distance;

    vector = new THREE.Vector3();

    scene = new THREE.Scene();
    sceneAtmosphere = new THREE.Scene();

    var geometry = new THREE.SphereGeometry(globeRadius, 40, 30);

    shader = Shaders['earth'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    uniforms['texture'].value = THREE.ImageUtils.loadTexture(imgDir+'world' +
        '.jpg');

    material = new THREE.ShaderMaterial({

          uniforms: uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader

        });

    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = Math.PI;
    scene.add(mesh);

    shader = Shaders['atmosphere'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    material = new THREE.ShaderMaterial({

          uniforms: uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader,
          side: THREE.BackSide

        });

    mesh = new THREE.Mesh(geometry, material);
    mesh.scale.x = mesh.scale.y = mesh.scale.z = 1.1;
    sceneAtmosphere.add(mesh);

    geometry = new THREE.CubeGeometry(0.75, 0.75, 1, 1, 1, 1, undefined, { px: true,
          nx: true, py: true, ny: true, pz: false, nz: true});

    geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0,0,0.5) );

    point = new THREE.Mesh(geometry);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.autoClear = false;
    renderer.setClearColorHex(0x000000, 0.0);
    renderer.setSize(w, h);

    renderer.domElement.style.position = 'absolute';

    container.appendChild(renderer.domElement);

    container.addEventListener('mousedown', onMouseDown, false);
    container.addEventListener('mousewheel', onMouseWheel, false);

    document.addEventListener('keydown', onDocumentKeyDown, false);

    window.addEventListener('resize', onWindowResize, false);

    container.addEventListener('mouseover', function() {
      overRenderer = true;
    }, false);

    container.addEventListener('mouseout', function() {
      overRenderer = false;
    }, false);
  }

  addData = function(data, opts) {
    var lat, lng, size, color, i, step, colorFnWrapper;

    opts.animated = opts.animated || false;
    this.is_animated = opts.animated;
    opts.format = opts.format || 'magnitude'; // other option is 'legend'
    console.log(opts.format);
    if (opts.format === 'magnitude') {
      step = 3;
      colorFnWrapper = function(data, i) { return colorFn(data[i+2]); };
    } else if (opts.format === 'legend') {
      step = 4;
      colorFnWrapper = function(data, i) { return colorFn(data[i+3]); };
    } else {
      throw('error: format not supported: '+opts.format);
    }

    if (opts.animated) {
      if (this._baseGeometry === undefined) {
        this._baseGeometry = new THREE.Geometry();
        for (i = 0; i < data.length; i += step) {
          lat = data[i];
          lng = data[i + 1];
//        size = data[i + 2];
          color = colorFnWrapper(data,i);
          size = 0;
          addPoint(lat, lng, size, color, this._baseGeometry);
        }
      }
      if(this._morphTargetId === undefined) {
        this._morphTargetId = 0;
      } else {
        this._morphTargetId += 1;
      }
      opts.name = opts.name || 'morphTarget'+this._morphTargetId;
    }
    var subgeo = new THREE.Geometry();
    for (i = 0; i < data.length; i += step) {
      lat = data[i];
      lng = data[i + 1];
      color = colorFnWrapper(data,i);
      size = data[i + 2];
      size = size*globeRadius;
      addPoint(lat, lng, size, color, subgeo);
    }
    if (opts.animated) {
      this._baseGeometry.morphTargets.push({'name': opts.name, vertices: subgeo.vertices});
    } else {
      this._baseGeometry = subgeo;
    }

  };

  function createPoints() {
    if (this._baseGeometry !== undefined) {
      if (this.is_animated === false) {
        this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
              color: 0xffffff,
              vertexColors: THREE.FaceColors,
              morphTargets: false
            }));
      } else {
        if (this._baseGeometry.morphTargets.length < 8) {
          console.log('t l',this._baseGeometry.morphTargets.length);
          var padding = 8-this._baseGeometry.morphTargets.length;
          console.log('padding', padding);
          for(var i=0; i<=padding; i++) {
            console.log('padding',i);
            this._baseGeometry.morphTargets.push({'name': 'morphPadding'+i, vertices: this._baseGeometry.vertices});
          }
        }
        this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
              color: 0xffffff,
              vertexColors: THREE.FaceColors,
              morphTargets: true
            }));
      }
      scene.add(this.points);
    }
  }

  function addPoint(lat, lng, size, color, subgeo) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (180 - lng) * Math.PI / 180;

    point.position.x = globeRadius * Math.sin(phi) * Math.cos(theta);
    point.position.y = globeRadius * Math.cos(phi);
    point.position.z = globeRadius * Math.sin(phi) * Math.sin(theta);

    point.lookAt(mesh.position);

    point.scale.z = -size;
    point.updateMatrix();

    for (var i = 0; i < point.geometry.faces.length; i++) {
      point.geometry.faces[i].color = color;
    }

    THREE.GeometryUtils.merge(subgeo, point);
  }

  function makeConnectionLineGeometry(start, end, value){
    // console.log("making connection between " + exporter.countryName + " and " + importer.countryName + " with code " + type );

    var distance = start.clone().sub(end).length();    

    //  how high we want to shoot the curve upwards
    var anchorHeight = globeRadius + distance * 0.7;

    //  midpoint for the curve
    var mid = start.clone().lerp(end,0.5);    
    var midLength = mid.length();
    mid.normalize();
    mid.multiplyScalar( midLength + distance * 0.7 );      

    //  the normal from start to end
    var normal = (new THREE.Vector3()).subVectors(start,end);
    normal.normalize();

    /*
          The curve looks like this:

          midStartAnchor---- mid ----- midEndAnchor
          /                                   \
         /                                     \
        /                                       \
    start/anchor                             end/anchor

      splineCurveA                           splineCurveB
    */

    var distanceHalf = distance * 0.5;

    var startAnchor = start;
    var midStartAnchor = mid.clone().add( normal.clone().multiplyScalar( distanceHalf ) );          
    var midEndAnchor = mid.clone().add( normal.clone().multiplyScalar( -distanceHalf ) );
    var endAnchor = end;

    //  now make a bezier curve out of the above like so in the diagram
    var splineCurveA = new THREE.CubicBezierCurve3( start, startAnchor, midStartAnchor, mid);                      
    // splineCurveA.updateArcLengths();

    var splineCurveB = new THREE.CubicBezierCurve3( mid, midEndAnchor, endAnchor, end);
    // splineCurveB.updateArcLengths();

    //  how many vertices do we want on this guy? this is for *each* side
    var vertexCountDesired = Math.floor( /*splineCurveA.getLength()*/ distance * 0.02 + 6 ) * 2;  

    //  collect the vertices
    var points = splineCurveA.getPoints( vertexCountDesired );

    //  remove the very last point since it will be duplicated on the next half of the curve
    points = points.splice(0,points.length-1);

    points = points.concat( splineCurveB.getPoints( vertexCountDesired ) );

    //  add one final point to the center of the earth
    //  we need this for drawing multiple arcs, but piled into one geometry buffer
    points.push(vec3Origin);

    var val = value * 0.0003;

    var size = (10 + Math.sqrt(val));
    size = constrain(size,0.1, 60);

    //  create a line geometry out of these
    var curveGeometry = new THREE.Geometry();

    for( var i = 0; i < points.length; i ++ ) {
      curveGeometry.vertices.push( points[i] );
    }

    curveGeometry.size = size;
    return curveGeometry;
  }


  function latLonToVector(inLat, inLon) {
          var lon = inLon - 90;
          var lat = inLat;

          var phi = Math.PI/2 - lat * Math.PI / 180 - Math.PI * 0.01;
          var theta = 2 * Math.PI - lon * Math.PI / 180 + Math.PI * 0.06;

      var vector = new THREE.Vector3();
          vector.x = Math.sin(phi) * Math.cos(theta) * globeRadius;
          vector.y = Math.cos(phi) * globeRadius;
          vector.z = Math.sin(phi) * Math.sin(theta) * globeRadius;
      return vector;
  }

  function addLines(data) {
    var start = latLonToVector(data[0], data[1]),
        end = latLonToVector(data[2], data[3]),
        size = data[4],
        step = 5,
        color,
        colors = [],
        spline;

    var subgeo = new THREE.Geometry();
    spline = makeConnectionLineGeometry(start, end, 480000000);

    color = colorFn(size);

    for (var i = 0; i < spline.vertices.length; i++) {
      colors.push(color);
    }

    THREE.GeometryUtils.merge(subgeo, spline);
    subgeo.colors = colors;
    subgeo.size = spline.size;
    var splineOutline = new THREE.Line(subgeo, new THREE.LineBasicMaterial({
        color: 0xffffff, opacity: 1.0,
        blending: THREE.AdditiveBlending,
        transparent:true,
        depthWrite: false,
        vertexColors: true,
        linewidth: 1
      }));

    splineOutline.renderDepth = false;
    addParticles(splineOutline);
    scene.add(splineOutline);
    setTimeout(function() {
      scene.remove(splineOutline);
    }, 5000);
  }

  function onMouseDown(event) {
    event.preventDefault();

    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('mouseup', onMouseUp, false);
    container.addEventListener('mouseout', onMouseOut, false);

    mouseOnDown.x = - event.clientX;
    mouseOnDown.y = event.clientY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;

    container.style.cursor = 'move';
  }

  function onMouseMove(event) {
    mouse.x = - event.clientX;
    mouse.y = event.clientY;

    var zoomDamp = distance/1000;

    target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
    target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

    target.y = target.y > PI_HALF ? PI_HALF : target.y;
    target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
  }

  function onMouseUp(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
    container.style.cursor = 'auto';
  }

  function onMouseOut(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
  }

  function onMouseWheel(event) {
    event.preventDefault();
    if (overRenderer) {
      zoom(event.wheelDeltaY * 0.3);
    }
    return false;
  }

  function onDocumentKeyDown(event) {
    switch (event.keyCode) {
      case 38:
        zoom(100);
        event.preventDefault();
        break;
      case 40:
        zoom(-100);
        event.preventDefault();
        break;
      default: break;
    }
  }

  function onWindowResize( event ) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  function zoom(delta) {
    distanceTarget -= delta;
    distanceTarget = distanceTarget > 1000 ? 1000 : distanceTarget;
    distanceTarget = distanceTarget < 350 ? 350 : distanceTarget;
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  function render() {
    zoom(curZoomSpeed);

    rotation.x += (target.x - rotation.x) * 0.1;
    rotation.y += (target.y - rotation.y) * 0.1;
    distance += (distanceTarget - distance) * 0.3;

    camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
    camera.position.y = distance * Math.sin(rotation.y);
    camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);
    camera.lookAt(scene.position);

    vector.copy(camera.position);

    renderer.clear();
    renderer.render(scene, camera);
    renderer.render(sceneAtmosphere, camera);

    scene.traverse(function(mesh) {
      if (mesh.update !== undefined) {
        mesh.update();
      }
    });
  }

  init();
  this.animate = animate;


  this.addData = addData;
  this.addLines = addLines;
  this.createPoints = createPoints;
  this.renderer = renderer;
  this.scene = scene;

  return this;

};

