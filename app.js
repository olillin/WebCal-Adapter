const express = require('express');
const fs = require('fs');
const https = require('https');
require('dotenv/config');
const { CAL_URL, PORT } = process.env;
if (!CAL_URL) {
    console.log('No calendar URL has been provided.');
    process.exit();
}

const app = express();
const port = PORT || 443;

app.get('/', (req, res) => {
    res.send('Hello world');
})

app.get('/vklass.ical', (req, res) => {
    try {
        fetch(new URL(CAL_URL)).then(response => {
            if (response.status != 200) {
                res.status(500)
                    .send(`Failed to fetch calendar, code ${response.status}.`);
                return;
            }
            response.text().then(text => {
                let include_location = !!(req.query['location'] ?? false)
                let ics = modify_ics(text, include_location);
                res.socket.end(ics);
            });
        });
    } catch (ConnectTimeoutError) {
        res.status(500)
            .send('Failed to fetch calendar, timed out.');
    }
});

https.createServer({
        key: fs.readFileSync('./key.pem'),
        cert: fs.readFileSync('./cert.pem'),
    }, app )
    .listen(port, () => {
        console.log(`App listening on port ${port}`);
    });

/**
 * @param {string} text
 * @param {boolean} include_location
 * @returns {string}
 */
function modify_ics(text, include_location) {
    // Get calendar events
    let pointer = text.indexOf("BEGIN:VEVENT\r\n");
    while (pointer != -1) {
        pointer += "BEGIN:VEVENT\r\n".length;
        let end = text.indexOf("\r\nEND:VEVENT", pointer);
        
        let event = text.substring(pointer, end);
        let length = event.length;
        // Get summary
        let summaryMatch = event.match( /(?<=SUMMARY:).*?(?=\r\n[A-Z]+:)/s);
        if (summaryMatch) {
            // Create new summary
            let summary = summaryMatch[0];
            summary = capitalize(summary.replace(/ *\([\wåäöÅÄÖ]+\/[\wåäöÅÄÖ]+(-[\wåäöÅÄÖ]+)?\).*$/m, ''));
            // Optional location suffix
            if (include_location) {
                let locationMatch = event.match( /(?<=LOCATION:).*?(?=\r\n[A-Z]+:)/s);
                if (locationMatch && locationMatch[0].match(/\d+(,\d+)*/)) {
                    summary += ' in ' + format_location(locationMatch[0]);
                }
            }

            // Insert new summary
            event = event.substring(0, summaryMatch.index) + summary + event.substring(summaryMatch.index + summaryMatch[0].length);
            text = text.substring(0, pointer) + event + text.substring(pointer+length);
        }
        
        // Find next event
        pointer = text.indexOf("BEGIN:VEVENT\r\n", end+event.length-length);
    }
    return text;
}

/**
 * @param {string} s
 * @returns {string}
 */
function capitalize(s) {
    return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
}

function format_location(location) {
    let locations = location.split('\\,');
    if (locations.length == 1) {
        return 'room ' + locations[0];
    } else {
        return 'rooms ' + locations.slice(0, -1).join('\\, ') + ' and ' + locations.slice(-1);
    }
}