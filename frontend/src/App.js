import React, { useState, useEffect } from 'react';

import './App.css';
import axios from 'axios';
import Map from './Map.js';
import Title from './Title.png';

const App = () => {


  return (
    <div className="App">
      <header className="App-header">
        <img src={Title} />
        <Map />

      </header>

    </div>
  );
}

export default App;
