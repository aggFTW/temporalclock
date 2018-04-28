import React from 'react';
import SunCalc from 'suncalc'

const latitude = 47.6062;
const longitude = -122.3321;
const daySegments = 6;
const nightSegments = daySegments;
const degreesPerSecondInDay = 360 / (3600 * 24);

export class Watch extends React.Component {
  getMidnight(date) { 
    return date.setHours(0, 0, 0, 0)
  }

  getTimes(date, latitude, longitude) {
    return SunCalc.getTimes(date, latitude, longitude);
  }

  numberSecondsSinceMidnight(date) {
    let e = new Date(date);
    return (date - this.getMidnight(e)) / 1000;
  }

  angleDifferenceBetweenTimes(d1, d2) {
    // d2 happens at same time or later than d1
    let seconds1 = this.numberSecondsSinceMidnight(d1);
    let seconds2 = this.numberSecondsSinceMidnight(d2);

    console.debug(seconds1);
    console.debug(seconds2);
    console.debug(degreesPerSecondInDay);

    return Math.round((seconds2 - seconds1) * degreesPerSecondInDay);
  }

  render() {
    let today = new Date();
    let times = this.getTimes(today, latitude, longitude);
    let sunrise = times.sunrise;
    let sunset = times.sunset;
    let dayAngle = this.angleDifferenceBetweenTimes(sunrise, sunset);

    let nightAngle = 360 - dayAngle;
    
    return (
      <div>
        Sunrise: {sunrise.toString()}<br />
        Sunset: {sunset.toString()}<br />
        <br />
        <br />
        Day angle: {dayAngle}<br />
        Day segment angle: {dayAngle / daySegments}<br />
        <br />
        <br />
        Night angle: {nightAngle}<br />
        Night segment angle: {nightAngle / nightSegments}<br />
      </div>
    );
  }
}
