import React, { useEffect, useState } from "react";
import { setNamespace } from "@quatico/magellan-client";
import { greetMe } from "./services/greet-me";

const logo = new URL("./logo.svg", import.meta.url).toString();

import "./App.scss";

// to serve the frontend through react-scripts and run the server along it, we need to tell magellan
// that the server is on a different port than where it is served from.
setNamespace("default", { endpoint: "http://localhost:3001/api" });

function App() {
    const [greeting, setGreeting] = useState("... waiting for greetings ...");

    useEffect(() => {
        greetMe("React User")
            .then(setGreeting)
            .catch(reason => {
                console.error(`Error requesting greeting: ${reason}`);
                setGreeting("server does not wish to greet us");
            });
    }, []);

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                    Edit <code>src/App.tsx</code> and save to reload.
                </p>
                <div>
                    <a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
                        Learn React
                    </a>{" "}
                    |{" "}
                    <a className="App-link" href="https://docs.quatico.dev" target="_blank" rel="noopener noreferrer">
                        Learn Magellan
                    </a>
                </div>
                <p>{greeting}</p>
            </header>
        </div>
    );
}

export default App;
