const { createServer } = require("node:http");

// Idea: Is there a way to automatically assign a port here instead
const HOSTNAME = "127.0.0.1";
const PORT = 3001;
const start = () => createServer((_, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Basic Server implementation`);
});
const instance = start();

// IDEAs for integrating and making code re-usable (same approach as expressJs)
// instance.contentType = setHeaders
// instance.get = sharedfunction(status, () => {

// })
// instance.post = sharedfunction

// All requests are passed through here
instance.addListener('request', (req, res) => {
    console.log("Request fired: ", req.url);
    // Problem: Code Smell (since routes are defined manually, code bloat can be increased here)
    if (req.url === '/get') {
        if (req.method.toLowerCase() === "get") {
            res.statusCode = 200;
            res.setHeader('Content-Type', "application/json");
            // Problem: No typing on responses - which should map to content/type
            res.end(JSON.stringify({ test: true }));    
            return;
        }

        // Problem: Need to manually setHeaders - can be a pain
        res.setHeader('Content-Type', "text/plain");
        // Problem: Need to set this manually
        res.statusCode = 500;
        res.end("Not a GET request");

        // Problem: Need to manually invoke returns to prevent responses being sent again
        return;
    }

    if (req.url === '/post') {
        if (req.method === "POST") {
            console.log("POST Req");
            res.setHeader('Content-Type', "application/json");
            res.statusCode = 500;
            res.end(JSON.stringify({}));
            return;
        }

        // FYI: Verify code is correct
        res.statusCode = 500;
    }

    // Idea: A way to set this automatically and only add content-type and response
    // Fallback
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('API route not found: ' + req.url);
})

instance.listen(PORT, HOSTNAME, () => {
    console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
});

module.exports = { start }