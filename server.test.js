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
                process.exit(1);
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

function makeRequest(url, method, cb) {
    let rawData = '';
    const req = http.request(url, { method }, res => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => { rawData += chunk; });
        // TODO: Refactor this to consider http.ClientRequest instead
        res.on('end', () => {
            try {
                cb(res, rawData);
            } catch (e) {
                console.error(e.message);
                cb(undefined, undefined)
            }
        });
    });

    req.write(rawData);
    req.end();
}

assertServer.skip = (assert, _hostname, _port) => {
    console.info(`* SKIPPED: ${assert}`);
    return (_instance, _done) => null;
}

assertServer(`Server should be running on http://${HOSTNAME}:${PORT}`)((instance, done) => {
    instance.server.addListener("listening", () => {
        done(instance.server.listening === true);
    });
});

assertServer.skip(`Server should return a basic response on root domain`)((_, done) => {
    makeRequest(`http://${HOSTNAME}:${PORT}/`, 'GET', (res, data) => {
        if (res && data) {
            const hasCorrectResponse = data === 'Basic Server';
            const hasCorrectStatus = res.statusCode === 200;
            done(hasCorrectResponse && hasCorrectStatus);
            return;
        }
        done(false);
    });
});

// TODO: Works fine, but need to find solution for:
//  - ERROR: listen EADDRINUSE: address already in use 127.0.0.1:4002 
assertServer(`Server should be able to setup a GET route`)((instance, done) => {
    instance.addRoute('/test', 'test-data', { method: 'GET'});
    makeRequest(`http://${HOSTNAME}:${PORT}/test`, 'GET', (res, data) => {
        if (res && data) {
            done(data === 'test-data');
            return;
        }
        done(false);
    });
});

assertServer.skip(`Should respond with default method and status if not given`)((instance, done) => {
    instance.addRoute('/test', 'test-data');
    makeRequest(`http://${HOSTNAME}:${PORT}/test`, "GET", (res, data) => {
        console.info(res);
        if (res && data) {
            done(data === 'test-data');
            return;
        }
        done(false);
    });
});

assertServer.skip(`Should respond with a 405 if incorrect method is used`)((instance, done) => {
    instance.addRoute('/test', 'test-data');
    makeRequest(`http://${HOSTNAME}:${PORT}/test`, "POST", (res) => {
        if (res) {
            const checkStatus = res.statusCode === 405 && data === 'Method not allowed';
            done(checkStatus);
            return;
        }
        done(false);
    });
});