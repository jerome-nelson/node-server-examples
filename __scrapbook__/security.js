const { createServer } = require("node:http");
const process = require('node:process');

//  REquirements:
// 1. (OPTIONS Check is automatic)
//  ii. Failure happens automatically if:
//      a. Fetch is made from HOST that isn't allowed (via Access-Control-Allow-Origin)
//      b. 
// 2. IF options checks out then allow request
//  i. Again what should the failure return? (It should not be recognisable as a CORS issue in response [so shoukdn't browser take care of this?])
// 3. Logging
//  i. Consider logging the options that are set
//  Testing CORS and CSP
// 4. CORS Will be Auto Opt-In (depending on the request given), there's no need to make a plugin (since )
const HOSTNAME = "127.0.0.1";
const PORT = 3001;
// DOMAIN & PROTOCOL WHITELIST 
// Since Access-Control-Allow-Origin is a single header with FQDN (Full Qualified DOmain Name) 
// FYI: Might need to attach protocols dynamically once HTTPS is added
const ALLOWED_DOMAINS = [`http://${HOSTNAME}:${PORT}`, 'http://kubernetes.docker.internal:3001'];

// Should have default values
// See: https://developer.mozilla.org/en-US/docs/Glossary/CORS-safelisted_response_header
const DEFAULT_UNSAFELISTED_HEADERS = {
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST', // Consider arrays in final code
    // Access Control Request Method is only for Browsers (it tells the Server what method will be requested), so it should be used to
    // whitelist the request - can be used AGAINST Access-Control-Allow-Methods
    // 'Access-Control-Request-Method': 'DELETE',
    // Works out of the box (is implemented by browser), Prevents any media/scripts from being served from any other resource other than own
    'Content-Security-Policy': "default-src 'self'"
};

