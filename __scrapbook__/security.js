const { createServer } = require("node:http");

//  REquirements:
// 1. Enable OPTIONS checks and return 204 if all checks out
//  ii. What should the failure equal
// 2. IF options checks out then allow request
//  i. Again what should the failure return? (It should not be recognisable as a CORS issue in response [so shoukdn't browser take care of this?])

//  Testing CORS and CSP
const HOSTNAME = "127.0.0.1";
const PORT = 3001;
const start = () => createServer((_, res) => {
    // writeHead doesn't allow retrieval by setHeaders, but if setHEaders is called then ALL Headers are retrievable
    // (Poor implementation)
    // https://nodejs.org/api/http.html#responsewriteheadstatuscode-statusmessage-headers
    res.setHeader( 'Access-Control-Allow-Origin', 'https://foo.example'); // Logic to enable this should be coded)
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
        fetch("https://code.jquery.com/jquery-3.7.1.slim.js")
            .then(data => console.log("Data", data))
            .catch(error => console.error("Error happened:", error))
    })()</script>
    `);
});



const instance = start();

// Finish should used, since HEaders are not finalised until response has finished(? what does that mean)
// Req: IncomingMessage type https://nodejs.org/api/http.html#class-httpincomingmessage
// Res: ServerResponse type https://nodejs.org/api/http.html#class-httpserverresponse
instance.addListener('request', (req, res) => {
    const enableCors = res.hasHeader('Access-Control-Allow-Origin') && 
        res.getHeader('Access-Control-Allow-Origin') && 
        res.getHeader('Access-Control-Allow-Origin') !== "*";

    if (enableCors && req.headers.host !== res.getHeader('Access-Control-Allow-Origin')) {
        console.log(`CORS check should be triggered here. Host is: ${req.headers.host} but Server only allows: ${res.getHeader('Access-Control-Allow-Origin')}`)
 
        // Questions
        // 1. How does OPTIONS work/get triggered
        // 2. What should be the responses for success/failure?
        // 3. Can preflight succeed but response fail?
    }
    //     // console.log("Triggered")
    //             // Problem: Need to manually setHeaders - can be a pain
    //             res.setHeader('Content-Type', "text/plain");
    //             // Problem: Need to set this manually
    //             res.statusCode = 500;
    //     res.end("CORS Bruh");
    // }
});

instance.listen(PORT, HOSTNAME, () => {
    console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
});