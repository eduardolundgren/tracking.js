if ( ! Detector.webgl ) {

    Detector.addGetWebGLMessage();
    document.getElementById( 'container' ).innerHTML = "";

}

var container, stats;

var camera, controls, scene, renderer;

var mesh;

var worldWidth = 128, worldDepth = 128,
worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2,
data = generateHeight( worldWidth, worldDepth );

var clock = new THREE.Clock();

init();
animate();

function init() {

    container = document.getElementById( 'container' );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );
    scene.add( camera );

    controls = new THREE.FirstPersonControls( camera );

    controls.movementSpeed = 1000;
    controls.lookSpeed = 0.075;
    controls.lookVertical = false;

    var grass_dirt = loadTexture( 'js/threejs/textures/minecraft/grass_dirt.png' ),
    grass = loadTexture( 'js/threejs/textures/minecraft/grass.png' ),
    dirt = loadTexture( 'js/threejs/textures/minecraft/dirt.png' );

    var materials = [

        grass_dirt, // right
        grass_dirt, // left
        grass, // top
        dirt, // bottom
        grass_dirt, // back
        grass_dirt  // front

    ];

    var h, h2, px, nx, pz, nz, cubes = [];

    for ( var i = 0; i < 16; i++ ) {

        px = ( i & 8 ) == 8;
        nx = ( i & 4 ) == 4;
        pz = ( i & 2 ) == 2;
        nz = ( i & 1 ) == 1;
        cubes[ i ] = new THREE.CubeGeometry( 100, 100, 100, 1, 1, 1, materials, { px: px, nx: nx, py: true, ny: false, pz: pz, nz: nz } );

    }

    var geometry = new THREE.Geometry();

    camera.position.y = getY( worldHalfWidth, worldHalfDepth ) * 100 + 100;

    for ( var z = 0; z < worldDepth; z ++ ) {

        for ( var x = 0; x < worldWidth; x ++ ) {

            px = nx = pz = nz = 0;

            h = getY( x, z );

            h2 = getY( x + 1, z );
            px = ( h2 != h && h2 != h + 1 ) || x == 0 ? 1 : 0;

            h2 = getY( x - 1, z );
            nx = ( h2 != h && h2 != h + 1 ) || x == worldWidth - 1 ? 1 : 0;

            h2 = getY( x, z + 1 );
            pz = ( h2 != h && h2 != h + 1 ) || z == worldDepth - 1 ? 1 : 0;

            h2 = getY( x, z - 1 );
            nz = ( h2 != h && h2 != h + 1 ) || z == 0 ? 1 : 0;

            mesh = new THREE.Mesh( cubes[ px * 8 + nx * 4 + pz * 2 + nz ] );

            mesh.position.x = x * 100 - worldHalfWidth * 100;
            mesh.position.y = h * 100;
            mesh.position.z = z * 100 - worldHalfDepth * 100;

            THREE.GeometryUtils.merge( geometry, mesh );

        }

    }

    mesh = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial() );
    scene.add( mesh );

    var ambientLight = new THREE.AmbientLight( 0xcccccc );
    scene.add( ambientLight );

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 2 );
    directionalLight.position.set( 1, 1, 0.5 ).normalize();
    scene.add( directionalLight );

    renderer = new THREE.WebGLRenderer( { clearColor: 0xbfd1e5 } );
    renderer.setSize( window.innerWidth, window.innerHeight );

    container.innerHTML = "";

    container.appendChild( renderer.domElement );

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );

}


function loadTexture( path ) {

    var image = new Image();
    image.onload = function () { texture.needsUpdate = true; };
    image.src = path;

    var texture  = new THREE.Texture( image, new THREE.UVMapping(), THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.LinearMipMapLinearFilter );

    return new THREE.MeshLambertMaterial( { map: texture, ambient: 0xbbbbbb } );

}

function generateHeight( width, height ) {

    var data = [], perlin = new ImprovedNoise(),
    size = width * height, quality = 2, z = Math.random() * 100;

    for ( var j = 0; j < 4; j ++ ) {

        if ( j == 0 ) for ( var i = 0; i < size; i ++ ) data[ i ] = 0;

        for ( var i = 0; i < size; i ++ ) {

            var x = i % width, y = ~~ ( i / width );
            data[ i ] += perlin.noise( x / quality, y / quality, z ) * quality;


        }

        quality *= 4

    }

    return data;

}

function getY( x, z ) {

    return ~~( data[ x + z * worldWidth ] * 0.2 );

}

//

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();

}

function render() {

    controls.update( clock.getDelta() );
    renderer.render( scene, camera );

}