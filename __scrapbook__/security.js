const { createServer } = require("node:http");

//  REquirements:
// 1. Enable OPTIONS checks and return 204 if all checks out
//  ii. What should the failure equal
// 2. IF options checks out then allow request
//  i. Again what should the failure return? (It should not be recognisable as a CORS issue in response [so shoukdn't browser take care of this?])
// 3. Logging
//  i. Consider logging the options that are set
//  Testing CORS and CSP
const HOSTNAME = "127.0.0.1";
const PORT = 3001;
const start = () => createServer((_, res) => {
    // writeHead doesn't allow retrieval by setHeaders, but if setHEaders is called then ALL Headers are retrievable
    // (Poor implementation)
    // https://nodejs.org/api/http.html#responsewriteheadstatuscode-statusmessage-headers
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3001'); // Logic to enable this should be coded)
    res.writeHead(200, {
        'Content-Type': 'text/html',
        // 'Content-Security-Policy': "default-src 'self'" // WOrks out of the box (is implemented by browser), Prevents any media/scripts from being served from any other resource other than own
    })
        .end(`
    Basic CORS/CSP implementation 
    <img src="https://placehold.co/600x400/EEE/31343C" /> 
    <script src="https://code.jquery.com/jquery-3.7.1.slim.js" integrity="sha256-UgvvN8vBkgO0luPSUl2s8TIlOSYRoGFAX4jlCIm9Adc=" crossorigin="anonymous"></script>
    <script>(function () {
        <!-- Works regardless of Header in browser -->
        <!-- Simple FETCH: DOesn't trigger preflight -->
        fetch("https://code.jquery.com/jquery-3.7.1.slim.js")
            .then(data => console.log("Data", data))
            .catch(error => console.error("Error happened:", error))

        <!-- Advanced: Should trigger Pre-flight -->
        const fetchPromise = fetch("http://127.0.0.1:3001/oioio", {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "text/xml",
                "X-PINGOTHER": "pingpong",
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
instance.addListener('request', (req, res) => {
    console.log(`Method is: ${req.method}. URL: ${req.url}, HOST: ${req.headers.host}`);

    if (req.method === "POST" && req.url === "/oioio") {
        console.log("OIOASDASDKGHAJKSDGHJKASd")
    }
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