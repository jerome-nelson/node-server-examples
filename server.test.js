const http = require('node:http');
const { basicServer } = require("./server");

console.log = (_msg) => { return; }

const HOSTNAME = "127.0.0.1";
const PORT = 4002;
const startServer = (hostname, port) => basicServer(hostname, port);

// Need to review and refactor to consider async nature of calls
//  1. each testSuite cb() should be run and finished before next one is started
//  2. Server tests cannot be run more than two at a time due to connections still running whilst next server instance is being spun up
//  3. Nice to have: Console formatting
//  4. Nice to have: allow skipping of a whole spec by skipping here instead
function testSuite(description, cb) {
    console.info(`\n# ${description}`);
    cb();
}

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
                console.info(`  * ${assert}: ${!!result} ${error ? `\n  - ERROR: ${error} \n` : ''}`);
                instance.server.close();
            };

            cb(instance, done);
            clearTimeout(checkIfSendCb);
        }, 500);
    }
    return waitForResult.bind(null, startServer.bind(null, hostname, port));
}

function makeRequest(path, { host, port, method, headers }, cb) {
    let rawData = '';
    const req = http.request(`http://${host ?? HOSTNAME}:${port ?? PORT}${path}`, { method, headers: headers || {} }, res => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => { rawData += chunk; });
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
});

testSuite("Routing", () => {
    assertServer.skip(`Should respond with a 404 if route is not found`)((_, done) => {
        makeRequest(`/test`, { method: "GET" }, (res, data) => {
            done(res.statusCode === 404 && data === "Not Found");
        });
    });
    assertServer.skip(`Should respond with a 405 if incorrect method is used`)((server, done) => {
        server.addRoute(`/test`, 'oi', { method: "GET" });
        makeRequest(`/test`, { method: "POST" }, (res, data) => {
            if (res) {
                const checkStatus = res.statusCode === 405 && data === 'Method not allowed';
                done(checkStatus);
                return;
            }
            done(false);
        });
    });
    assertServer.skip(`Server should be able to setup a GET route`)((instance, done) => {
        instance.addRoute('/test', 'test-data', { methods: ['GET'] });
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

    assertServer.skip(`headers added to route should be included in response`)((server, done) => {
        server.addRoute('/custom-route', 'testing', { methods: ["GET"], headers: { "X-PING": "PONG" } });
        makeRequest(`/custom-route`, { method: "GET" }, (res) => {
            done(res.statusCode === 200 && res.headers['x-ping'] === "PONG")
        });
    });
});

testSuite("CORS Integration", () => {
    assertServer.skip(`triggers if origin OR hostname match AND if http fetch headers are specific values`)((_, done) => {
        makeRequest(`/`, { method: "POST", headers: { host: `${HOSTNAME}:${PORT}`, 'sec-fetch-mode': 'cors' } }, res => {
            const expectedHeaders = {
                "Access-Control-Allow-Origin": `http://${HOSTNAME}:${PORT}`,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Expose-Headers": "Access-Control-Allow-Headers,Access-Control-Allow-Methods,Content-Security-Policy,Access-Control-Request-Method",
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

    // TODO: Valid test case but does the code reflect this?
    assertServer.skip(`Access-Control-Origin should fallback to the current server host if no domains are whitelisted`, HOSTNAME, 4000)((_, done) => {
        makeRequest(`/`, { port: 4000, method: "POST", headers: { host: `${HOSTNAME}:4000`, 'sec-fetch-mode': 'cors' } }, res => {
            done(res.headers['access-control-allow-origin'] === "http://127.0.0.1:4000");
        })
    });

    assertServer.skip('If origin is not in domain whitelist then domain that server is on should be used')((_, done) => {
        makeRequest(`/`, {
            method: "GET",
            headers: {
                'host': `${HOSTNAME}:${PORT}`,
                'origin': `http://kubernetes.docker.internal:${PORT}`, // TODO: Research which one takes precedence? (origin or host)
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site'
            }
        },
            res => {
                done(res.headers['access-control-allow-origin'] === `http://${HOSTNAME}:${PORT}`);
            }
        );
    });

    assertServer.skip('OPTIONS request method headers should match allowed methods AND route config')((server, done) => {
        server.addRoute('/fake-post', JSON.stringify({}), { methods: ['POST'] });
        makeRequest(`/fake-post`, {
            method: "OPTIONS",
            headers: {
                'access-control-request-headers': 'content-type',
                'access-control-request-method': 'POST',
                'host': `${HOSTNAME}:${PORT}`,
                'origin': `http://kubernetes.docker.internal:${PORT}`, // TODO: Research which one takes precedence? (origin or host)
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site'
            }
        },
            res => {
                const hasCorrectHeader = res.headers['access-control-allow-methods'] === 'POST';
                done(hasCorrectHeader && res.statusCode === 200);
            }
        );
    });

    assertServer('OPTIONS request should return a 403 if requested route doesn\'t explicitly declare the method requested')((server, done) => {
        server.addRoute('/b', "ping", {})
        makeRequest(`/`, {
            method: "OPTIONS",
            headers: {
                'access-control-request-method': 'DELETE',
                'host': `${HOSTNAME}:${PORT}`,
                'origin': `http://kubernetes.docker.internal:${PORT}`, // TODO: Research which one takes precedence? (origin or host)
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site'
            }
        },
            res => {
                done(res.statusCode === 403 && res.headers['content-length'] === '0');
            }
        );
    });

    assertServer.skip('OPTIONS request should also return a 403 if requested method is not allowed, even if route defines it')((server, done) => {
        server.addRoute('/fake-delete', {}, { methods: [
            'DELETE'
        ]});
        makeRequest(`/fake-delete`, {
            method: "OPTIONS",
            headers: {
                'access-control-request-method': 'DELETE',
                'host': `${HOSTNAME}:${PORT}`,
                'origin': `http://kubernetes.docker.internal:${PORT}`, // TODO: Research which one takes precedence? (origin or host)
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site'
            }
        },
            res => {
                done(res.statusCode === 403 && res.headers['content-length'] === '0');
            }
        );
    });
});
