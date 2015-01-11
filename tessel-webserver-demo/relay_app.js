/*
Readouts from tessel to server
	Status of the pump (relay state)
	Status of the lights (relay state)
	Temperature and humidity(extra module)
	Soil moisture (analog read in tessel itself)

Inputs to tessel
	Water pump state (relay)
	Light state (relay)
*/

var relay_port = 'D';

    // HTTP Request routing library
var router = require('tiny-router'),
    // Websocket library
    ws = require("nodejs-websocket"),
    // Use fs for static files
    fs = require('fs'),
    // Use tessel for changing the LEDs
    tessel = require('tessel');
    //Use relay for controlling lights and water flow
	relaylib = require('relay-mono');
	//Instantiate relay object in correct port defined by string relay_port
	relay = relaylib.use(tessel.port[relay_port]); 

relay.on('ready', function relayReady () {
	router
		.use('static', {path: './static'})
		// Use the onboard file system (as opposed to microsd)
		.use('fs', fs)
		// Listen on port 8080
		.listen(8080);
	
	
	 console.log('tiny-router listening');

 
	// When the router gets an HTTP request at /water
	router.get("/water", function(req, res) {
		console.log('water turned on');
		// Toggle the LED (change to water)
		tessel.led[0].toggle();
		// Toggle relay channel 1
    	relay.toggle(2, function toggleOneResult(err) {
      		if (err) console.log("Err toggling 2", err);
    	});
		// Send a response
		res.send(200);
	});

	// When the router gets an HTTP request at /leds/[NUMBER]
	router.get("/lights", function(req, res) {
		console.log('lights toggled');
		// Toggle relay channel 1
		relay.toggle(1, function toggleOneResult(err) {
			if (err) console.log("Err toggling 1", err);
		});
	  	// Toggle the LED (turn on lights)
	  	tessel.led[1].toggle();
	  	// Send a response
	  	res.send(200);
	});
});