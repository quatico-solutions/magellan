Feature: Addon registration

    Developer can add compiler addon by placing an ES module in the addon folder containing 
    an addon.ts file with an exported function `activate`.

    Scenario: Register a valid "transformer" addon with default configuration
        Given a valid project with functions is configured
        And a valid module addon module with directory "foobar" exists
        When the compiler is created
        And the command "compile" is called
        Then the CompilationContext contains a transformer with name "foobar"
