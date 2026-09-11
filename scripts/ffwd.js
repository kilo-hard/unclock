
// shortcuts
const $ = document.querySelector.bind(document);
const $All = document.querySelectorAll.bind(document);
const debug = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.search.includes('debug=1');
const version = '4.8.1';

if (debug) { console.info('version: ' + version); }

/*
 *	App handles navigation, routes, settings, dark mode, and date formatting
 */



/* jshint esversion: 6 */
/* globals $, $All, debug, App, SunCalendar, SunCalc */

const FastDemo = (function() {
	'use strict';

	const tau = 2 * Math.PI;
	const radius = 220;

	let now, then, timerStart;
	let vhours, vminutes, seconds;
	let hourHand, minuteHand, secondHand;
	let clockIconHours, clockIconMinutes;
	let sunTimes, sunPosition, noonPosition, nadirPosition, sunAlwaysUp, sunAlwaysDown;
	let periodsTemp, currentPeriod, nextPeriodTime;
	let moonTimes, moonPosition, moonPhase, moonHand, moonIcon, moonPath;
	let solnoondeg = 185;
	let longday, sixdeg, solarlag;

	const periods = [
		// name:                        from:               to:                 color:		darkColor:
		['earlyMorning',                'nadir',            'nightEnd',         '#192029',	'#030303'],
		['astronomicalMorningTwilight', 'nightEnd',         'nauticalDawn',     '#213c66',	'#001122'],
		['nauticalMorningTwilight',     'nauticalDawn',     'dawn',             '#4574bc',	'#112255'],
		['civilMorningTwilight',        'dawn',             'sunrise',          '#88a6d4',	'#677ea1'],
		['sunrise',                     'sunrise',          'sunriseEnd',       '#ff9900',	'#cc7a00'],
		['morningGoldenHour',           'sunriseEnd',       'goldenHourEnd',    '#ffe988',	'#ccba6c'],
		['morning',                     'goldenHourEnd',    'solarNoon',        '#dceaff', 	'#b0bbcc'],
		['afternoon',                   'solarNoon',        'goldenHour',       '#dceaff',	'#b0bbcc'],
		['eveningGoldenHour',           'goldenHour',       'sunsetStart',      '#ffe988',	'#ccba6c'],
		['sunset',                      'sunsetStart',      'sunset',           '#ff9900',	'#cc7a00'],
		['civilEveningTwilight',        'sunset',           'dusk',             '#88a6d4',	'#677ea1'],
		['nauticalEveningTwilight',     'dusk',             'nauticalDusk',     '#4574bc',	'#112255'],
		['astronomicalEveningTwilight', 'nauticalDusk',     'night',            '#213c66',	'#001122'],
		['lateEvening',                 'night',            'nadir2',           '#192029',	'#030303']
	];
	const textReplacements = {
		'nadir' : 'Solar Midnight',
		'earlyMorning' : 'Early Morning',
		'nightEnd' : 'Astronomical Dawn',
		'astronomicalMorningTwilight' : 'Astronomical Morning Twilight',
		'nauticalDawn' : 'Nautical Dawn',
		'nauticalMorningTwilight' : 'Nautical Morning Twilight',
		'dawn' : 'Civil Dawn',
		'civilMorningTwilight' : 'Civil Morning Twilight',
		'sunrise' : 'Sunrise',
		'sunriseEnd' : 'End of Sunrise',
		'morningGoldenHour' : 'Morning Golden Hour',
		'goldenHourEnd' : 'End of Golden Hour',
		'morning' : 'Morning',
		'solarNoon' : ' Solar Noon',
		'afternoon' : 'Afternoon',
		'goldenHour' : 'Start of Golden Hour',
		'eveningGoldenHour' : 'Evening Golden Hour',
		'sunsetStart' : 'Beginning of Sunset',
		'sunset' : 'Sunset',
		'civilEveningTwilight' : 'Civil Evening Twilight',
		'dusk' : 'Civil Dusk',
		'nauticalEveningTwilight' : 'Nautical Evening Twilight',
		'nauticalDusk' : 'Nautical Dusk',
		'astronomicalEveningTwilight' : 'Astronomical Evening Twilight',
		'night' : 'Astronomical Dusk',
		'lateEvening' : 'Late Evening',
		'nadir2' : 'Solar Midnight'
	};


	function toDegrees(angle) {
		// convert radians to degrees
		return (angle / tau * 360);
	}


	function getPointFromTime(date) {
		// get point on clock perimeter from time
		var angle = (date / 60 * tau); // radians
		return `${Math.sin(angle) * radius}, ${Math.cos(angle) * radius}`; // return as string for svg path attribute
	}


	function getSunTimes() {
		sunTimes = null;
		sixdeg = 2;
		// un-comment only one of the longday definition lines to set how day length is determined
			if (!longday) { longday = (Math.random() < 0.5) ? 3 : -3; } // initial coinflip
			//longday = (Math.sin(now.getMinutes()/60 + now.getHours() * tau / 6 ) * 4 ) // slow year
			//longday = (Math.sin((now.getMinutes() + seconds/60) * tau / 10 ) * 4 ) // warpspeed year
		solarlag =2;
		sunTimes = {
			dawn: 17 - sixdeg - longday,
			dusk: 47 + sixdeg + longday,
			goldenHour: 47 - sixdeg + longday,
			goldenHourEnd: 17 + sixdeg - longday,
			nadir: 2,
			nadir2: 2, // needs to be less than 60
			nauticalDawn: 17 - (2 * sixdeg) - longday,
			nauticalDusk: 47 + (2 * sixdeg) + longday,
			night: 47 + (3 * sixdeg) + longday,
			nightEnd: 17 - (3 * sixdeg) - longday,
			solarNoon: 32,
			sunrise: 17 - (0.15 * sixdeg) - longday,
			sunriseEnd: 17 - longday,
			sunset: 47 + (0.15 * sixdeg) + longday,
			sunsetStart: 47 + longday
		};


		// draw time period arcs on clock face
		drawTimePeriods();
		updateDynamicTheme();
	}


	function clearSunTimes() {
		// clear all times - called by App.clearLocation();
		sunTimes = null;
		clearTimePeriods();
		updateDynamicTheme();
	}


	function clearTimePeriods() {
		// clear any previous arcs (i.e. if changing direction or setting location manually)
		let arcs = $('#arcs');
		while (arcs.firstChild) {
			arcs.removeChild(arcs.firstChild);
		}
		// clear solar noon and midnight lines
		$('#noon').setAttribute('d','M 0,0 L 0,0');
		$('#midnight').setAttribute('d','M 0,0 L 0,0');
	}

	function drawTimePeriods() {
		// draw time periods on clock face
		let p, t1, t2, point1, point2, path;
		let validTimeCount = 0;
		let direction = 1

		if (!sunTimes) { return; }

		// clear any previous arcs
		clearTimePeriods();

		// make a deep copy of periods (so can modify 'from' and 'to', but keep original for next time);
		periodsTemp = JSON.parse(JSON.stringify(periods));

		// check time periods for valid times
		for (let i=0; i<periodsTemp.length; i++) {
			p = periodsTemp[i];
			t1 = sunTimes[p[1]];
			t2 = sunTimes[p[2]];
			//if (debug) { console.log(`${i}: ${p[0]}, ${p[1]}: ${t1}, ${p[2]}: ${t2} `); }
			if (!isNaN(t1)) validTimeCount++; // count sunTimes events with valid dates

			// test if beginning and end times are valid - and modify from/to times if needed
			// note nadir and noon are always valid times
			if ( isNaN(t1) && isNaN(t2) ) {
				// both times are invalid - period doesn't occur
				continue;
			} else if ( isNaN(t1) ) {
				// beginning time is invalid, end time valid
				if (i === 6)  continue; // morning
				if (i === 13) continue; // lateEvening
				// use nadir (for morning periods) or noon (for evening periods) as t1 instead
				p[1] = (i <= 6) ? 'nadir' : 'solarNoon';
			} else if ( isNaN(t2) ) {
				// beginning time valid, end time invalid
				if (i === 0) continue; // earlyMorning
				if (i === 7) continue; // afternoon
				// use noon (for morning periods) or nadir2 (for evening periods) as t2 instead
				p[2] = (i <= 6) ? 'solarNoon' : 'nadir2';
			} else {
				// both times valid - yay!
			}
			// draw the arc - except...
		}

		if (validTimeCount <= 3) {
			// nadir/noon/nadir2 are the only valid times, so 24 hrs of the same time period.
			// check altitude of sun at noon (note: only happens at high latitudes)
			let pT = periodsTemp;
			let alt1 = toDegrees(noonPosition.altitude);  // degrees above horizon
			let alt2 = toDegrees(nadirPosition.altitude);
			let alt  = (alt1 + alt2) / 2;
			let pt1, pt2;
			if (debug) { console.log(`only 3 valid times (noon and nadir). noon.altitude: ${alt}, nadir.altitude: ${alt2}`); }

			if (alt >= 6) {
				pt1 = 6; pt2 = 7; // morning/afternoon (daytime)
			} else if ((alt < 6) && (alt >= -0.3)) {
				pt1 = 5; pt2 = 8; // morning/evening goldenHour
			} else if ((alt < -0.3) && (alt >= -0.833)) {
				pt1 = 4; pt2 = 9; // sunrise/sunset
			} else if ((alt <= -0.833) && (alt > -6)) {
				pt1 = 3; pt2 = 10; // civil twilight
			} else if ((alt <= -6) && (alt > -12)) {
				pt1 = 2; pt2 = 11; // nautical twilight
			} else if ((alt <= -12) && (alt > -18)) {
				pt1 = 1; pt2 = 12; // astronomical twilight
			} else if (alt <= -18) {
				pt1 = 0; pt2 = 13; // night
			}
			if (debug) { console.log(pt1, pt2); }
			pT[pt1][1] = 'nadir';
			pT[pt1][2] = 'solarNoon';
			pT[pt2][1] = 'solarNoon';
			pT[pt2][2] = 'nadir2';
		}

		// draw time periods - finally
		for (let i=0; i<periodsTemp.length; i++) {
			p = periodsTemp[i];
			t1 = sunTimes[p[1]];
			t2 = sunTimes[p[2]];

			if ( isNaN(t1) || isNaN(t2) ) {
				continue;
			} else {
				// draw the arc
				point1 = getPointFromTime(sunTimes[p[1]]);
				point2 = getPointFromTime(sunTimes[p[2]]);
				path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
				path.setAttribute('id', p[0]);
				path.setAttribute('cursor', 'crosshair');
				path.setAttribute('d',`M 0,0 L ${point1} A ${radius} ${radius} 0 0 ${(direction<0) ? 1 : 0} ${point2} z`); // sweep-flag depends on direction
				$('#arcs').appendChild(path);
			}
		}

		// draw solar noon and midnight lines
		$('#noon').setAttribute('d',`M 0,0 L ${getPointFromTime(sunTimes.solarNoon)}`);
		$('#midnight').setAttribute('d',`M 0,0 L ${getPointFromTime(sunTimes.nadir2)}`);
		sunIcon.setAttribute('transform', `translate(${getPointFromTime(sunTimes.solarNoon) .split(',') .map (num => num / 3) .join(',')})`);
		nadirstar.setAttribute('transform', `translate(${getPointFromTime(sunTimes.nadir2) .split(',') .map (num => num / 3) .join(',')})`);
	}

	function getCurrentTimePeriod() {
		// find the time period are we in now
		let t0, t1, t2, p;
		t0 = seconds;

		for (let i=0; i<periodsTemp.length; i++) {
			p = periodsTemp[i];
			t1 = sunTimes[p[1]];
			t2 = sunTimes[p[2]];

			if ((isNaN(t1)) || (isNaN(t2))) {
				continue;
			} else if ((t0 > t1) && (t0 < t2)) {
				currentPeriod = i;
				break;
			} else {
				continue;
			}
		}
		if (debug) { console.log(`currentPeriod is ${currentPeriod}: ${periodsTemp[currentPeriod][0]}`); }
	}


	function getPeriodInfo(i) {
		// get info for time periods
		let p = periodsTemp[i];

		let str = `<h3>${textReplacements[p[0]]}</h3>
			<p>${textReplacements[p[1]]}<br><span class="nobr">${sunTimes[p[1]]}</span></p>
			<p class="to">— to —</p>
			<p>${textReplacements[p[2]]}<br><span class="nobr">${sunTimes[p[2]]}</span></p>`;

		return str;
	}


	function getMoonPhase() {
		$('#moonIcon path').setAttribute('d', drawMoonIcon(moonPhase) );
	}


	function drawMoonIcon(phase, radius) {
		// draw the moon icon (instead of using unicode characters)
		// get x radius and sweep direction for each half of the path

		let ry = radius || 8;
		let cosX = Math.abs(Math.cos( phase * tau ));
		// x-radius
		let rx1 = (phase < 0.50) ? ry * cosX : ry;  // left arc
		let rx2 = (phase < 0.50) ? ry : ry * cosX;  // right arc
		// sweep-flag: 0 = CCW, 1 = CW
		let sweep1 = (phase < 0.25) ? 0 : 1;        // left arc
		let sweep2 = (phase < 0.75) ? 1 : 0;        // right arc

		// return svg path (2 elliptical arcs)
		// Arc syntax: A rx ry x-axis-rotation large-arc-flag sweep-flag x-final y-final
		return `M 0 ${ry} 
			A ${rx1} ${ry} 0 0 ${sweep1} 0 ${-ry} 
			A ${rx2} ${ry} 0 0 ${sweep2} 0 ${ry} z`;
	}


	function drawMarks2(parent, n, q, length, inset) {
		// draw the number marks on the clock face
		var m;

		for (let i=0; i<=(n-1); i++) {
			if ((i%q === 0)) { continue; }
			m = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			m.setAttribute('x1', 0);
			m.setAttribute('y1', 0);
			m.setAttribute('x2', 0);
			m.setAttribute('y2', length);
			m.setAttribute('transform', `rotate(${i * (360/n)}) translate(0,${130 - inset})`);
			$(parent).appendChild(m);
		}
	}


	function drawMarks() {
		drawMarks2('#hourMarks',  24, 0, 4, -10);
		drawMarks2('#hourMarks2', 24, 2, 8, -10);
		drawMarks2('#minuteMarks', 60, 0, 5, 0);
		drawMarks2('#sunbeams', 14, 0, 5, 120);
	}


	function pad2(n) {
		// make 2 digits
		return (n < 10) ? ('0' + n) : n;
	}


	function drawNumbers2(parent, n, m, offset, isntbackwards, startAtTop, backed, zeroPad) {
		// draw the numbers on the clock face
		let g, angle, str;
		let p = $(parent);
		let h = parseInt(p.getAttribute('font-size'));
		let angleOffset = startAtTop ? 180 : 0;
		let direction = 1;

		// clear any previous numbers (e.g. if changing direction)
		while (p.firstChild) {
			p.removeChild(p.firstChild);
		}

		// create new numbers
		for (let i=0; i<=n; i+=m) {
			if (i===0) { continue; } // start counting from zero, but don't draw zeros (can't just start at 1, since counting by m)
			g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
			g.setAttribute('x', 0);
			g.setAttribute('y', 0);
			angle = ((i * isntbackwards * direction * (360/n) + angleOffset + 360) % 360); // 0 <= angle < 360
			g.setAttribute('transform', `rotate(${angle}) translate(0,${130 + h * offset})`);

			if (parent === '#hourNumbers') {
				let j = i;
				if (i>12) { j = i-12; }
				str = zeroPad ? pad2(j) : j;
			} else {
				str = zeroPad ? pad2(i) : i;
			}

			if (backed) {
				g.innerHTML = `<circle cx="-2" cy="0" r="${(h*0.833)}" fill="rgba(255,255,255,0.33)" stroke="none" />`;
				g.innerHTML += `<text x="0" y="${(h*0.375)}" transform="rotate(180)">${str}</text>`;
			} else {
				if ((angle >= 90) && (angle <= 270)) {
					g.innerHTML = `<text x="0" y="0" transform="rotate(180)">${str}</text>`;
				} else {
					g.innerHTML = `<text x="0" y="${(h*0.75)}" transform="rotate(0)">${str}</text>`;
				}
			}
			p.appendChild(g);
		}
	}


	function drawNumbers() {
		drawNumbers2('#hourNumbers',   24, 1, 4, -1, false, true, false);
		drawNumbers2('#minuteNumbers', 60, 5, 0.5, 1, true,  false, true);
	}


	function clearDynamicTheme() {
		//reset values
		document.documentElement.setAttribute("data-theme", 'light');
		document.documentElement.style.backgroundColor = '';
		document.body.style.backgroundColor = '';
		// clear section background color
		$All('section.overlay').forEach((o) => { o.style.backgroundColor = ''; });

		$('#hourNumbers').style.fill   = '';
		$('#minuteNumbers').style.fill = '';
	}

	function RGBtoRGBA(s, a) {
		// convert RGB color (a string) to RGBA color
		let s2 = ', ' + a + ')';
		return s.replace(')', s2);
	}

	function updateDynamicTheme() {
		clearDynamicTheme();

		if (sunTimes) {
			getCurrentTimePeriod();
			let p = periods[currentPeriod];
			let isDark = ((currentPeriod <= 2) || (currentPeriod >= 11)) ? true : false;

			if (isDark) {
				document.documentElement.setAttribute("data-theme", 'dark');
				document.documentElement.style.backgroundColor = p[4];
				document.body.style.backgroundColor = p[4];
				$('#hourNumbers').style.fill   = '#000';
				$('#minuteNumbers').style.fill = '#fff';
			} else {
				document.documentElement.style.backgroundColor = p[3];
				document.body.style.backgroundColor = p[3];
			}

			// set section background color
			$All('section.overlay').forEach((o) => {
				o.style.backgroundColor = RGBtoRGBA(document.body.style.backgroundColor, 0.9);
			});

			// get time of next period change
			nextPeriodTime = sunTimes[p[2]];
			if (debug) { console.log(`Next theme update at ${sunTimes[p[2]]}`); }
		}
	}


	function tick(timestamp) {
		// animation loop

		let direction = 1;
		now = new Date();

		seconds = now.getSeconds() + (now.getMilliseconds())/1000;
		vminutes = (seconds * 24) % 60;
		vhours   = seconds * 0.4;
		moonPhase = ((now.getMinutes() + (now.getSeconds()/60))/30) %1 ;

		// move hands
		//secondHand.setAttribute('transform', `rotate(${ seconds * direction * 6 })`); //  6° per second
		minuteHand.setAttribute('transform', `rotate(${ vminutes * direction * 6 })`); //  6° per minute
		disc.setAttribute('transform',   `rotate(${ (vhours-12)  * direction * 15 })`); // 15° per hour
		moonHand.setAttribute('transform', `rotate(${ -direction * (solnoondeg + (moonPhase * 360)) })`); // ~14.5° per hour


		// update timer
		if (!timerStart) { timerStart = vhours || 0; }
		if ((vhours - timerStart) >= 6 || (vhours - timerStart) <0) {
			// update every quarter turn
			getMoonPhase();
			getSunTimes(); // uncomment to animate day length
			// reset
			timerStart = null;
		}

		// first tick
		if (!sunTimes) {
			getMoonPhase();
			getSunTimes();
		}

		// update theme at next period change time
		if ( sunTimes && (now >= nextPeriodTime) ) {
			updateDynamicTheme();
		}

		// we want smooth, so keep ticking
		then = now;
		window.requestAnimationFrame(tick);

	}


	function init() {
		hourHand   = $('#hourHand');
		minuteHand = $('#minuteHand');
		secondHand = $('#secondHand');
		moonHand   = $('#moonHand');
		moonIcon   = $('#moonIcon');
		moonPath   = $('#moonPath');

		clockIconHours   = $('#clockIconHours');
		clockIconMinutes = $('#clockIconMinutes');

		// draw clock
		drawMarks();
		drawNumbers();

		// start clock
		tick();

	}


	return {
		getSunTimes,
		clearSunTimes,
		clearDynamicTheme,
		updateDynamicTheme,
		drawNumbers,
		drawMoonIcon,
		init
	};
})();




window.addEventListener('DOMContentLoaded', FastDemo.init);
