<!--
---------------------------------------------------------------------------------------------
Copyright (c) Quatico Solutions AG. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
 ---------------------------------------------------------------------------------------------
-->

## Transport configuration

Magellan uses the global.**__qsMagellanConfig__** object to access transport configurations at runtime.

```json
{
    "namespaces": {
        "default": {
            "endpoint": "/api",
            "transport": "default"
        }
    }
}
```

This configuration is injected to the window object by `@quatico/magellan-client/lib/transport/config.js` which can
be replaced during bundling with Webpack to invoke a request against a `my-api` endpoint, merging its transport
configuration if another magellan-client based frontend was already loaded previously.

#### magellan.config.js

```javascript
const createFormData = ({name, payload, namespace}) => {
    const formData = new FormData();
    formData.set("name", name);
    formData.set("data", payload);
    formData.set("namespace", namespace);
    return formData;
};

// func is of type @quatico/magellan-client TransportFunction
const myTransportFunction = async func => {
    const {name, payload, namespace, endpoint} = func;
    if (!name) {
        throw new Error('Cannot invoke this remote function without "name" property.');
    }
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            body: createFormData({name, payload, namespace}),
        });
        return await response.text();
    } catch (err) {
        throw new Error(`Cannot invoke remote function: "${name}". Reason: "${err}".`);
    }
};
module.exports = {
    namespaces: {"test-namespace": {endpoint: "/my-api", transport: "my-transport"}},
    transports: {"my-transport": myTransportFunction},
    merge: true
};
```

#### webpack.config.js

```javascript
plugins: [
    new webpack.NormalModuleReplacementPlugin(
        /@quatico[\\/]magellan-client[\\/]lib[\\/]transport[\\/]config.js/,
        path.join(__dirname, "magellan.config.js")
    ),
]
```