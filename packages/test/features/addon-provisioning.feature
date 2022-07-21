Feature: Addon provisioning

    Developers can provide compiler addons by placing an ES module in the addon folder containing 
    an addon.ts file with an exported function `activate`.

    Scenario: Provide a compiler addon with ES module file
        Given a valid project with functions is configured
        And an addon folder "./addons" containing a value addon activator "addon.ts"
        When the compiler is created
        And the command "compile" is called
        Then the activate function of the addon is called

    Scenario: Provide a compiler addon with ES module directory
        Given a valid project with functions is configured
        And an addon folder "./addons" containing a directory "foobar"
        And the folder "foobar" contains an addon activator "addon.ts"
        When the compiler is created
        And the command "compile" is called
        Then the activate function of the addon is called
