// Since Node is low-level, I need a way to to make request/responses programmatically without external packages or browsers

// 1. node:net should allow me to make a TCP client (NOT NEEDED)
//  i. node:http already has methods
// 2. How to make GET/POST requests etc... using TCP/IP? (NOT NEEDED)
// 3. Can I module-rise it?

// Works perfectly fine, no need for functions yet
const { get } = require('node:http');

get('http://localhost:3001/get', res => {
    const { statusCode } = res;
    const contentType = res.headers['content-type'];
  
    let error;
    // Any 2xx status code signals a successful response but
    // here we're only checking for 200.
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' +
                        `Status Code: ${statusCode}`);
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error('Invalid content-type.\n' +
                        `Expected application/json but received ${contentType}`);
    }
    if (error) {
      console.error(error.message);
      // Consume response data to free up memory
      res.resume();
      return;
    }
  
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(rawData);
        console.log(parsedData);
      } catch (e) {
        console.error(e.message);
      }
    });
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });