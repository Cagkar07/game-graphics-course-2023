import PicoGL from "../node_modules/picogl/build/module/picogl.js";
import {mat4, vec3, vec4, quat} from "../node_modules/gl-matrix/esm/index.js";

import {positions, normals, indices} from "../blender/diamond1.js";
import {positions as planePositions, indices as planeIndices} from "../blender/plane.js";

// WebGL setup
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');
gl.clearColor(0.5, 0.5, 0.5, 1.0);
gl.enable(gl.DEPTH_TEST);

// Vertex shader source
const vertexShaderSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform mat4 uModelViewProjectionMatrix;
    uniform mat4 uModelMatrix;
    uniform mat3 uNormalMatrix;
    varying vec3 vNormal;
    void main() {
        gl_Position = uModelViewProjectionMatrix * vec4(aPosition, 1.0);
        vNormal = uNormalMatrix * aNormal;
    }
`;

// Fragment shader source
const fragmentShaderSource = `
    precision mediump float;
    varying vec3 vNormal;
    void main() {
        vec3 normal = normalize(vNormal);
        vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0)); // Directional light
        float diffuse = max(dot(normal, lightDirection), 0.0);
        gl_FragColor = vec4(vec3(diffuse), 1.0);
    }
`;

// Compile shaders
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);

// Create shader program
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// Set up cube model
const positions = [
    -1, -1, -1,
    1, -1, -1,
    1, 1, -1,
    -1, 1, -1,
    -1, -1, 1,
    1, -1, 1,
    1, 1, 1,
    -1, 1, 1
];

const indices = [
    0, 1, 2, 0, 2, 3, // Front face
    1, 5, 6, 1, 6, 2, // Right face
    5, 4, 7, 5, 7, 6, // Back face
    4, 0, 3, 4, 3, 7, // Left face
    3, 2, 6, 3, 6, 7, // Top face
    4, 5, 1, 4, 1, 0  // Bottom face
];

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

const positionAttribLocation = gl.getAttribLocation(program, 'aPosition');
gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(positionAttribLocation);

// Set up uniforms
const modelMatrix = mat4.create();
const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();
const modelViewProjectionMatrix = mat4.create();
const normalMatrix = mat3.create();

const modelViewProjectionMatrixLocation = gl.getUniformLocation(program, 'uModelViewProjectionMatrix');
const modelMatrixLocation = gl.getUniformLocation(program, 'uModelMatrix');
const normalMatrixLocation = gl.getUniformLocation(program, 'uNormalMatrix');

// Set up camera
mat4.lookAt(viewMatrix, [3, 3, 3], [0, 0, 0], [0, 1, 0]);
mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);

// Render loop
function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Update model matrix
    mat4.rotateY(modelMatrix, modelMatrix, 0.01);
    mat4.rotateX(modelMatrix, modelMatrix, 0.01);

    // Update model-view-projection matrix
    mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);
    mat4.multiply(modelViewProjectionMatrix, modelViewProjectionMatrix, modelMatrix);

    // Update normal matrix
    mat3.normalFromMat4(normalMatrix, modelMatrix);

    // Set uniforms
    gl.uniformMatrix4fv(modelViewProjectionMatrixLocation, false, modelViewProjectionMatrix);
    gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix);
    gl.uniformMatrix3fv(normalMatrixLocation, false, normalMatrix);

    // Draw cube
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    // Request next frame
    requestAnimationFrame(draw);
}

// Start the render loop
requestAnimationFrame(draw);
