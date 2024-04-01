const { basicServer } = require("./basic");

function assert(assert, instance) {
    return function (expected) {
        console.log(assert, expected(done, instance))
    }
}

const HOSTNAME = "127.0.0.1";
const PORT = 4002

assert(`Server should be running on ${HOSTNAME}:${PORT}`, basicServer(HOSTNAME, PORT))(done, instance => {

    instance.addListener("listening", () => {
       if(instance.listening === true) {
        // Add promise
        done();
       }
    })
});