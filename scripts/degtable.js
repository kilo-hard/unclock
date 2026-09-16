// shortcuts
const $ = document.querySelector.bind(document);
const $All = document.querySelectorAll.bind(document);
const debug = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.search.includes('debug=1');
const version = '4.8.1';

if (debug) { console.info('version: ' + version); }

const App = (function() {
    'use strict';

    let prefersDark   = window.matchMedia('(prefers-color-scheme: dark)');
    let supportsHover = window.matchMedia('(hover: hover)').matches;
    let isPortrait    = window.matchMedia('(orientation:portrait)').matches;
    let isLandscape   = window.matchMedia('(orientation:landscape)').matches;
    let lastSection   = '';

    // app settings - single source of truth for defaults and current values
    let settings = {
        hour12             : true,
        direction          : 1,         // 1 = clockwise, -1 = anticlockwise
        setLocationManually : false,
        location           : null      // { latitude, longitude }
    };

    const geoOptions = {enableHighAccuracy: true, timeout: 5000, maximumAge: 0};
    const geoErrors = ['', 'PERMISSION_DENIED', 'POSITION_UNAVAILABLE', 'TIMEOUT'];


    /* --- resize --- */

    function handleResize(e) {
        // on resizing (esp. orientation change), make sure #info1 is visible
        // otherwise if you go from portrait to landscape (on touch devices) with #info2 visible then #info1 stays hidden
        // n.b. Screen.orientation does not work in Safari < 16.4
        $('#info1').style.display = 'block';
        //$('#info2').style.display = 'none';
    }

    function showInfo(str) {
        // show info2 + hide info1 if portrait
        if (isPortrait) { $('#info1').style.display = 'none'; }
        $('#info2').style.display = 'block';
        $('#info2').innerHTML = str + '\n<p class="done"><a href="#">ok</a></p>';
        $('p.done').onclick = (e) => { e.preventDefault(); hideInfo(); };
    }

    function hideInfo() {
        // hide info2 + show info1 if portrait
        if (isPortrait) { $('#info1').style.display = 'block'; }
        $('#info2').style.display = 'none';
        $('#info2').innerHTML = '';
    }




    /* --- local storage --- */

    function storageAvailable(type) {
        // check if localStorage is both supported and available
        // source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
        let storage;
        try {
            storage = window[type];
            const x = "__storage_test__";
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch (e) {
            return (
                e instanceof DOMException &&
                // everything except Firefox
                (e.code === 22 ||
                // Firefox
                e.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                e.name === "QuotaExceededError" ||
                // Firefox
                e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
                // acknowledge QuotaExceededError only if there's something already stored
                storage &&
                storage.length !== 0
            );
        }
    }

    function setItem(itemName, value) {
        // save item to browser local storage
        if (storageAvailable('localStorage')) {
            localStorage.setItem(itemName, value);
        }
    }

    function getItem(itemName) {
        // get item from browser local storage
        if (storageAvailable('localStorage')) {
            return JSON.parse(localStorage.getItem(itemName));
        }
    }


    /* --- options (settings) --- */

    function syncFormFromSettings() {
        $('input[name="hour12"]').checked             = settings.hour12;
        $('input[name="setLocationManually"]').checked = settings.setLocationManually;
        if (settings.location) {
            $('input[name="latitude"]').value  = settings.location.latitude;
            $('input[name="longitude"]').value = settings.location.longitude;
        }
        $('#setLocation').style.display  = settings.setLocationManually ? 'block' : 'none';
    }


    function loadOptions() {
        if (!storageAvailable('localStorage')) {
            $('#settingsForm').insertAdjacentHTML('beforebegin', '<p class="error"><strong>Storage not available: settings can not be&nbsp;saved!</strong></p>');
            return;
        }

        // Overwrite settings from localStorage where values exist
        const keys = Object.keys(settings);
        for (const key of keys) {
            const stored = getItem(key);
            if (stored !== null) {
                settings[key] = stored;
            }
        }

        syncFormFromSettings();
    }

    function setOption(e) {
        const input = e.target;
        let key = input.name;
        let value = input.checked;

        if (input.type === 'radio') {
            key = (input.name === 'setDirection') ? 'direction' : (input.name === 'setColorScheme') ? 'colorScheme' : input.name;
            value = (input.name === 'setDirection') ? (input.value === 'clockwise' ? 1 : -1) : input.value;
        }

        if (debug) { console.log(key, value); }

        // Update settings
        if (settings.hasOwnProperty(key)) {
            settings[key] = value;
        } else {
            if (debug) { console.error('Unknown option: ' + key); }
            return;
        }

        // Save (stringify colorScheme and location for JSON round-trip)
        if (key === 'colorScheme' || key === 'location') {
            setItem(key, JSON.stringify(settings[key]));
        } else {
            setItem(key, settings[key]);
        }

        // Special handling for setLocationManually: when unchecked, fetch location from geolocation
        if (key === 'setLocationManually' && !value) {
            getLocation();
        }

        // Special handling for setDirectionManually: when unchecked, derive direction from latitude
        if (key === 'setDirectionManually' && !value) {
            if (settings.location && settings.location.latitude !== undefined) {
                settings.direction = (settings.location.latitude >= 0) ? 1 : -1;
            } else {
                settings.direction = 1;
            }
            setItem('direction', settings.direction);
        }

        // Special handling for setLocationManually: when checked, show current location
        if (key === 'setLocationManually' && value && settings.location) {
            syncFormFromSettings();
            showLocation({ coords: settings.location });
        }

        syncFormFromSettings();
        //applySettingsToDOM();
    }


    /* --- location --- */

    function updateLocation(form) {
        // handle location form submit
        const lat = parseFloat(form.latitude.value);
        const lng = parseFloat(form.longitude.value);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            alert('Please enter valid coordinates. Latitude: -90 to 90. Longitude: -180 to 180.');
            return false;
        }

        settings.location = { latitude: lat, longitude: lng };
        setItem('location', JSON.stringify(settings.location));
        showLocation({ coords: settings.location });
        return false;
    }

    function getLocation() {
        // get location from localStorage or Geolocation API
        if (settings.setLocationManually) {
            showLocation({ coords: settings.location });
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showLocation, showLocationError, geoOptions);
        } else {
            showLocationError({message: 'Geolocation is not supported. Please set location manually.'});
        }
    }

    function showLocation(position) {
        // show location then get times
        let location = position.coords;
        settings.location = location;
        if (debug) { console.log(location); }

        if (location) {
            $('#location').innerHTML = `Location:
            ${Math.abs(location.latitude.toFixed(3))}°${(location.latitude >=0) ? 'N' : 'S'},
             ${Math.abs(location.longitude.toFixed(3))}°${(location.longitude >=0) ? 'E' : 'W'}`;
             //<br><small>(Accuracy: ${location.accuracy} m)</small>`;

             // get times for this location
             SunClock.getSunTimes();

        } else {
            $('#location').innerHTML = 'Location not set';
            clearLocation();
        }
    }

    function showLocationError(err) {
        if (debug) { console.error(err); }
        $('#location').innerHTML = `Location error: ${err.message || geoErrors[err.code]}`;
        clearLocation();
    }

    function clearLocation() {
        // clear previous (e.g. if going from location to no location)
        settings.location = null;
        $('#mainTimes').innerHTML = '';
        $('#info2').innerHTML = '';
        $('#allTimes table tbody').innerHTML = '';

        // update times from clock
        SunClock.clearSunTimes();
    }


    /* --- date and time formatting --- */

    function zeroPad(num, n) {
        // zero pad number
        return num.toString().padStart(n, '0');
    }

    function formatDateUTC(d) {
        // format date in UTC (ISO-8601)
        if (d == 'Invalid Date') { return 'Does not occur'; }

        //return d.toISOString(); // overly precise — construct myself
        let date = new Date( Math.round(d/60000) * 60000 ); // round to nearest minute
        let yyyy = date.getUTCFullYear();
        let mm   = zeroPad(date.getUTCMonth()+1, 2);
        let dd   = zeroPad(date.getUTCDate(), 2);
        let HH   = zeroPad(date.getUTCHours(), 2);
        let MM   = zeroPad(date.getUTCMinutes(), 2);
        return `${yyyy}-${mm}-${dd}<span>T</span>${HH}:${MM}Z`;
    }

    function formatAllTimes(d) {
        // shows time + timezone
        // if time is yesterday or tomorrow, also show the date (in compact form)
        if (d == 'Invalid Date') { return 'Does not occur'; }

        let now  = new Date();
        let date = new Date( Math.round(d/60000) * 60000 ); // round to nearest minute
        let yyyy = date.getUTCFullYear();
        let mm   = zeroPad(date.getMonth()+1, 2);
        let dd   = zeroPad(date.getDate(), 2);

        let timeOptions = {
            hour: "numeric",
             minute: "numeric",
             timeZoneName: "short",
             //hour12: settings.hour12, // hour12 is broken in Chrome (12:00 shows as 0:00), so:
             hourCycle: (settings.hour12) ? 'h12' : 'h23'
        };

        if (date.getDate() === now.getDate()) {
            return date.toLocaleTimeString([], timeOptions);
        }
        return `${yyyy}-${mm}-${dd}<br>${date.toLocaleTimeString([], timeOptions)}`;
    }

    function formatDate(d) {
        // format date in local time
        if (d == 'Invalid Date') { return 'Does not occur'; }

        let date = new Date( Math.round(d/60000) * 60000 ); // round to nearest minute
        let dateOptions = {
            dateStyle: 'full',
        };
        let timeOptions = {
            hour: "numeric",
             minute: "numeric",
             timeZoneName: "short",
             //hour12: settings.hour12, // hour12 is broken in Chrome (12:00 shows as 0:00), so:
             hourCycle: (settings.hour12) ? 'h12' : 'h23'
        };
        return `${new Intl.DateTimeFormat(undefined, dateOptions).format(date)}<br>
        ${new Intl.DateTimeFormat(undefined, timeOptions).format(date)}`;
    }

    function formatTime(t) {
        // local time, in 12 or 24 hour format, rounded to nearest minute
        if (t == 'Invalid Date') { return 'Does not occur'; }

        let time = new Date( Math.round(t/60000) * 60000 ); // round to nearest minute
        let timeOptions = {
            hour: "numeric",
             minute: "numeric",
             //hour12: settings.hour12, // hour12 is broken in Chrome (12:00 shows as 0:00), so:
             hourCycle: (settings.hour12) ? 'h12' : 'h23'
        };
        //return t.toLocaleTimeString(); // hh:mm:ss
        return time.toLocaleTimeString([], timeOptions);
    }


    /* --- initialise --- */

    function init() {
        // load settings from localStorage
        loadOptions();

        // initialise the clock and calendar
        SunClock.tick();




        // handle resize events
        window.addEventListener('resize', handleResize);

        // handle form input onchange events
        $All('#settingsForm input:not([type="number"])').forEach(input => { input.addEventListener('change', setOption); });

        // finally, get location (so geolocation prompt doesn't block)
        getLocation();
    }

    return {
        settings,
        showInfo,
        hideInfo,
        formatDateUTC,
        formatAllTimes,
        formatDate,
        formatTime,
        setOption,
        updateLocation,
        init
    };
})();





