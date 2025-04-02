Feature: Magellan CLI commands

    Developers can use various magellan features from command line.

    Scenario: Compile command is called with valid pure function project configuration
    Folder hierarchies are automatically collapsed by TSC if no hierarchy is represented in the import hierarchy yielding a different output structure.
        Given valid TypeScript project directory was created
        And directory "./src/functions" was created
        And valid FaaS module file "foobar.ts" was created
        When CLI command "compile" is called without arguments
        Then directory "lib/client" contains file "foobar.js"
        And directory "lib/client" contains file "foobar.d.ts"
        And directory "lib/server" contains file "foobar.js"
        And directory "lib/server" contains file "foobar.d.ts"

    Scenario: Serve command is called with error throwing function in development environment
        Given valid TypeScript project directory was created
        And directory "./src/functions" was created
        And valid FaaS module file "foobar.ts" was created
        And CLI command "compile" is called without arguments
        And node environment is "development"
        When CLI command "serve" is called without arguments
        And the function "foobar" is invoked
        Then the promise is rejected with message "This should have been replaced".
        And writes console error "This should have been replaced".
        And writes console error "packages/test/output/project/lib/server/foobar.js:6:11)".

    Scenario: Serve command is called with error throwing function in production environment
        Given valid TypeScript project directory was created
        And directory "./src/functions" was created
        And valid FaaS module file "foobar.ts" was created
        And CLI command "compile" is called without arguments
        And node environment is "production"
        When CLI command "serve" is called without arguments
        And the function "foobar" is invoked
        Then the promise is rejected with message "This should have been replaced".
        # And writes no console error. # Temporally disabled until websmith-compiler no longer floods the error console with ts missing files from the Typescript libraries

    Scenario: Serve command is called with valid pure function project configuration
        Given valid TypeScript project directory was created
        And directory "./src/functions" was created
        And valid FaaS module file "echo.ts" was created
        And CLI command "compile" is called without arguments
        When CLI command "serve" is called without arguments
        And the function "echo" is invoked with '{"ping": "expected"}'
        Then the promise is resolved with '{"ping":"expected"}'.
        # And writes no console error. # Temporally disabled until websmith-compiler no longer floods the error console with ts missing files from the Typescript libraries

    Scenario: Serve command is called with valid function and server context in response
        Given valid TypeScript project directory was created
        And directory "./src/functions" was created
        And valid FaaS module file "echoWithCtx.ts" was created
        And CLI command "compile" is called without arguments
        When CLI command "serve" is called without arguments
        And the function "echoWithCtx" is invoked with '{"echo": "expected"}' and x-request-id in context "demo-request-id-1"
        Then the promise is resolved with '{"echo":"expected","requestId":"demo-request-id-1"}'.
        # And writes no console error. # Temporally disabled until websmith-compiler no longer floods the error console with ts missing files from the Typescript libraries