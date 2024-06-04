### Introduction
This project is an *educational* refresher - meant to gather information and code logic relating to server-browser communication. A secondary goal is to have a basic setup which can be used to quickly test many features without needing any npm packages/external plugins etc...

### Rules
1. Some NodeJS server examples for research - no frameworks or libraries allowed, until features are added.
2. All throughout - keep track of usage and add questions, potential problems

### Scrapbook
Folder containing quick mock ups for requirement gathering

### Node.JS Server Examples

- [x] (Continous) Add tests to cover functionality (tests must be kept maintained throughout project)
- HTTP
    - [x] Basic Server 
    - [x] Create a http server with endpoints for GET, POST
    - [ ] Add CORS option <-- in progress
        - Simple Global domain and method block for now
            * LATER STEPS: Credentials and Route-based cors
    - [ ] Add gzip (compression) option to requests / look for options to add others
- [ ] Add a Logger
- [ ] Add HTTPS
- [ ] Setup up WebSocket 
- [ ] Add Websocket Secure
- [ ] HTTP/2
- [ ] Setup a proxy
- [ ] Create a basic skeleton
    - [ ] Routing middleware
    - [ ] Options to toggle CORs and Logging
- [ ] Add documentation for features and how to use 
- [ ] A simple way to spin up the service
- [ ] Convert to Typescript
    - Make sure all things are typed

### Features
1. Add a MongoDB instance
2. Add a GraphQL instance
3. Add a React SSR instance
    - Add a CSP Policy with a report-to link
4. Deploy to K8S docker swarm stack
    - End result must be re-usable
    

### Review
1. Benchmark code and see if it can be improved on
2. Review remaining comments


## Reading Materials
1. (What is a socket)[https://www.reddit.com/r/learnprogramming/comments/12ifgcf/what_is_a_socket_what_does_it_mean_that_a/]
2. (HTTP Security)[https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP]
3. (CORS)[https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS]
    i. (Express CORS Plugin)[https://github.com/expressjs/cors/blob/master/lib/index.js] (Nice companion to MDN article)
4. (Common MIME Types)[https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types]

### DONE!!