const SunClock = (function() {
    'use strict';

    const tau = 2 * Math.PI;

    let now, then, timerStart;
    let hours, minutes, seconds;
    let sunTimes, sunPosition, noonPosition, nadirPosition, sunAlwaysUp, sunAlwaysDown;


    function getEarlier(time) {
        // get now - 24 hours
        return new Date(time.valueOf() - 86400000);
    }
    function getLater(time) {
        // get now + 24 hours
        return new Date(time.valueOf() + 86400000);
    }

    function getSunTimes(whichTime) {
        // get times from suncalc.js
        let location = App.settings.location;
        let targetDate
        if (!location) { return; }
        if ( (!whichTime) || (whichTime == 0) ) {targetDate = now}
            else if (whichTime < 0) {targetDate = getEarlier(sunTimes.solarNoon) }
            else if (whichTime > 0) {targetDate = getLater(sunTimes.solarNoon) };
        if (debug) {
                console.log(`whichTime: ${whichTime}`);
                console.log(`targetDate: ${targetDate}`);
        };
        if(!targetDate) {debugger};
        sunTimes = null;
        sunTimes = SunCalc.getTimes(targetDate, location.latitude, location.longitude, 0);
        // get the sun times for the next day so I can get the next nadir
        // (can't just add 24 hrs to first one, or hack SunCalc.js (nadir2: fromJulian(Jnoon + 0.5))
        sunTimes.nadir2 = SunCalc.getTimes(getLater(sunTimes.solarNoon), location.latitude, location.longitude, 0).nadir;

        if (debug) {
            console.log(`now: ${now}`);
            console.log(`location: ${location.latitude}, ${location.longitude}`);
            console.log(sunTimes);
        }

        // write times to table and below date
        writeMainTimes();
        writeAllTimes();
        writeDate();
    }

    function clearSunTimes() {
        // clear all times - called by App.clearLocation();
        sunTimes = null;
    }

    function writeMainTimes() {
        // write subset of times below date
        let subset = ['solarNoon']; // subset of times to show below location
        if (!sunTimes) { return; }

        $('#mainTimes').innerHTML = '';
        for (let i=0; i<subset.length; i++) {
            $('#mainTimes').innerHTML += `${subset[i]}: <span class="nobr">${App.formatTime(sunTimes[subset[i]])}</span><br>`;
        }
    }

    function writeAllTimes() {
        // write all times to table
        let amtime;
        let pmtime;
        $('#allTimes table tbody').innerHTML = '';
        for (let i=30; i>=-10; i--) {
            amtime = `am${i<0 ? "neg" : "" }${Math.abs(i)}`;
            pmtime = `pm${i<0 ? "neg" : "" }${Math.abs(i)}`;
            $('#allTimes table tbody').innerHTML += `<tr><td>${App.formatTime(sunTimes[amtime])}</td><td><center>${i}</center></td><td>${App.formatTime(sunTimes[pmtime])}</td></tr>`;
        }

    }

    function writeDate() {
        if (!sunTimes) { return; }
        // write the date to info1
        $('#dateText').innerHTML = `${sunTimes.solarNoon.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
    }


    function tick(timestamp) {

        now = new Date();
        let clockIconHours, clockIconMinutes;

        seconds = now.getSeconds() + (now.getMilliseconds())/1000;
        if (!App.settings.sweepHand) { seconds = Math.round(seconds); } // round to nearest second if not sweeping
        minutes = now.getMinutes() + seconds/60;
        hours   = now.getHours()   + minutes/60;

        // moon phase update timer
        if (!timerStart) { timerStart = now.getMinutes() || 0; }
        if ((now.getMinutes() - timerStart) >= 30 || (now.getMinutes() - timerStart) <0) {
            // update moon phase every 30 minutes — does not need to be recalculated each frame
            // 29.53 days per 360° phase change = ~12.2° per day = ~0.51° per hour = ~0.0085° per minute (i.e. even every minute is excessive!)
            //getMoonPhase();
            // reset
            timerStart = null;
        }

        // check if device clock has been changed
        // if the time/date has changed we need to get the moon phase and update the moon position on the next tick
        // (n.b. the timer above won't detect this)
        //if ( then && (Math.abs(now - then) > 60000) ) {
        //    //getMoonPhase();
        //    getSunTimes();
        //    writeDate();
            //SunCalendar.update(); // force calendar to update also
        //}

        // update the sun times at midnight
        if ( then && (now.getDate() !== then.getDate()) ) {
            if (debug) { console.log('midnight: updating sun times!'); }
            getSunTimes();
            //writeDate(); redundant, now included in getSunTimes
        }

        // update the sun times at solar midnight
        //if ( then && sunTimes && (now >= sunTimes.nadir2) ) {
        //    if (debug) { console.log('solar midnight: updating sun times!'); }
        //    getSunTimes();
        //}

        // redraw time periods if the time zone changes (e.g. daylight savings changes)
        if ( then && (now.getTimezoneOffset() !== then.getTimezoneOffset()) ) {
            if (debug) { console.log('time zone change: redrawing time periods!'); }
            //drawTimePeriods();
        }

        // write date on first tick
        //if (!then) { writeDate(); }

        then = now;
        now = new Date(); // get new now, in case the above takes more than a few milliseconds
        setTimeout(tick, 31000 - now.getMilliseconds());

    }

    return {
        getEarlier,
        getLater,
        getSunTimes,
        clearSunTimes,
        writeMainTimes,
        writeAllTimes,
        writeDate,
        tick,
        sunTimes
    };
})();











window.addEventListener('DOMContentLoaded', App.init);



