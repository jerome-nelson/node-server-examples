const http = require('node:http');
const { basicServer } = require("./server");

console.log = (_msg) => { return; }

const HOSTNAME = "127.0.0.1";
const PORT = 4002;
const startServer = (hostname, port) => basicServer(hostname, port);

function assertServer(assert, hostname = HOSTNAME, port = PORT) {
    const waitForResult = function (start, cb) {
        const checkIfSendCb = setTimeout(() => {
            let instance = start();
            const done = (result, error = '') => {
                console.info(`* ${assert}: ${result} ${error ? `\n  - ERROR: ${error} \n` : ''}`);
                instance.server.close();
            };
            instance.server.on("error", err => {
                // TODO: Find a way to output the msg/error only once
                done(false, err.message);
                return;
            });
            
            cb(instance, done);
            clearTimeout(checkIfSendCb);
        }, 0);
    }
    return waitForResult.bind(null, startServer.bind(null, hostname, port));
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

assertServer(`Server should return a basic response on root domain`)((_, done) => {
    http.get(`http://${HOSTNAME}:${PORT}/`, res => {
        const expectedStatus = res.statusCode === 200;
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
                const expectedResponse = rawData === 'Basic Server';
                done(expectedStatus && expectedResponse);
            } catch (e) {
                console.error(e.message);
                done(false)
            }
        });
    });
});

// Currently not working
assertServer.skip(`Server should be able to setup a GET route`)((instance, _done) => {
    instance.addRoute('/test', 'test-data');
});