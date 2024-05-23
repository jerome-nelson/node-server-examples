const { createServer } = require("node:http");

const basicServer = (HOSTNAME = "127.0.0.1", PORT = 3001) => {
    const server = createServer((_, res) => {
        res.statusCode = 200;

        // TODO: Replace with something nicer
        // TODO: How to test server browsing
        res.setHeader('Content-Type', 'text/plain');
        res.end(`Basic Server &trade; hehehe`);
    });

    server.listen(PORT, HOSTNAME, () => {
        console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
    });

    server.addListener('close', () => {
        console.log(`Server closed`)
    })

    return {
        ...server,

    };
};

module.exports = { basicServer }