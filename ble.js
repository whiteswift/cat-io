var Keen = require('keen.io');
var tessel = require('tessel');
var gpsLib = require('gps-a2235h');


// var portToUse = 'C';
//
// if (!tessel.port[portToUse]) {
//   portToUse = 'A';
// }

var gps = gpsLib.use(tessel.port['A']);

// Configure instance. Only projectId and writeKey are required to send data.
var client = Keen.configure({
    projectId: "",
    writeKey: "",
    readKey: "",
    masterKey: ""
});

// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/


// BLUETOOTH

/*************************************************
This basic example scans for Bluetooth low energy
peripherals and prints out details when found
*************************************************/

var noble = require('noble');
var macs = [];
// USB modules don't have to be explicitly connected

// Wait for the module to report that it is powered up first
noble.on('stateChange', function(state) {
    if (state === 'poweredOn') {
        console.log('beginning to scan...');
        // Begin scanning for BLE peripherals
        noble.startScanning();
    }
});

// When a peripheral is discovered
noble.on('discover', function(peripheral) {
    // Print out the address
    console.log('peripheral found at:', peripheral.address);
    if (macs.indexOf(peripheral.address) === -1) {
        macs.push(peripheral.address);

        client.addEvent("bluetooth-mac-dump", {
            address: peripheral.address
        }, function(err, res) {
            if (err) {
                console.log('bluetooth mac address FAILED');
            } else {
                console.log(peripheral.address, " sent bluetooth mac address");
            }
        });

        // SEND ALERTS HERE

    } else {
        // Mac address already exists in array, carry on.
    }
});

console.log('waiting for power up...');
client.addEvent("start-up", {
    start: true
}, function(err, res) {
    if (err) {
        console.log('FAILED');
    } else {
        console.log("turned on");
    }
});

// GPS

gps.on('ready', function () {
  console.log('GPS module powered and ready. Waiting for satellites...');
  // Emit coordinates when we get a coordinate fix
  gps.on('coordinates', function (coords) {

    getNetworks(coords)
    // console.log('Lat:', coords.lat, '\tLon:', coords.lon, '\tTimestamp:', coords.timestamp);
  });

});

// WiFi
function getNetworks(coords) {
  tessel.network.wifi.findAvailableNetworks(function(error, networks){
    console.log('start wifi');
    if(!error){

      networks.forEach(function(networkObj){
        // send client to keen
        // console.log(networks[0])
        var quality = 0;
        if (networkObj.quality.split('/')[0] > 0) {
          quality = Number(networkObj.quality.split('/')[0]);
        }
        var network = {
          ssid: networkObj.ssid,
          quality: quality,
          security: networkObj.security === "none" ? true : false,
          location: coords
        };
        console.log(network);
        client.addEvent("wifi-details", network, function(err, res) {
            if (err) {
                console.log('WiFi FAILED');
            } else {
                console.log("WiFi sent");
            }
        });

      })
    } else {
      console.log('WiFi generic error');
    }

  });
}

getNetworks();