// Already covered by addRoutes
const ROUTES = {
    '/oioio': {
        headers: {
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({ ping: "pong" }),
        methods: ["POST"]
    }
}

// TODO: Spoof request and see if it passes
// Check list:
// 1. If Origin is specified (not 100% reliable) / 
// 2. If HOST is not the same as the Server
// 3. If SEC_FETCH_MODE is set to 'cors'
// 4. IF SEC_FETCH_SITE is set to 'cross-site'
function isValidCorsRequest(request) {
    return (
        ALLOWED_DOMAINS.includes(request.headers.origin) ||
        request.headers.host === HOSTNAME
    )
        &&
        (
            request.headers?.['sec-fetch-mode'] === 'cors' ||
            request.headers?.['sec-fetch-site'] === 'cross-site'
        );
}

const start = () => createServer((req, res) => {
    // writeHead doesn't allow retrieval by setHeaders, but if setHEaders is called then ALL Headers are retrievable
    // (Poor implementation)
    // https://nodejs.org/api/http.html#responsewriteheadstatuscode-statusmessage-headers
    res.setHeader('Content-Type', 'text/html');

    if (isValidCorsRequest(req)) {
        console.info("[CORS]: is enabled");
        console.info(`[CORS]: Current Method is: ${req.method}. URL: ${req.url}, HOST: ${req.headers.host}`);


        // One domain
        // res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3001'); // Logic to enable this should be coded)

        // Any domains - SET OPTION in config to allow this
        // res.setHeader('Access-Control-Allow-Origin', '*'); // Logic to enable this should be coded)

        // Multiple domains
        // Has to be set dynamically upon request
        // (Access-Control-Allow-Origin can only be set to one domain)

        const selectRequestedDomain = ALLOWED_DOMAINS.find(domain => domain === (req.headers.origin || `http://${req.headers.host}`));
        res.setHeader("Access-Control-Allow-Origin", selectRequestedDomain);

        // Access-Control-Expose-Headers - Not required but recommended
        res.setHeader("Access-Control-Expose-Headers", `${Object.keys(DEFAULT_UNSAFELISTED_HEADERS).join(",")}, Access-Control-Request-Method`);

        // Allow cookies - set via config
        res.setHeader('Access-Control-Allow-Credentials', true);

        // To be set via config
        for (const [name, value] of Object.entries(DEFAULT_UNSAFELISTED_HEADERS)) {
            console.info(`[CORS]: Set header: ${name}: ${value}`);
            res.setHeader(name, value);
        }

        // If not preflight then check request
        if (req.method !== "OPTIONS") {
            if (!ROUTES[req.url]) {
                res.statusCode = 404;
                console.info(`[CORS]: Route not found: ${req.url}`);
                res.end("Page not found");
                return;
            }

            let data = ROUTES[req.url].data;

            if (!data) {
                console.info(`[CORS]: No data at endpoint ${req.url}`);
                data = JSON.stringify({});
            }

            // To be set via config
            if (ROUTES[req.url]?.headers) {
                for (const [name, value] of Object.entries(ROUTES[req.url].headers)) {
                    console.info(`[CORS]: Set header: ${name}: ${value}`);
                    res.setHeader(name, value);
                }    
            }

            res.end(data);
            return;
        } else {
            // Check if method is legit
            // Same should be done for: Access-Control-Request-Headers
            if (
                req.headers['access-control-request-method'] !== DEFAULT_UNSAFELISTED_HEADERS['Access-Control-Allow-Methods'] ||
                ROUTES?.[req?.url]?.methods && !(ROUTES?.[req?.url]?.methods || []).includes(req.headers['access-control-request-method'])
            ) {
                console.info(`[CORS]: Requested method ${req.headers['access-control-request-method']} is not allowed`);
                // Is this the only way to fail CORs if methods / added headers don't match up (WITHOUT checking post request made)
                res.statusCode = 403;
                res.end();
                return;
            }
        }
    }

    res.end(`
    Basic CORS/CSP implementation 
    <img src="https://placehold.co/600x400/EEE/31343C" /> 
    <script src="https://code.jquery.com/jquery-3.7.1.slim.js" integrity="sha256-UgvvN8vBkgO0luPSUl2s8TIlOSYRoGFAX4jlCIm9Adc=" crossorigin="anonymous"></script>
    <script>(function () {
        <!-- Works regardless of Header in browser -->
        <!-- Simple FETCH: DOesn't trigger preflight -->
         //fetch("https://code.jquery.com/jquery-3.7.1.slim.js")
          //  .then(data => console.log("Data", data))
           // .catch(error => console.error("Error happened:", error))

        <!-- Advanced: Should trigger Pre-flight -->
        const fetchPromise = fetch("http://127.0.0.1:3001/oioio", {
            method: "POST",
            // mode: "no-cors",
            headers: {
                "Content-Type": "text/xml",
                "Origin": null
            },
            body: "<person><name>Arun</name></person>",
            });

            fetchPromise.then((response) => {
            console.log(response.status);
            })
            .catch((err) => {
                console.log("Test", err);
            })
    })()</script>
    `);
});


const instance = start();



// Finish should used, since HEaders are not finalised until response has finished(? what does that mean)
// Req: IncomingMessage type https://nodejs.org/api/http.html#class-httpincomingmessage
// Res: ServerResponse type https://nodejs.org/api/http.html#class-httpserverresponse

// Better to use callback in createServer, some methods like writeHead cannot be 
// overridden inside listener since Headers are already sent
// Might be better to use it for side-effects that don't mutate response 
instance.addListener('request', (req, res) => {
    // console.log(req.headers);
    // if (
    //     req.headers['']
    //     !req.headers.origin
    // ) {
    //     console.error("[CORS]: Origin not specified - invalid request");
    // }
    // res.statusCode = 500;
    // res.end();
    // corsCheck(req, res);
    // console.log(req.headers);

    if (isValidCorsRequest(req)) {


    }

    // if (req.method === "POST" && req.url === "/oioio") {
    //     console.log("OIOASDASDKGHAJKSDGHJKASd")
    // }
    // const enableCors = res.hasHeader('Access-Control-Allow-Origin') &&
    //     res.getHeader('Access-Control-Allow-Origin') &&
    //     res.getHeader('Access-Control-Allow-Origin') !== "*";

    // if (enableCors && req.headers.host !== res.getHeader('Access-Control-Allow-Origin')) {
    //     console.log(`Method is: ${req.method}. URL: ${req.url}`)
    //     res.statusCode = 403;
    // console.log(`CORS check should be triggered here. Host is: ${req.headers.host} but Server only allows: ${res.getHeader('Access-Control-Allow-Origin')}`)
    // return;
    // Questions
    // 1. How does OPTIONS work/get triggered
    // 2. What should be the responses for success/failure?
    // 3. Can preflight succeed but response fail?
    // }
});

instance.listen(PORT, HOSTNAME, () => {
    console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
});