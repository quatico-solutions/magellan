Feature: Magellan CLI commands

    Developers can use various magellan features from command line.

    @skip
    Scenario: Compile command is called with valid project configuration
    Currently broken due to #QUAMAG-53 impacting the server directory setup
        Given valid TypeScript project directory was created
        And directory "./src" was created
        And valid index module file "foobar-index.ts" was created
        And directory "./functions" was created
        And valid FaaS module file "foobar.ts" was created
        When CLI command "compile" is called with arguments ""
        Then directory "lib/client/functions" contains file "foobar.js"
        And directory "lib/client/functions" contains file "foobar.d.ts"
        And directory "lib/server" contains file "foobar.js"
        And directory "lib/server" contains file "foobar.d.ts"

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

    @skip
    Scenario: Compile command is called without any FaaS function in project configuration
    Currently broken due to #QUAMAG-53 impacting the server directory setup
        Given valid TypeScript project directory was created
        And directory "./src" was created
        And valid index module file "foobar-index.ts" was created
        And directory "./functions" was created
        And file "foobar.ts" without FaaS function was created
        When CLI command "compile" is called with arguments ""
        Then directory "lib/client/functions" contains file "foobar.js"
        And directory "lib/client/functions" contains file "foobar.d.ts"
        And directory "lib/server" contains file "foobar.js"
        And directory "lib/server" contains file "foobar.d.ts"