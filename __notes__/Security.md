### CSP
1. HEader / Meta tag that allows/prevents page resources being loaded/executed on a per-domain basis
    - Keep in mind: covers inline scripts as well
    - Can be used to allow on a per-protocol basis as well
2. Browser clients can also be served a `report-to` directive? Which specifies a url to which reports of violations can be sent
    - Would be great to test this
        * How does it get triggered?
        * Is it automatic?
        * Is each browser the same?
3. Difference from CORS: is about already fetched page resources, CORS refers to server responses directly
#### Conclusion
Isn't needed until serving browser-based content

### HSTS 
1. Is a browser directive that prevents HTTP access and allows HTTPS access only for a specified time period
    - DOcumentation on MDN specifies that client must've previously accessed the website on HTTPS and received the HSTS headers first
        * Does this cover HTTP -> HTTPS redirection at all? To test

#### Conclusion
Isn't needed either until working on HTTPS connections

### CORS
1. Simple whitelist served via Headers to allow/disallow requests based on origin
    - Can trigger a Preflight request if request is not deemed "simple" (MDN has the rules for that)

#### CORS Flow
Fetch requests:
* NOTE: `no-cors` can be set on request and it will still be sent and given a response (with some kind of restrictions)
(https://fetch.spec.whatwg.org/#concept-filtered-response)[Spec here]
TODO: Investigate seperately (it's not clear what benefit/distinction/use-case for this is)

(SPEC Here)[https://fetch.spec.whatwg.org/#cors-preflight-request]
1. If not set - remove header
2. If set:
    - Add comma-delimited domains
    - OR asterisk
    - If either is set then add a default access-allowed-methods header
        * POST/GET should be set as default allowed (these are the default allowed methods that don't require preflights)
    - If access-allowed-methods is already set then ignore the above
        * Verify that the methods are Node.JS compatible by checking against http module allowed methods
            - If not then throw error and quit server process
3. When request is made
    - If simple request (all requests on the same domain as server OR different domain with no extra added HTTP headers*/requests other than POST/GET)
        * There are exceptions to HTTP Headers as well
    - If Preflight required:
        * OPTIONS request is made first

### Current conclusion
CORs is a good way to consider the security implications needed to secure a server but since checks can be bypassed outside of the browser + the vagueness / open-ended interpretation for failures/successes seems redundant for developers (since this logic will be expanded on in the server logic anyway).