import React, { useState, useEffect } from 'react';

import './App.css';
import axios from 'axios';

const Chunk = (props) => {


  return (
    <div >
      <img src={'http://localhost:8000/data/chunk?startX=' + props.startX + '&startZ=' + props.startZ + '&endX=' + props.endX + '&endZ=' + props.endZ} alt="chunk" />
    </div>
  );
}

export default Chunk;
