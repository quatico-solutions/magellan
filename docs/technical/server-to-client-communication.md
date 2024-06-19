<!--
 ---------------------------------------------------------------------------------------------
   Copyright (c) Quatico Solutions AG. All rights reserved.
   Licensed under the MIT License. See LICENSE in the project root for license information.
 ---------------------------------------------------------------------------------------------
-->
# Response and error propagation of service functions from server to client

magellan supports automatic error propagation from the server executed version of a @service annoted function to the client.

## Data Structure

The following is the server response payload which will automatically be handled by magellan-client and provided to the @service functions promise.

```mermaid
classDiagram
    class ResponsePayload {
        +data?: unknown
        +error?: ResponseError
    }

    class ResponseError {
        +message: string
        +error?: string
    }

    ResponsePayload *-- ResponseError
```

### ResponsePayload

- **data:** function result. Used for the @service functions promise resolution.
- **error:** Error object. Used for the @service functions promise rejection.

### ResponseError

- **message:** Non-technical error message naming failed function. Used as @service function promise reject reason.
- **error:** Full error message including callstack from the server.
  - This field is only provided if NODE_ENV is not `production`.
  - This information will be written to console.error if present.

**Important:** The response received from the server always only includes the field data or error, but never both.

## Flow

```mermaid
sequenceDiagram
    actor Frontend
    Frontend->>Client: invoke @service function
    Client-->>+Server: remote invoke @service annotated function
    Server->>Server: invoke function
    alt execution threw error
        alt NODE_ENV=production
            Server->>Server: create error response {error: {message: "Function request to "${functionName}" failed."}}}
        else
            Server->>Server: create error response {error: {message: "Function request to "${name}" failed.", error: functionError.message}}
        end
    else execution successful
        Server->>Server: create success response {data: functionResult}
    end
    Server-->>-Client: return created response
    alt response contains error
        opt error.error defined?
            Client->>Client: log error field as console error
        end
        Client->>Client: reject function promise with error.message
        Client->>Frontend: communicate function error
    else response was a success
        Client->>Client: resolve function promise with computed function response
        Client->>Frontend: Update visualisation with function response
    end
```

## Response Examples

### Success

```json
{ "data": { "fibonacciValue": 8 } }
```

### Error in production

```json
{
    "error": {
        "message": "Function request to \"calculateFibonacci\" failed."
    }
}
```

### Error in development

```json
{
    "error": {
        "message": "Function request to \"calculateFibonacci\" failed.",
        "error": "at /app/src/services/fibonacci.ts:32:17\n . value is undefined"
    }
}
```
