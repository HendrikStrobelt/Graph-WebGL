/**
 * Created by Hendrik Strobelt (hendrik.strobelt.com) on 8/16/15.
 */


function GLRenderer(canvasID){

    var canvas;
    var gl;
    var squareVerticesBuffer;
    var mvMatrix;
    var shaderProgram;
    var vertexPositionAttribute;
    var perspectiveMatrix;

    var graph = {};

    var xExtent = [0,1];
    var yExtent = [0,1];

    var allLines = [];

    var zoomPar = 1;
    var zoomMax = 10;
    var zoomInc = 1.01;
    var zoomIn = true;

    this.intervalID =-1;



    $.getJSON('data/amherst.json',function(data){
        graph=data;
        console.log(graph,'\n','-- graph --');

        // get the max/min values for x and y
        var nodes = graph.nodes;
        nodes.forEach(function(d,i){
            if (i==0){
                xExtent=[d.x, d.x];
                yExtent=[d.y, d.y];

            }else{
                if (d.x>xExtent[1]) xExtent[1] = d.x;
                else if (d.x<xExtent[0]) xExtent[0] = d.x;

                if (d.y>yExtent[1]) yExtent[1] = d.y;
                else if (d.y<yExtent[0]) yExtent[0] = d.y;
            }
        });

        var xScale = d3.scale.linear().domain(xExtent).range([-1,1]);
        var yScale = d3.scale.linear().domain(yExtent).range([-1,1]);



          var source, target;
        graph.edges.forEach(function(d){
            source = nodes[d.source];
            target = nodes[d.target];
            allLines.push(
                xScale(+source.x),
                yScale(+source.y),
                xScale(+target.x),
                yScale(+target.y));
        });


        //allLines = [
        //    0,0,
        //    640,480,
        //    640,0,
        //    0,480
        //];

        start();


    });



    $(window).resize(function(){

        $(window).height();
        $(window).width();

        $("#"+canvasID).attr({
            "width":$(window).width(),
            "height":$(window).height()-73
        })

        gl.viewport(0, 0, canvas.width, canvas.height);

        //console.log($(window).height(),'\n-- $(#container).width() --');
    })


//
// start
//
// Called when the canvas is created to get the ball rolling.
// Figuratively, that is. There's nothing moving in this demo.
//
    function start() {
        canvas = document.getElementById(canvasID);

        initWebGL(canvas);      // Initialize the GL context




        // Only continue if WebGL is available and working

        if (gl) {

            $("#"+canvasID).attr({
                "width":$(window).width(),
                "height":$(window).height()-73
            })

            gl.viewport(0, 0, canvas.width, canvas.height);



            gl.clearColor(1, 1.0, 1.0, 1.0);  // Clear to black, fully opaque
            gl.clearDepth(1.0);                 // Clear everything
            gl.enable(gl.DEPTH_TEST);           // Enable depth testing
            gl.depthFunc(gl.LEQUAL);            // Near things obscure far things


            ////gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            ////gl.enable(gl.BLEND);
            ////gl.disable(gl.DEPTH_TEST);
            //gl.enable( gl.BLEND );
            //gl.blendEquation( gl.FUNC_ADD );
            //gl.blendFunc( gl.SRC_ALPHA, gl.ONE );



            // Initialize the shaders; this is where all the lighting for the
            // vertices and so forth is established.

            initShaders();

            // Here's where we call the routine that builds all the objects
            // we'll be drawing.

            initBuffers();

            // Set up to draw the scene periodically.

            drawScene();
            //intervalID = setInterval(drawScene, 15);
        }
    }

//
// initWebGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
    function initWebGL() {
        gl = null;

        try {
            gl = canvas.getContext("experimental-webgl");
        }
        catch(e) {
        }

        // If we don't have a GL context, give up now

        if (!gl) {
            alert("Unable to initialize WebGL. Your browser may not support it.");
        }
    }

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just have
// one object -- a simple two-dimensional square.
//
    function initBuffers() {

        // Create a buffer for the square's vertices.

        squareVerticesBuffer = gl.createBuffer();

        // Select the squareVerticesBuffer as the one to apply vertex
        // operations to from here out.

        gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);

        // Now create an array of vertices for the square. Note that the Z
        // coordinate is always 0 here.

        var vertices = [
            1.0,  1.0,
            -1.0, 1.0,
            1.0,  -1.0,
            -1.0, -1.0
        ];
        //allLines=vertices;

        // Now pass the list of vertices into WebGL to build the shape. We
        // do this by creating a Float32Array from the JavaScript array,
        // then use it to fill the current vertex buffer.

        //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allLines), gl.STATIC_DRAW);
    }

