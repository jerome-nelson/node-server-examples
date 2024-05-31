const http = require('node:http');
const { basicServer } = require("./server");

console.log = (_msg) => { return; }

const HOSTNAME = "127.0.0.1";
const PORT = 4002;
const startServer = (hostname, port) => basicServer(hostname, port);

// TODO: Add a timeout
function assertServer(assert, hostname = HOSTNAME, port = PORT) {
    const waitForResult = function (start, cb) {
        const checkIfSendCb = setTimeout(() => {
            let instance = start();
            instance.server.on("error", err => {
                // TODO: Find a way to output the msg/error only once
                done(false, err.message);
                return;
            });

            const done = (result, error = '') => {
                console.info(`* ${assert}: ${result} ${error ? `\n  - ERROR: ${error} \n` : ''}`);
                instance.server.close();
            };
                       
            cb(instance, done);
            clearTimeout(checkIfSendCb);
        }, 500);
    }
    return waitForResult.bind(null, startServer.bind(null, hostname, port));
}

function assertResponse(url, data, cb) {
    http.get(url, res => {
        const expectedStatus = res.statusCode === 200;
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
                const expectedResponse = rawData === data;
                cb(expectedStatus && expectedResponse);
            } catch (e) {
                console.error(e.message);
                cb(false)
            }
        });
    });
}

assertServer.skip = (assert, _hostname, _port) => {
    console.info(`* SKIPPED: ${assert}`);
    return (_instance, _done) => null;
}

assertServer(`Server should be running on http://${HOSTNAME}:${PORT}`)((instance, done) => {
    instance.server.addListener("listening", () => {
        done(instance.server.listening === true);
    })
});

assertServer.skip(`Server should return a basic response on root domain`)((_, done) => {
    assertResponse(`http://${HOSTNAME}:${PORT}/`, 'Basic Server', done);
});

// TODO: Works fine, but need to find solution for:
//  - ERROR: listen EADDRINUSE: address already in use 127.0.0.1:4002 
assertServer(`Server should be able to setup a GET route`)((instance, done) => {
    instance.addRoute('/test', 'test-data');
    assertResponse(`http://${HOSTNAME}:${PORT}/test`, 'test-data', done);
});