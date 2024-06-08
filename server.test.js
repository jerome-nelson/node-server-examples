const http = require('node:http');
const { basicServer } = require("./server");

console.log = (_msg) => { return; }

const HOSTNAME = "127.0.0.1";
const PORT = 4002;
const startServer = (hostname, port) => basicServer(hostname, port);

function testSuite(description, cb) {
    console.info(`\n# ${description}`);
    cb();
}

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
                // TODO: Remove tab-space and use smth like : console.group
                console.info(`  * ${assert}: ${result} ${error ? `\n  - ERROR: ${error} \n` : ''}`);
                instance.server.close();
            };

            cb(instance, done);
            clearTimeout(checkIfSendCb);
        }, 500);
    }
    return waitForResult.bind(null, startServer.bind(null, hostname, port));
}

function makeRequest(path, { method, headers }, cb) {
    let rawData = '';
    const req = http.request(`http://${HOSTNAME}:${PORT}${path}`, { method, headers: headers || {} }, res => {
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
    // TODO: Remove tab
    console.info(`  * SKIPPED: ${assert}`);
    return (_instance, _done) => null;
}

testSuite("Base implementation", () => {
    assertServer.skip(`Server should be running on http://${HOSTNAME}:${PORT}`)((instance, done) => {
        instance.server.addListener("listening", () => {
            done(instance.server.listening === true);
        });
    });

    assertServer.skip(`Server should return a basic response on root domain`)((_, done) => {
        makeRequest(`/`, { method: 'GET' }, (res, data) => {
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
    assertServer.skip(`Server should be able to setup a GET route`)((instance, done) => {
        instance.addRoute('/test', 'test-data', { method: 'GET' });
        makeRequest(`/test`, { method: 'GET' }, (res, data) => {
            if (res && data) {
                done(data === 'test-data');
                return;
            }
            done(false);
        });
    });

    assertServer.skip(`Should respond with default method and status if not given`)((instance, done) => {
        instance.addRoute('/test', 'test-data');
        makeRequest(`/test`, { method: "GET" }, (res, data) => {
            if (res && data) {
                done(data === 'test-data');
                return;
            }
            done(false);
        });
    });
});

testSuite("CORS Integration", () => {

    // TODO: Spoof request and see if it passes
    // Check list:
    // 1. If Origin is specified (not 100% reliable) / 
    // 2. If HOST is not the same as the Server
    // 3. If SEC_FETCH_MODE is set to 'cors'
    // 4. IF SEC_FETCH_SITE is set to 'cross-site'

    // const selectRequestedDomain = ALLOWED_DOMAINS.find(domain => domain === (req.headers.origin || `http://${req.headers.host}`));
    // res.setHeader("Access-Control-Allow-Origin", selectRequestedDomain);

    // // Access-Control-Expose-Headers - Not required but recommended
    // res.setHeader("Access-Control-Expose-Headers", `${Object.keys(DEFAULT_UNSAFELISTED_HEADERS).join(",")}, Access-Control-Request-Method`);

    // // Allow cookies - set via config
    // res.setHeader('Access-Control-Allow-Credentials', true);

    assertServer(`triggers if origin OR hostname match AND if http fetch headers are specific values`)((_, done) => {
        makeRequest(`/`, { method: "POST", headers: { host: `${HOSTNAME}:${PORT}`, 'sec-fetch-mode': 'cors' } }, res => {
            const expectedHeaders = {
                "Access-Control-Allow-Origin": `http://${HOSTNAME}:${PORT}`,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Expose-Headers": "Access-Control-Allow-Headers,Access-Control-Allow-Methods,Content-Security-Policy, Access-Control-Request-Method",
                'Access-Control-Allow-Headers': 'content-type',
                'Access-Control-Allow-Methods': 'POST',
                'Content-Security-Policy': "default-src 'self'"
            };
            if (res) {
                const hasEveryHeaderSet = Object.entries(expectedHeaders).every(([key, value]) => {
                    return res.headers?.[key.toLowerCase()] && res.headers?.[key.toLowerCase()] === value;
                });
                done(hasEveryHeaderSet);
                return;
            }
            done(false);
        })
    });

    assertServer.skip(`CORS: Should respond with a 405 if incorrect method is used`)((instance, done) => {
        instance.addRoute('/test', 'test-data');
        makeRequest(`/test`, { method: "POST" }, (res) => {
            if (res) {
                const checkStatus = res.statusCode === 405 && data === 'Method not allowed';
                done(checkStatus);
                return;
            }
            done(false);
        });
    });

    // assertServer.skip(`Should respond with a CORS header IF specified`)((instance, done) => {

    // });
})
