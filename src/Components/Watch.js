import React from 'react';
import SunCalc from 'suncalc'
import 'react-vis/dist/style.css';
import {XYPlot, ArcSeries, MarkSeries, LabelSeries} from 'react-vis';
import {ToggleButton, ToggleButtonGroup} from 'react-bootstrap';
import moment from 'moment/moment.js';
import timezone from 'moment-timezone';

const daySegments = 6;
const nightSegments = daySegments;
const degreesPerSecondInDay = 360 / (3600 * 24);
const radiusText = 0.9;

// See https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
const cities = {
  "Seattle": {latitude: 47.6062, longitude: -122.3321, tz: "America/Los_Angeles", timezoneOffset: -7},
  "SLP": {latitude: 22.1566, longitude: -100.9855, tz: "America/Mexico_City", timezoneOffset: -5},
  "Melbourne": {latitude: -37.8136, longitude: 144.9631, tz: "Australia/Melbourne", timezoneOffset: +11},
  "Reykjavik": {latitude: 64.1466, longitude: -21.9426, tz: "Atlantic/Reykjavik", timezoneOffset: +0}
}

export class Watch extends React.Component {
  constructor(props) {
    super(props);

    this.numberMarks = [...new Array(24)].map((row, index) => {
      let angle = -90 + (index * 360 / 24);
      let radians = this.degreeToRadians(angle);
      let x0 = radiusText * Math.cos(radians);
      let y0 = radiusText * Math.sin(radians);

      return {
        x: x0,
        y: y0,
        size: 2
      };
    });

    const textOffset = 0.05;
    this.numberText = [...new Array(24)].map((row, index) => {
      let angle = -90 + (index * 360 / 24);
      let radians = this.degreeToRadians(angle);
      let x0 = (radiusText - textOffset) * Math.cos(radians);
      let y0 = (radiusText - textOffset) * Math.sin(radians);

      return {
        x: x0,
        y: y0,
        label: "" + (24 - index)
      };
    });

    this.state = {
      city: "Seattle"
    };
  }

  componentWillMount() {
    this.setState(this.tick());
    this.intervalID = setInterval(() => this.setState(this.tick()), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalID);
  }

  getMidnight(date) { 
    return date.setHours(0, 0, 0, 0)
  }

  getTimes(date, latitude, longitude) {
    return SunCalc.getTimes(date, latitude, longitude);
  }

  angleDifferenceBetweenTimes(d1, d2) {
    // d2 happens at same time or later than d1
    let timeDiffSeconds = (d2 - d1) / 1000;

    return timeDiffSeconds * degreesPerSecondInDay;
  }

  degreeToRadians(d) {
    return d * 2 * Math.PI / 360;
  }

  tick() {
    let latitude = cities[this.state.city].latitude;
    let longitude = cities[this.state.city].longitude;

    let today = moment.tz(cities[this.state.city].tz).toDate();

    // This is wrong since the current time zone is kept!!! But there's no way around it? :(
    let minutesToOffset = today.getTimezoneOffset() + cities[this.state.city].timezoneOffset * 60;
    today.setMinutes(today.getMinutes() + minutesToOffset);

    let times = this.getTimes(today, latitude, longitude);
    let sunrise = times.sunrise;
    sunrise.setMinutes(sunrise.getMinutes() + minutesToOffset);
    let sunset = times.sunset;
    sunset.setMinutes(sunset.getMinutes() + minutesToOffset);
    let dayAngle = this.angleDifferenceBetweenTimes(sunrise, sunset);
    let nightAngle = 360 - dayAngle;
    
    let midnight = new Date(
      sunset.getFullYear(),
      sunset.getMonth(),
      sunset.getDate(),
      0,0,0);
    let secondsSinceMidnight = sunset - midnight;
    let rotation = 180 + secondsSinceMidnight * degreesPerSecondInDay / 1000;

    return {
      today: today,
      sunrise: sunrise,
      sunset: sunset,
      dayAngle: dayAngle / daySegments,
      nightAngle: nightAngle / nightSegments,
      targetRotation: rotation
    };
  }

