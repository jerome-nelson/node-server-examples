const { createServer } = require("node:http");

const DEFAULT_HOSTNAME = "127.0.0.1";
const DEFAULT_PORT = 3001;

// TODO: Look into best logging format for data analysis
// i.e readbility etc...

// Should have default values
// See: https://developer.mozilla.org/en-US/docs/Glossary/CORS-safelisted_response_header
const DEFAULT_UNSAFELISTED_HEADERS = {
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST',
    'Content-Security-Policy': "default-src 'self'"
};

function enableCORS(request, { host, port, whitelist }) {
    // console.info(`[CORS]: Passed in: ${Object.entries(request.headers)}`);
    // console.info(`[CORS]: Origin Whitelisted: ${ whitelist.includes(request.headers.origin)}, Host listed: ${request.headers.host} === ${host}:${port}`)
    return (
        whitelist.includes(request.headers.origin) ||
        request.headers.host === `${host}:${port}`
    )
        &&
        (
            request.headers?.['sec-fetch-mode'] === 'cors' ||
            request.headers?.['sec-fetch-site'] === 'cross-site'
        );
}


const basicServer = (host = DEFAULT_HOSTNAME, port = DEFAULT_PORT) => {
    const routeConfig = {
        '/': {
            data: `Basic Server`,
            methods: ['GET'],
            status: 200,
            headers: {
                'Content-Type': 'text/plain'
            }
        }
    };
    const defaultOptions = {
        methods: ['GET'],
        'Content-Type': 'application/json',
        status: 200
    }
    // TODO: allow adding to this
    const ALLOWED_DOMAINS = [`http://${host}:${port}`];
    const server = createServer((req, res) => {
        // console.info(`[Server]: Current Method is: ${req.method}. URL: ${req.url}, HOST: ${req.headers.host}`);

        if (enableCORS(req, { host, port, whitelist: ALLOWED_DOMAINS })) {
            // console.info("[CORS]: Enabled");            
            const selectRequestedDomain = ALLOWED_DOMAINS.find(domain => {
                return domain === (req.headers.origin ?? `http://${req.headers.host}`)
            });

            // In case above check fails - there should be a fallback to current host server is on
            res.setHeader("Access-Control-Allow-Origin", selectRequestedDomain || `http://${host}:${port}`);

            // Access-Control-Expose-Headers - Not required but recommended
            res.setHeader("Access-Control-Expose-Headers", `${Object.keys(DEFAULT_UNSAFELISTED_HEADERS).join(",")},Access-Control-Request-Method`);

            // Allow cookies - set via config
            res.setHeader('Access-Control-Allow-Credentials', true);

            // To be set via config
            for (const [name, value] of Object.entries(DEFAULT_UNSAFELISTED_HEADERS)) {
                // console.info(`[CORS]: Set header: ${name}: ${value}`);
                res.setHeader(name, value);
            }

            if (req.method === "OPTIONS") {
                const routeNilMatchRequest = routeConfig?.[req?.url]?.methods && !(routeConfig?.[req?.url]?.methods || []).includes(req.headers['access-control-request-method']);
                if (
                    req.headers['access-control-request-method'] !== DEFAULT_UNSAFELISTED_HEADERS['Access-Control-Allow-Methods'] ||
                    routeNilMatchRequest
                ) {

                    if (routeNilMatchRequest) {
                        // console.info(`[CORS]: Route METHOD for ${req.url} is mismatched`);
                    }
                    res.statusCode = 403;
                    res.end();
                    return;
                }

            }
        }

        if (!routeConfig[req.url]) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
            return;
        }

        if (!routeConfig[req.url]?.methods.includes(req.method)) {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end(`Method not allowed`);
            return;
        }

        if (routeConfig[req.url]?.headers) {
            for (const [name, value] of Object.entries(routeConfig[req.url]?.headers)) {
                // console.info(`[Routing]: Set header: ${name}: ${value}`);
                res.setHeader(name, value);
            }    
        }

        res.setHeader('Content-Type', routeConfig[req.url].headers['Content-Type'] || defaultOptions['Content-Type']);
        res.statusCode = routeConfig[req.url]['status'];
        let data = routeConfig[req.url].data;

        if (!data) {
            console.info(`[Routing]: No data at endpoint ${req.url}`);
            data = JSON.stringify({});
        }

        res.end(routeConfig[req.url]['data']);
    });

    server.listen(port, host, () => {
        console.log(`Server running at http://${host}:${port}/`);
    });

    server.addListener('close', () => {
        console.log(`Server closed`)
    })


    return {
        server,
        addRoute: (url, data = {}, options = {}) => {
            // console.info(`[Routing] Added ${url}`);
            routeConfig[url] = {
                data,
                // Nice to have/Not needed: Maybe add in filter against allowed NODEJS methods 
                methods: options?.methods || defaultOptions['methods'],
                status: options?.status || defaultOptions['status'],
                headers: options?.headers || {}
            }
        }
    };
};

module.exports = { basicServer }