//
// drawScene
//
// Draw the scene.
//
    function drawScene() {
        // Clear the canvas before we start drawing on it.

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Establish the perspective with which we want to view the
        // scene. Our field of view is 45 degrees, with a width/height
        // ratio of 640:480, and we only want to see objects between 0.1 units
        // and 100 units away from the camera.

        //perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);
        //perspectiveMatrix = makeOrtho(0,0,640,480,.1,100);
        //perspectiveMatrix = makeOrtho(-640/480,640/480,-1,1,.1,100);
        perspectiveMatrix = makeOrtho(-1,1,-1,1,.1,100);

        //perspectiveMatrix = makeOrtho(-5,5,-5,5,.1,100);
        //perspectiveMatrix = makeOrtho(xExtent[0],xExtent[1],yExtent[0],yExtent[1],.1,100);




        // Set the drawing position to the "identity" point, which is
        // the center of the scene.

        loadIdentity();


        if (zoomIn){
            zoomPar*=zoomInc;
            if (zoomPar>=zoomMax) zoomIn=false;
        }else{
            zoomPar/=zoomInc;
            if (zoomPar<=1) zoomIn=true;
        }

        mvMatrix = mvMatrix.x($M([
            [zoomPar,0,0],
            [0,zoomPar,0],
            [0,0,zoomPar],
        ]).ensure4x4());

        //clearInterval(intervalID);

        //console.log(mvMatrix,'\n-- mvMatrix --');

        // Now move the drawing position a bit to where we want to start
        // drawing the square.

        //mvTranslate([-0.0, 0.0, -1.0]);

        // Draw the square by binding the array buffer to the square's vertices
        // array, setting attributes, and pushing it to GL.

        gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
        gl.vertexAttribPointer(vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);
        setMatrixUniforms();
        gl.lineWidth(.1);
        gl.drawArrays(gl.LINES, 0, allLines.length/2);
    }






//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
    function initShaders() {
        var fragmentShader = getShader(gl, "shader-fs");
        var vertexShader = getShader(gl, "shader-vs");

        // Create the shader program

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        // If creating the shader program failed, alert

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Unable to initialize the shader program.");
        }

        gl.useProgram(shaderProgram);
        vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(vertexPositionAttribute);
    }

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
    function getShader(gl, id) {
        var shaderScript = document.getElementById(id);

        // Didn't find an element with the specified ID; abort.

        if (!shaderScript) {
            return null;
        }

        // Walk through the source element's children, building the
        // shader source string.

        var theSource = "";
        var currentChild = shaderScript.firstChild;

        while(currentChild) {
            if (currentChild.nodeType == 3) {
                theSource += currentChild.textContent;
            }

            currentChild = currentChild.nextSibling;
        }

        // Now figure out what type of shader script we have,
        // based on its MIME type.

        var shader;

        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;  // Unknown shader type
        }

        // Send the source to the shader object

        gl.shaderSource(shader, theSource);

        // Compile the shader program

        gl.compileShader(shader);

        // See if it compiled successfully

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

//
// Matrix utility functions
//

    function loadIdentity() {
        mvMatrix = Matrix.I(4);
    }

    function multMatrix(m) {
        mvMatrix = mvMatrix.x(m);
    }

    function mvTranslate(v) {
        multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
    }

    function setMatrixUniforms() {
        var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

        var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
    }

    this.setAnimation = function(isAnimated){

        if (isAnimated) this.intervalID  = setInterval(drawScene, 15);
        else clearInterval(this.intervalID);
    }

}




