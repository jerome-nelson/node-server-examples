const { createServer } = require("node:http");

const DEFAULT_HOSTNAME = "127.0.0.1"; 
const DEFAULT_PORT = 3001;


// Should have default values
// See: https://developer.mozilla.org/en-US/docs/Glossary/CORS-safelisted_response_header
const DEFAULT_UNSAFELISTED_HEADERS = {
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST',
    'Content-Security-Policy': "default-src 'self'"
};

function enableCORS(request, { host, port, whitelist }) {
    // console.info(`[CORS]: Passed in: ${Object.entries(request.headers)}`);
    return (
        whitelist.includes(request.headers.origin) ||
        request.headers.host === `${host}:${port}`
    )
        &&
        // TODO: Temporary for now (review if good idea)
        request.method !== "GET"
        &&
        (
            request.headers?.['sec-fetch-mode'] === 'cors' ||
            request.headers?.['sec-fetch-site'] === 'cross-site'
        );
}


const basicServer = (host = DEFAULT_HOSTNAME, port = DEFAULT_PORT) => {
    const routeConfig = {};
    const defaultOptions = {
        method: 'GET',
        'Content-Type': 'application/json',
        status: 200
    }
    // TODO: allow adding to this
    const ALLOWED_DOMAINS = [`http://${host}:${port}`];
    const server = createServer((req, res) => {
        if (enableCORS(req, { host, port, whitelist: ALLOWED_DOMAINS })) {
            // console.info("[CORS]: is enabled");
            // console.info(`[CORS]: Current Method is: ${req.method}. URL: ${req.url}, HOST: ${req.headers.host}`);
            const selectRequestedDomain = ALLOWED_DOMAINS.find(domain => {
                // console.info("Line: ", domain, req.headers.origin, req.headers.host)
                return domain === (req.headers.origin ?? `http://${req.headers.host}`)});

            if (!selectRequestedDomain) {
                res.statusCode = 405;
                res.end();
                return;
            }
            
            res.setHeader("Access-Control-Allow-Origin", selectRequestedDomain);
    
            // Access-Control-Expose-Headers - Not required but recommended
            res.setHeader("Access-Control-Expose-Headers", `${Object.keys(DEFAULT_UNSAFELISTED_HEADERS).join(",")}, Access-Control-Request-Method`);
    
            // Allow cookies - set via config
            res.setHeader('Access-Control-Allow-Credentials', true);
    
            // To be set via config
            for (const [name, value] of Object.entries(DEFAULT_UNSAFELISTED_HEADERS)) {
                // console.info(`[CORS]: Set header: ${name}: ${value}`);
                res.setHeader(name, value);
            }
    
            // If not preflight then check request
            // if (req.method !== "OPTIONS") {
            //     if (!ROUTES[req.url]) {
            //         res.statusCode = 404;
            //         console.info(`[CORS]: Route not found: ${req.url}`);
            //         res.end("Page not found");
            //         return;
            //     }
    
            //     let data = ROUTES[req.url].data;
    
            //     if (!data) {
            //         console.info(`[CORS]: No data at endpoint ${req.url}`);
            //         data = JSON.stringify({});
            //     }
    
            //     // To be set via config
            //     if (ROUTES[req.url]?.headers) {
            //         for (const [name, value] of Object.entries(ROUTES[req.url].headers)) {
            //             console.info(`[CORS]: Set header: ${name}: ${value}`);
            //             res.setHeader(name, value);
            //         }    
            //     }
    
            //     res.end(data);
            //     return;
            // } else {
            //     // Check if method is legit
            //     // Same should be done for: Access-Control-Request-Headers
            //     if (
            //         req.headers['access-control-request-method'] !== DEFAULT_UNSAFELISTED_HEADERS['Access-Control-Allow-Methods'] ||
            //         ROUTES?.[req?.url]?.methods && !(ROUTES?.[req?.url]?.methods || []).includes(req.headers['access-control-request-method'])
            //     ) {
            //         console.info(`[CORS]: Requested method ${req.headers['access-control-request-method']} is not allowed`);
            //         // Is this the only way to fail CORs if methods / added headers don't match up (WITHOUT checking post request made)
            //         res.statusCode = 403;
            //         res.end();
            //         return;
            //     }
            // }
        }

        if (!routeConfig[req.url]) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`Basic Server`);
            return;
        }

        // CORS Logic
        if (routeConfig[req.url]?.method !== req.method) {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end(`Method not allowed`);
            return;
        }

      
        res.writeHead(routeConfig[req.url]['status'], { 'Content-Type': routeConfig[req.url]['Content-Type'] });
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
        addRoute: (url, data = {}, options) => {
            routeConfig[url] = { 
                data, 
                method: options?.method || defaultOptions['method'], 
                status: options?.status || defaultOptions['status'],
                'Content-Type': options?.['Content-Type'] || defaultOptions['Content-Type']
            }
        }
    };
};

module.exports = { basicServer }