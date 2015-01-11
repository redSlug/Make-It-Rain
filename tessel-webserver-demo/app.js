// Global utility for debugging
var util = require('util');


// Load and immediately run tesselate module
require('tesselate')({                          // tesselate handles race condition for us and initilizes module hw
    modules: {
        A: ['climate-si7020', 'climate'],        // load climate-si7020 alias climate on port A
        //B: ['accel-mma84', 'accel']           // load accelerometer module, aliased as ‘accel’ on port B
        D: ['relay-mono', 'relay']            // relay handles the light and the flow of water
},
development: true              // enable development logging, useful for debugging
}, function(tessel, modules){

    // returns tessel to you as 'tessel'
    // returns your modules to you as properties of object m
    // refer to the IR module as m.ir, or the accelerometer module as m.accel

    //modules.relay = require('./fake_relay.js'); // comment this out when deploying
    //console.log(modules.relay);

    tessel.led[0].output(1);
    tessel.led[1].output(1);
    tessel.led[2].output(0);

    var router = require('tiny-router');        // web server used to route requests to callback functions
    var fs = require("fs");                     // file system
    start_server(tessel, modules, router, fs)
});


function get_climate_data(modules, res, send_climate){
    //console.log("in beginning of get climate data");
    var our_climate_var;
    climate = modules.climate;
    climate.readTemperature('f', function (err, temp) {             // f means use fahrenheit
        climate.readHumidity(function (err, humid) {
            //weather_string = 'Degrees:', temp.toFixed(4) + 'F', 'Humidity:', humid.toFixed(4) + '%RH';
            //console.log('Degrees:', temp.toFixed(4) + 'F', 'Humidity:', humid.toFixed(4) + '%RH');
            our_climate_var = {"temperature": temp, "humidity": humid};
            send_climate(our_climate_var, res);
            //console.log("just made send_climate callback");
        });
    });
    //console.log("leaving get_climate_data");
}


function start_server(tessel, modules, router, fs){  // passing in tessel for dependency injection

    //console.log('app.js running');
    var relay = modules.relay;
    //relay.toggle();


    // The router should use our static folder for client HTML/JS
    router
        .use('static', {path: './static'})
        // Use the onboard file system (as opposed to microsd)
        .use('fs', fs)
        // Listen on port 8080
        .listen(8080);
    //console.log('tiny-router listening');


    // When the router gets an HTTP request at /leds/[NUMBER]
    router.get("/leds/{led}", function(req, res) {  // what to do when router calls request for LEDs
        led_button_click(req, res, modules, tessel);
    }); // just pass the name of the funtion

    // When the router gets an HTTP request at /water
    router.get("/water", function(req, res) {
        toggle_water(res, tessel, relay);
    });

    // When the router gets an HTTP request at /leds/[NUMBER]
    router.get("/lights", function(req, res) {
        toggle_lights(res, tessel, relay)
    });

    // visual indicator that server is up
    //console.log('Running Server');
    tessel.led[0].output(0);
    tessel.led[1].output(0);
    tessel.led[2].output(0);
}

function toggle_lights(res, tessel, relay){
    //console.log('lights toggled');
    tessel.led[1].toggle();
    // Toggle relay channel 1
    relay.toggle(1, function toggleOneResult(err) {
        if (err) console.log("Err toggling 1", err);
    });
    // Toggle the LED (turn on lights)
    // Send a response
    res.send(200);
}


function toggle_water(res, tessel, relay){
    //console.log('water turned on');
    // Toggle the LED (change to water)
    tessel.led[0].toggle();
    // Toggle relay channel 2
    //console.log(util.inspect(relay));
    relay.toggle(2, function toggleOneResult(err) {
        if (err) console.log("Err toggling 2", err);
    });
    // Send a response
    res.send(200);
}

function led_button_click(req, res, modules, tessel){
    //console.log("button click");
    // this code gets executed when there is a call back
    //console.log('which led?', req.body.led)
    // Grab the LED being toggled
    var index = req.body.led;
    // Toggle the LED
    tessel.led[index].toggle();
    // Send a response

    get_climate_data(modules, res, send_climate_data);
}

function send_climate_data(climate_info, res){
    //console.log("in send climate data function");
    //console.log(util.inspect(climate_info));

    var string_to_send = JSON.stringify(climate_info);

    res.writeHead(200, {"Content-Type": "text/json"});
    res.write(string_to_send);
    res.end();
}