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
