import React, { Component } from 'react';
import explanation from "./temporal_clock_explanation.jpg"
import './App.css';
import { Watch } from './Components/Watch'

class App extends Component {
  render() {
    return (
      <div className="App">
        <Watch />
        <img src={explanation} alt="explanation of temporal clock" />
      </div>
    );
  }
}

export default App;
