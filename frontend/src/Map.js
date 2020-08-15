import React, { useState } from 'react';


import './Map.css';
import loadIcon from './loading.gif';
import axios from 'axios';

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
  let imageWidth = (mapChunkSize * 32 + 2 * minPadding) * 2;
  let imageHeight = 256 * heightOffset + mapChunkSize * 32 + 2 * minPadding;
  let canvasWidth = 800;
  let canvasHeight = 600;


  // Zoom stuff
  let scaleFactor = 1;
  const maxZoomOutLevel = 0.5;
  const maxZoomInLevel = 2.0;

  // User input
  let userInputtedX = 0;
  let userInputtedY = 0;
  let userInputtedZ = 0;
  let userInputtedMaxHeight = 255;
  let userInputtedMinHeight = 0;
  let dimension = "overworld";

  let image_cache = {};


  const resetCache = async () => {
    image_cache = {};
    const response = await axios.get(
      'http://localhost:8000/data/reset'
    ).then(function (response) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.fillRect(0, 0, canvas.width / scaleFactor, canvas.height / scaleFactor);

      drawChunks(ctx);
    });




  }

  const chunk2canvas = (x, z) => {
    // Determining the x and y coordinate on the canvas to draw this chunk on:
    // First, calculate how many chunks away this chunk is from the top left
    let xChunks = (x - mapTopLeftX) / 16;
    let zChunks = (z - mapTopLeftZ) / 16;


    // Translate from 3D to isometric coordinates
    let xCoord = xChunks * chunkWidth + zChunks * chunkWidth;
    let yCoord = zChunks * chunkHeight - xChunks * chunkHeight;

    return [xCoord, yCoord];
  }

  const canvas2chunk = (x, y) => {
    // y += imageHeight;
    // y -= mapChunkSize * chunkHeight;

    let xBlocksFromTopLeft = (8 * x / (chunkWidth * scaleFactor)) - (8 * y / (chunkHeight * scaleFactor)) + mapTopLeftX;
    let zBlocksFromTopLeft = (8 * x / (chunkWidth * scaleFactor)) + (8 * y / (chunkHeight * scaleFactor)) + mapTopLeftZ;

    xBlocksFromTopLeft = xBlocksFromTopLeft > 0 ? Math.floor(xBlocksFromTopLeft) : Math.ceil(xBlocksFromTopLeft);
    zBlocksFromTopLeft = zBlocksFromTopLeft > 0 ? Math.floor(zBlocksFromTopLeft) : Math.ceil(zBlocksFromTopLeft);

    return [xBlocksFromTopLeft, zBlocksFromTopLeft]

  }

  const getChunk = (startX, startZ, endX, endZ) => {
    return 'http://localhost:8000/data/chunk?startX=' + startX + '&startZ=' + startZ + '&endX=' + endX + '&endZ=' + endZ + '&minY=' + userInputtedMinHeight + '&maxY=' + userInputtedMaxHeight + "&dim=" + dimension + "&" + performance.now();
  }

  const render = (ctx) => {

    for (let i = 0; i < chunkImages.length; i++) {
      // if (chunkCoords[i][0] == 0 && chunkCoords[i][1] == 0) {
      //   ctx.drawImage(chunkImages[i], chunkCoords[i][0], chunkCoords[i][1] - imageHeight + mapChunkSize * chunkHeight);
      // }
      ctx.drawImage(chunkImages[i], chunkCoords[i][0], chunkCoords[i][1] - imageHeight + mapChunkSize * chunkHeight);

    }

  }

  const loadChunk = (ctx, startX, startZ, endX, endZ) => {
    var imageObj = new Image();

    chunkImages.push(imageObj);

    let key = startX.toString() + " " + startZ.toString() + " " + userInputtedMinHeight.toString() + " " + userInputtedMaxHeight.toString() + " " + dimension;
    imageObj.crossOrigin = "anonymous";
    if (key in image_cache) {
      imageObj.src = image_cache[key]
    } else {

      imageObj.src = getChunk(startX, startZ, endX, endZ);
    }



    let canvasCoords = chunk2canvas(startX, startZ);
    chunkCoords.push([canvasCoords[0], canvasCoords[1]]);

    imageObj.onload = function () {
      image_cache[key] = imageObj.src;
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

    let startX = Math.floor(mapTopLeftX / 256) * 256;;
    let startZ = Math.floor(mapTopLeftZ / 256) * 256;


    // let startX = 0;
    // let startZ = 0;

    //let startX = mapTopLeftX - (mapTopLeftX % 16);
    //let startZ = mapTopLeftZ - (mapTopLeftZ % 16);

    // let startX = mapTopLeftX;
    // let startZ = mapTopLeftZ;

    let newcoordinates = [];
    let allcoordinates = [];
    let key = "";

    let factor = scaleFactor > 1 ? 1 : scaleFactor

    for (let j = 0; j < (canvasHeight) / (mapChunkSize * chunkHeight * factor) + 2; j++) {
      // for (let j = 0; j < 1; j++) {

      if (j % 2 !== 0 && j !== 0) {
        startX -= mapChunkSize * 16;
      } else if (j % 2 !== 1 && j !== 0) {
        startZ += mapChunkSize * 16;
      }
      for (let i = 0; i < (canvasWidth + 2 * mapChunkSize * chunkHeight) / (imageWidth * factor); i++) {
        key = (startX + i * mapChunkSize * 16).toString() + " " + (startZ + i * mapChunkSize * 16).toString() + " " + userInputtedMinHeight.toString() + " " + userInputtedMaxHeight.toString() + " " + dimension;
        if (!(key in image_cache)) { // If never seen this chunk before
          newcoordinates.push([startX + i * mapChunkSize * 16, startZ + i * mapChunkSize * 16, startX + (i + 1) * mapChunkSize * 16 - 1, startZ + (i + 1) * mapChunkSize * 16 - 1]);
        }
        allcoordinates.push([startX + i * mapChunkSize * 16, startZ + i * mapChunkSize * 16, startX + (i + 1) * mapChunkSize * 16 - 1, startZ + (i + 1) * mapChunkSize * 16 - 1]);

      }
    }



    // Telling server to generate new chunks

    if (newcoordinates.length > 4) {
      let response = axios({
        method: 'post',
        url: 'http://localhost:8000/data/loadChunks?minY=' + userInputtedMinHeight + '&maxY=' + userInputtedMaxHeight + '&dim=' + dimension,
        data: newcoordinates
      })
    }



    allcoordinates.forEach(coordinate => loadChunk(ctx, coordinate[0], coordinate[1], coordinate[2], coordinate[3]));






  }

  const onMouseUpHandler = (e) => {
    dragging = false;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');


    let xdiff = (e.pageX - drag_start_x);
    let ydiff = (e.pageY - drag_start_y);

    mapTopLeftX -= xdiff / 4;
    mapTopLeftX += ydiff / 2;
    mapTopLeftZ -= ydiff / 2;
    mapTopLeftZ -= xdiff / 4;


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
    const canvas = canvasRef.current;

    if (dragging) {
      const ctx = canvas.getContext('2d');
      const offScreenCanvas = offScreenCanvasRef.current;
      let xdiff = e.pageX - drag_start_x;
      let ydiff = e.pageY - drag_start_y;

      ctx.fillRect(0, 0, canvas.width / scaleFactor, canvas.height / scaleFactor);

      ctx.drawImage(offScreenCanvas, xdiff, ydiff, offScreenCanvas.width / scaleFactor, offScreenCanvas.height / scaleFactor);
    }
    // } else {
    //   const rect = canvas.getBoundingClientRect()
    //   const x = e.clientX - rect.left
    //   const y = e.clientY - rect.top
    // }
  }

  document.onkeydown = function (e) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    switch (e.keyCode) {
      case 37:
        // Left Arrow Key
        mapTopLeftX -= 8;
        mapTopLeftZ -= 8;


        break;
      case 38:
        // Up Arrow Key
        mapTopLeftX += 16;
        mapTopLeftZ -= 16;



        break;
      case 39:
        // Right Arrow Key
        mapTopLeftX += 8;
        mapTopLeftZ += 8;



        break;

      case 40:
        // Down Arrow Key
        mapTopLeftX -= 16;
        mapTopLeftZ += 16;




        break;

      default:

        return;
    }
    drawChunks(ctx);
  };

  const zoomIn = () => {

    if (scaleFactor >= maxZoomInLevel) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const offScreenCanvas = offScreenCanvasRef.current;
    scaleFactor += 0.1;
    ctx.resetTransform()
    ctx.scale(scaleFactor, scaleFactor);

    // octx.scale(1.1, 1.1);
    // mapTopLeftX -= 0.1 * canvasWidth;
    // mapTopLeftZ -= 0.1 * canvasHeight;
    drawChunks(ctx);
  }

  const zoomOut = () => {
    if (scaleFactor <= maxZoomOutLevel) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const offScreenCanvas = offScreenCanvasRef.current;

    scaleFactor -= 0.1;
    ctx.resetTransform()
    ctx.scale(scaleFactor, scaleFactor);



    // octx.scale(0.9, 0.9);
    drawChunks(ctx);
  }

  const setCoordinates = (e) => {
    e.preventDefault();

    if (Number.isNaN(userInputtedX) || Number.isNaN(userInputtedZ) || Number.isNaN(userInputtedY)) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillRect(0, 0, canvas.width / scaleFactor, canvas.height / scaleFactor);
    // ctx.resetTransform();

    mapTopLeftX = 0;
    mapTopLeftZ = 0;

    let coords = canvas2chunk(canvas.width / 2, canvas.height / 2);

    //let coords = canvas2chunk(canvasWidth / 2, canvasHeight / 2);
    mapTopLeftX = userInputtedX - coords[0] + (userInputtedY) * 1.5;
    mapTopLeftZ = userInputtedZ - coords[1] - (userInputtedY) * 1.5;

    drawChunks(ctx);
  }

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillRect(0, 0, canvas.width / scaleFactor, canvas.height / scaleFactor);
    drawChunks(ctx);
  }

  const setUserInputtedX = (e) => {
    userInputtedX = Number(e.target.value);
  }
  const setUserInputtedY = (e) => {
    userInputtedY = Number(e.target.value);
  }
  const setUserInputtedZ = (e) => {
    userInputtedZ = Number(e.target.value);
  }
  const setUserInputtedMaxHeight = (e) => {
    userInputtedMaxHeight = Number(e.target.value);
  }
  const setUserInputtedMinHeight = (e) => {
    userInputtedMinHeight = Number(e.target.value);
  }
  const setDimension = (e) => {
    dimension = e.target.value;
  }

  const handleFolderUpload = (e) => {
    console.log(e.target.files);
  }

  const saveImage = (e) => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png");
    document.write('<img src="' + dataURL + '"/>');

  }



  return (
    <div>
      <div className="mapContainer">
        <div className="uploadContainer">
          <p className="uploadText">Upload your world here:</p>
          <input directory="" webkitdirectory="" type="file" onChange={handleFolderUpload} />
        </div>

        <canvas ref={offScreenCanvasRef} className="offscreencanvas" width={canvasWidth} height={canvasHeight}></canvas>
        <canvas ref={canvasRef} className="canvas" width={canvasWidth} height={canvasHeight}
          onMouseUp={onMouseUpHandler} onMouseMove={onMouseMoveHandler} onMouseDown={onMouseDownHandler}></canvas>
        <div className="buttonsContainer">

          <div className="zoomButtonsContainer">
            <button className="zoomButton" onClick={zoomIn}><span className="material-icons">
              zoom_in
            </span></button>
            <button className="zoomButton" onClick={zoomOut}><span className="material-icons">
              zoom_out
            </span></button>
          </div>


          <form className="coordForm" onSubmit={setCoordinates}>
            <p className="uploadText">Go to coordinates:</p>
            <div className="input-row">
              <div className="coordInput"><span className="label">x</span><input className="input coords" type="text" defaultValue={0} onChange={setUserInputtedX} /></div>
            </div>
            <div className="input-row">
              <div className="coordInput"><span className="label">y</span><input className="input coords" type="text" defaultValue={0} onChange={setUserInputtedY} /></div>
            </div>
            <div className="input-row">
              <div className="coordInput"><span className="label">z</span><input className="input coords" type="text" defaultValue={0} onChange={setUserInputtedZ} /> </div>
            </div>
            <div className="input-row">
              <input className="button" type="submit" value="Go" onClick={setCoordinates} />
            </div>
          </form>

          <form className="coordForm">
            <p className="uploadText">Set min and max height:</p>
            <div className="input-row">
              <div className="coordInput"><span className="label">y max</span><input className="input coords" type="text" defaultValue={255} onChange={setUserInputtedMaxHeight} /></div>
            </div>
            <div className="input-row">
              <div className="coordInput"><span className="label">y min</span><input className="input coords" type="text" defaultValue={0} onChange={setUserInputtedMinHeight} /></div>
            </div>
          </form>

          <div className="buttons">
            <select className="dimensionSelect" onChange={setDimension}>
              <option value="overworld">Overworld</option>
              <option value="the_nether">Nether</option>
              <option value="the_end">End</option>
            </select>


            <input className="button" type="submit" value="Render" onClick={draw} />
            <input className="button" type="submit" value="Reset Cached Images" onClick={resetCache} />
          </div>


        </div>

      </div >
      <div className="saveContainer">
        <p className="saveText">Save current image:</p>
        <input className="saveButton" type="submit" value="Save" onClick={saveImage} />
      </div></div>




  );
}

export default Map;
