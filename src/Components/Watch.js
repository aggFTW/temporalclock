import React from 'react';
import SunCalc from 'suncalc'
import 'react-vis/dist/style.css';
import {XYPlot, ArcSeries} from 'react-vis';
import {ToggleButton, ToggleButtonGroup} from 'react-bootstrap';

const daySegments = 6;
const nightSegments = daySegments;
const degreesPerSecondInDay = 360 / (3600 * 24);
const cities = {
  "Seattle": {latitude: 47.6062, longitude: -122.3321, timezoneOffset: -7},
  "Melbourne": {latitude: -37.8136, longitude: 144.9631, timezoneOffset: +11},
  "Reykjavik": {latitude: 64.1466, longitude: 21.9426, timezoneOffset: +0}
}

export class Watch extends React.Component {
  constructor(props) {
    super(props);

    this.handleCityChange = this.handleCityChange.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);

    this.state = {
      city: "Seattle",
      today: null,
      sunrise: null,
      sunset: null,
      dayAngle: null,
      nightAngle: null
    }
  }

  componentWillMount() {
    this.intervalID = setInterval(
      () => this.tick(),
      1000
    );
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

    return Math.round(timeDiffSeconds * degreesPerSecondInDay);
  }

  degreeToRadians(d) {
    return d * 2 * Math.PI / 360;
  }

  tick() {
    let latitude = cities[this.state.city].latitude;
    let longitude = cities[this.state.city].longitude;

    let today = new Date();

    // This is wrong since the current time zone is kept!!!
    let minutesToOffset = today.getTimezoneOffset() + cities[this.state.city].timezoneOffset * 60;
    today.setMinutes(today.getMinutes() + minutesToOffset);

    let times = this.getTimes(today, latitude, longitude);
    let sunrise = times.sunrise;
    let sunset = times.sunset;
    let dayAngle = this.angleDifferenceBetweenTimes(sunrise, sunset);
    let nightAngle = 360 - dayAngle;

    this.setState({
      today: today,
      sunrise: sunrise,
      sunset: sunset,
      dayAngle: dayAngle / daySegments,
      nightAngle: nightAngle / nightSegments
    });
  }

  updateData() {
    const nightRadians = this.degreeToRadians(this.state.nightAngle);
    const dayRadians = this.degreeToRadians(this.state.dayAngle);

    const dayColors = ["#ff8967", "#fec051", "#ffe577", "#ffe577", "#fec051", "#ff8967"];
    const nightColors = ["#403f85", "#392033", "#010318", "#010318", "#392033", "#403f85"]
    
    let newData = [...new Array(nightSegments)].map((row, index) => {
      return {
        // radius0: Math.random() > 0.8 ? Math.random() + 1 : 0,
        radius0: 0,
        radius: 1,
        angle: (index + 1) * nightRadians,
        angle0: index * nightRadians,
        color: nightColors[index]
      };
    });

    let lastNightAngle = newData[nightSegments-1].angle;
    
    return newData.concat([...new Array(daySegments)].map((row, index) => {
      return {
        // radius0: Math.random() > 0.8 ? Math.random() + 1 : 0,
        radius0: 0,
        radius: 1,
        angle: lastNightAngle + (index + 1) * dayRadians,
        angle0: lastNightAngle + index * dayRadians,
        color: dayColors[index]
      };
    }));
  }

  handleCityChange(e) {
    console.error(e);
    this.setState({ city: e });
  }

  handleOptionChange(changeEvent) {
    this.setState({
      city: changeEvent.target.value
    });
  }

  render() {
    if (!this.state.today) {
      return "updating";
    }

    let myData = this.updateData();
    let rotation = 3 * this.state.dayAngle;

    let toggles = Object.keys(cities).map((city) => {
      //return <ToggleButton key={city} value={city}>{city}</ToggleButton>
      return <label><input key={city} value={city} type="radio" name="cities" onChange={this.handleOptionChange} checked={this.state.city === city}/>{city}<br/></label>
    });

    return (
      <div>
        Sunrise: {this.state.sunrise.toString()}<br />
        Sunset: {this.state.sunset.toString()}<br />
        <br />
        <br />
        The time is: {this.state.today.toLocaleString()}<br />
        <br />
        <br />
        {/* <ToggleButtonGroup
          type="radio"
          name="cities"
          value={this.state.city}
          onChange={this.handleChange}
        >
          {toggles}
        </ToggleButtonGroup> */}
        <form>
          {toggles}
        </form>
        <br />
        <br />
        <div style={{transform: `rotate(${rotation}deg)`}}>
          <XYPlot
            xDomain={[-2, 2]}
            yDomain={[-2, 2]}
            width={600}
            height={600}
            animation>
            {/* <XAxis />
            <YAxis /> */}
            <ArcSeries
              animation
              radiusDomain={[0, 2]}
              data={myData}
              colorType={'literal'}
            />
          </XYPlot>
        </div>
        <br />
        <br />
        Day angle: {this.state.dayAngle * daySegments}<br />
        Day segment angle: {this.state.dayAngle}<br />
        <br />
        <br />
        Night angle: {this.state.nightAngle * nightSegments}<br />
        Night segment angle: {this.state.nightAngle}<br />
      </div>
    );
  }
}
