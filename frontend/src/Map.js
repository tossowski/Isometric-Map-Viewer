import React, { useState, useEffect } from 'react';


import './Map.css';

const Map = () => {

  let mapChunkSize = 16; // How many 16x16 minecraft chunks are in each map chunk
  let mapTopLeftX = 0;
  let mapTopLeftZ = 0;
  const canvasRef = React.useRef(null);
  const offScreenCanvasRef = React.useRef(null);

  let chunkWidth = 2 * 16;
  let chunkHeight = 16;
  let chunkImages = [];
  let chunkCoords = [];
  let chunkLoadedCount = 0;
  let dragging = false;
  let drag_start_x;
  let drag_start_y;

  const minPadding = 2;
  const heightOffset = 3;
  let imageWidth = 2 * (mapChunkSize * 32 + minPadding);
  let imageHeight = 256 * heightOffset + mapChunkSize * 32 + 2 * minPadding;
  let canvasWidth = 800;
  let canvasHeight = 600;
  let scaleFactor = 1;

  let image_cache = {};


  const getChunk = (startX, startZ, endX, endZ) => {
    return 'http://localhost:8000/data/chunk?startX=' + startX + '&startZ=' + startZ + '&endX=' + endX + '&endZ=' + endZ;
  }

  const render = (ctx) => {


    for (let i = 0; i < chunkImages.length; i++) {
      ctx.drawImage(chunkImages[i], chunkCoords[i][0] - imageWidth / 2, chunkCoords[i][1] - imageHeight);
    }

  }

  const loadChunk = (ctx, startX, startZ, endX, endZ) => {
    var imageObj = new Image();
    chunkImages.push(imageObj);

    let key = startX.toString() + "_" + startZ.toString();

    if (key in image_cache) {
      imageObj.src = image_cache[key];
    } else {
      imageObj.src = getChunk(startX, startZ, endX, endZ);
    }



    // Determining the x and y coordinate on the canvas to draw this chunk on:


    // First, calculate how many chunks away this chunk is from the top left
    let xChunks = (startX - mapTopLeftX) / 16;
    let zChunks = (startZ - mapTopLeftZ) / 16;

    // Compute the remaining amount of blocks
    let xRemainder = (startX - mapTopLeftX) % 16;
    let zRemainder = (startZ - mapTopLeftZ) % 16;

    // Translate from 3D to isometric coordinates
    let xCoord = xChunks * chunkWidth + zChunks * chunkWidth + xRemainder + zRemainder;
    let yCoord = zChunks * chunkHeight + zRemainder - xChunks * chunkHeight - xRemainder;

    chunkCoords.push([xCoord, yCoord]);

    imageObj.onload = function () {
      if ((key in image_cache)) {
        image_cache[key] = imageObj.src;
      }
      if (++chunkLoadedCount >= chunkImages.length) {
        render(ctx);
      }
    }


  }

  const drawChunks = (ctx) => {
    // If starting from (0,0):
    // x goes from 0, -16, -16, -32, -32
    // z goes from 0, 0, 16, 16, 32

    chunkImages = [];
    chunkCoords = [];
    chunkLoadedCount = 0;

    let startX = mapTopLeftX - (mapTopLeftX % (mapChunkSize * 16));
    let startZ = mapTopLeftZ - (mapTopLeftZ % (mapChunkSize * 16));

    // let startX = mapTopLeftX;
    // let startZ = mapTopLeftZ;



    for (let j = 0; j < (canvasHeight + imageHeight) / (mapChunkSize * 16); j++) {

      if (j % 2 == 1 && j > 0) {
        startX -= mapChunkSize * 16;
      } else if (j % 2 == 0 && j > 0) {
        startZ += mapChunkSize * 16;
      }
      for (let i = -1; i < canvasWidth / imageWidth + 2; i++) {
        loadChunk(ctx, startX + i * mapChunkSize * 16, startZ + i * mapChunkSize * 16, startX + (i + 1) * mapChunkSize * 16, startZ + (i + 1) * mapChunkSize * 16);
      }
    }



  }

  const onMouseUpHandler = (e) => {
    dragging = false;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const offScreenCanvas = offScreenCanvasRef.current;

    let xdiff = (e.pageX - drag_start_x);
    let ydiff = (e.pageY - drag_start_y);

    mapTopLeftX -= xdiff / 4;
    mapTopLeftX += ydiff / 2;
    mapTopLeftZ -= ydiff / 2;
    mapTopLeftZ -= xdiff / 4;

    console.log(mapTopLeftX, mapTopLeftZ);

    //ctx.drawImage(offScreenCanvas, xdiff, ydiff);
    drawChunks(ctx);


  }

  const onMouseDownHandler = (e) => {
    dragging = true;
    drag_start_x = e.pageX;
    drag_start_y = e.pageY;
    const canvas = canvasRef.current;
    const offScreenCanvas = offScreenCanvasRef.current;
    const octx = offScreenCanvas.getContext("2d");
    octx.drawImage(canvas, 0, 0);

  }

  const onMouseMoveHandler = (e) => {
    if (dragging) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const offScreenCanvas = offScreenCanvasRef.current;
      let xdiff = e.pageX - drag_start_x;
      let ydiff = e.pageY - drag_start_y;

      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(offScreenCanvas, xdiff, ydiff, offScreenCanvas.width / scaleFactor, offScreenCanvas.height / scaleFactor);
    }
  }

  document.onkeydown = function (e) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    switch (e.keyCode) {
      case 37:
        // Left Arrow Key
        mapTopLeftX -= 16;
        mapTopLeftZ -= 16;

        drawChunks(ctx);
        break;
      case 38:
        // Up Arrow Key
        mapTopLeftX += 16;
        mapTopLeftZ -= 16;

        drawChunks(ctx);
        break;
      case 39:
        // Right Arrow Key
        mapTopLeftX += 16;
        mapTopLeftZ += 16;

        drawChunks(ctx);
        break;

      case 40:
        // Down Arrow Key
        mapTopLeftX -= 16;
        mapTopLeftZ += 16;

        drawChunks(ctx);
        break;

      default:
    }
  };

  const zoomIn = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const offScreenCanvas = offScreenCanvasRef.current;
    const octx = offScreenCanvas.getContext("2d");
    scaleFactor += 0.1;
    ctx.resetTransform()
    ctx.scale(scaleFactor, scaleFactor);


    // octx.scale(1.1, 1.1);
    // mapTopLeftX -= 0.1 * canvasWidth;
    // mapTopLeftZ -= 0.1 * canvasHeight;
    drawChunks(ctx);
  }

  const zoomOut = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const offScreenCanvas = offScreenCanvasRef.current;
    const octx = offScreenCanvas.getContext("2d");

    scaleFactor -= 0.1;
    ctx.resetTransform()
    ctx.scale(scaleFactor, scaleFactor);

    // octx.scale(0.9, 0.9);
    drawChunks(ctx);
  }


  return (
    <div>
      <div>
        <canvas ref={offScreenCanvasRef} className="offscreencanvas" width={canvasWidth} height={canvasHeight}></canvas>
        <canvas ref={canvasRef} id="myCanvas" width={canvasWidth} height={canvasHeight}
          onMouseUp={onMouseUpHandler} onMouseMove={onMouseMoveHandler} onMouseDown={onMouseDownHandler}></canvas>

      </div >
      <div><button onClick={zoomIn}>ZOOM IN</button>
        <button onClick={zoomOut}>ZOOM OUT</button></div>
    </div>
  );
}

export default Map;