  updateData() {
    const nightRadians = this.degreeToRadians(this.state.nightAngle);
    const dayRadians = this.degreeToRadians(this.state.dayAngle);
    const rotation = this.degreeToRadians(this.state.targetRotation);

    const dayColors = ["#ff8967", "#fec051", "#ffe577", "#ffe577", "#fec051", "#ff8967"];
    const nightColors = ["#403f85", "#392033", "#010318", "#010318", "#392033", "#403f85"]
    
    let nightData = [...new Array(nightSegments)].map((row, index) => {
      return {
        radius0: 0,
        radius: 1,
        angle: ((index + 1) * nightRadians) + rotation,
        angle0: (index * nightRadians) + rotation,
        color: nightColors[index]
      };
    });

    let lastNightAngle = nightData[nightSegments-1].angle;
    
    let dayData = [...new Array(daySegments)].map((row, index) => {
      return {
        radius0: 0,
        radius: 1,
        angle: lastNightAngle + (index + 1) * dayRadians,
        angle0: lastNightAngle + index * dayRadians,
        color: dayColors[index]
      };
    });

    return {
      dayData: dayData,
      nightData: nightData
    };
  }

  render() {
    if (!this.state.today) {
      return "updating";
    }
    
    let toggles = Object.keys(cities).map((city) => {
      return <ToggleButton key={city} value={city}>{city}</ToggleButton>
      // return <label><input key={city} value={city} type="radio" name="cities" onChange={this.handleOptionChange} checked={this.state.city === city}/>{city}<br/></label>
    });

    let temporalData = this.updateData();
    
    let midnight = new Date(
      this.state.today.getFullYear(),
      this.state.today.getMonth(),
      this.state.today.getDate(),
      0,0,0);
    let timeToDisplay = this.state.today;
    let secondsSinceMidnight = timeToDisplay - midnight;
    let hoursAngle = Math.PI + this.degreeToRadians(secondsSinceMidnight * degreesPerSecondInDay / 1000);

    const hourThickness = 0.03;
    let hourData = [{
      radius0: 0,
      radius: radiusText - 0.15,
      angle0: hoursAngle - hourThickness / 2,
      angle: hoursAngle + hourThickness / 2,
      color: "Gray"
    }];

    return (
      <div>
        The time is: {this.state.today.toLocaleString()}<br />
        Sunrise: {this.state.sunrise.toLocaleString()}<br />
        Sunset: {this.state.sunset.toLocaleString()}<br />
        <br />
        <br />
        <ToggleButtonGroup
          type="radio"
          name="cities"
          value={this.state.city}
          onChange={
            (value) => {
            this.setState({
              city: value
            });
          }}
        >
          {toggles}
        </ToggleButtonGroup>
        {/* <form>
          {toggles}
        </form> */}
        <br />
        <br />
        <div style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}>
          <XYPlot
            xDomain={[-1, 1]}
            yDomain={[-1, 1]}
            width={600}
            height={600}
            animation
            >
            <ArcSeries
              animation
              radiusDomain={[0, 1]}
              data={temporalData.dayData}
              colorType={'literal'}
            />
            <ArcSeries
              animation
              radiusDomain={[0, 1]}
              data={temporalData.nightData}
              colorType={'literal'}
            />
            <MarkSeries
              sizeRange={[0, 5]}
              data={this.numberMarks}
              colorType="literal"
              color="LightGray"
              getLabel={x => x.time}
              />
            <LabelSeries
              colorType={'literal'}
              data={this.numberText}
              style={{fontSize: 20, fontWeight: "bold", fontFamily: "Helvetica", fill: "LightGray"}}
              labelAnchorX="center"
              labelAnchorY="center" />
            <ArcSeries
              animation
              radiusDomain={[0, 1]}
              data={hourData}
              colorType={'literal'}
            />
          </XYPlot>
        </div>
        {/* <br />
        <br />
        Day angle: {this.state.dayAngle * daySegments}<br />
        Day segment angle: {this.state.dayAngle}<br />
        <br />
        <br />
        Night angle: {this.state.nightAngle * nightSegments}<br />
        Night segment angle: {this.state.nightAngle}<br /> */}
      </div>
    );
  }
}
