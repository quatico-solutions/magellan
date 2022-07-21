<!--
 ---------------------------------------------------------------------------------------------
   Copyright (c) Quatico Solutions AG. All rights reserved.
   Licensed under the MIT License. See LICENSE in the project root for license information.
 ---------------------------------------------------------------------------------------------
-->
## Transport configuration

Magellan uses the global.**qsMagellanConfig** object to access transport configurations.

```json
{
    "host": "//localhost:3000",
    "servicePath": "/api"
}
```

This configuration is injected to the window object by `@quatico/magellan-client/lib/configuration/config.js` which can be replaced during bundling with Webpack, for example for the Magellan AEM-Proxy running on the same machine serving the frontend:

#### magellan.config.js
```javascript
module.exports = {
    host: "",
    servicePath: "/services/magellan/function"
}
```

#### webpack.config.js
```javascript
plugins: [
    new webpack.NormalModuleReplacementPlugin(/config.js/, join(__dirname, "magellan.config.js")),
],
```
