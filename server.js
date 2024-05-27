const { createServer } = require("node:http");

const setupRoutes = (server) => {
    const defaultOptions = {
        method: 'GET',
        'Content-Type': 'application/json',
        status: 200
    }

    return {
        // TODO: Is this performant or there a major cost to adding listeners for each endpoint
        addRoute: (url, data, options = defaultOptions) => {
            server.on('request', (request, res) => {
                if (request.url === url && request.method === options.method) {
                    res.writeHead(options.status, { 'Content-Type': options['Content-Type'] });
                    res.end(JSON.stringify({ data }));
                }
            });
        }
    }
}

const basicServer = (HOSTNAME = "127.0.0.1", PORT = 3001) => {
    const server = createServer((_, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`Basic Server`);
    });

    server.listen(PORT, HOSTNAME, () => {
        console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
    });

    server.addListener('close', () => {
        console.log(`Server closed`)
    })

    const { addRoute } = setupRoutes(server);

    return {
        server,
        addRoute
    };
};

module.exports = { basicServer }