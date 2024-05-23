const { basicServer } = require("./server");

// remove console log assertions
console.log = (_msg) => { return; }

const HOSTNAME = "127.0.0.1";
const PORT = 4002;
const TEST_SERVER = basicServer(HOSTNAME, PORT);

function assertServer(assert) {
    let finished, result;
    const done = (assert) => {
        finished = true;
        result = assert;
    }

    const waitForResult = function (instance, done, cb) {
        cb(instance, done);

        const timeout = setInterval(() => {
            if (finished) {
                clearInterval(timeout);
                console.info(`\n* ${assert}: ${result}`,);
                instance.close();
                return;
            }
        }, 0);
    }
    return waitForResult.bind(null, TEST_SERVER, done);
}

assertServer(`Server should be running on ${HOSTNAME}:${PORT}`)((instance, done) => {
    instance.addListener("listening", () => {
        if (instance.listening === true) {
            done(instance.listening === true);
        }
    })
});

