import React, { useState, useEffect } from 'react';

import './App.css';
import axios from 'axios';
import Map from './Map.js';

const App = () => {

  const [image, setImage] = useState(null);

  // useEffect(() => {
  //   loadChunk(10, 10, 20, 20)
  //   //loadChunk(100, 100, 200, 200);
  // }, []);


  const loadChunk = async (startX, startZ, endX, endZ) => {
    const response = await axios.get('http://localhost:8000/data/chunk?startX=' + startX + '&startZ=' + startZ + '&endX=' + endX + '&endZ=' + endZ);
    setImage(response.data)
  };

  document.onkeydown = function (e) {
    switch (e.keyCode) {
      case 37:
        loadChunk(100, 100, 300, 300);
        break;
      default:
    }
  };

  console.log(image);

  return (
    <div className="App">
      <header className="App-header">
        <Map />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>

    </div>
  );
}

export default App;
