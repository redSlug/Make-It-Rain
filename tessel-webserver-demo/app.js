
// Load and immediately run tesselate module
require('tesselate')({                          // tesselate handles race condition for us
    modules: {
        A: ['climate-si7020', 'climate'],       // load climate-si7020 alias climate on port A
        B: ['accel-mma84', 'accel']             // load accelerometer module, aliased as ‘accel’ on port B
},
development: true              // enable development logging, useful for debugging
}, function(tessel, m){

    // returns tessel to you as 'tessel'
    // returns your modules to you as properties of object m
    // refer to the IR module as m.ir, or the accelerometer module as m.accel

    var router = require('tiny-router');        // web server used to route requests to callback functions
    var fs = require("fs");                     // file system
    //console.log("inspecting");
    //var util_tool = require('util');
    //console.log(util_tool.inspect(fs))
    // console.log(fs);

    start_server(tessel, router, fs)
});


function start_server(tessel, router, fs){  // passing in tessel for dependency injection
    console.log('app.js running');
    // The router should use our static folder for client HTML/JS
    router
        .use('static', {path: './static'})
        // Use the onboard file system (as opposed to microsd)
        .use('fs', fs)
        // Listen on port 8080
        .listen(8080);
    console.log('tiny-router listening');
    // When the router gets an HTTP request at /leds/[NUMBER]
    router.get("/leds/{led}", function(req, res) {
        led_button_click(req, res, tessel);
    }); // just pass the name of the funtion
    console.log('Running Server');
}

function led_button_click(req, res, tessel){
    // this code gets executed when there is a call back
    console.log('which led?', req.body.led)
    // Grab the LED being toggled
    var index = req.body.led;
    // Toggle the LED
    tessel.led[index].toggle();
    // Send a response
    res.send(200);
}

