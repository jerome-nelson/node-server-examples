const { createServer } = require("node:http");

const basicServer = (HOSTNAME = "127.0.0.1", PORT = 3001) => {
    const routeConfig = {};
    const defaultOptions = {
        method: 'GET',
        'Content-Type': 'application/json',
        status: 200
    }
    const server = createServer((req, res) => {
        if (!routeConfig[req.url]) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`Basic Server`);
            return;
        }

        if (!routeConfig[req.url].method) {
            console.info("Needs a method");
            return;
        }
      
        res.writeHead(routeConfig[req.url]['status'], { 'Content-Type': routeConfig[req.url]['Content-Type'] });
        res.end(routeConfig[req.url]['data']);


    });

    server.listen(PORT, HOSTNAME, () => {
        console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
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