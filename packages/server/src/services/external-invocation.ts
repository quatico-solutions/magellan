/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import io from "socket.io-client";

type ExternalFunctionResult<O> =
    | {
          status: "success";
          data: O;
      }
    | {
          status: "error";
          error: {
              message: string;
          };
      };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const externalFunctionInvoke = async <I = any, O = any>(name: string, data: I): Promise<O> => {
    const externalData = new Promise((resolve, reject) => {
        try {
            // TODO allow to configure server URL/port
            const socket = io.connect("http://localhost:9092");
            const timeoutId = setTimeout(() => {
                socket.close();
                reject(new Error("function call timeout"));
            }, 5000);
            socket.on("connect", () => {
                socket.emit("invokeFunction", { name, data }, (result: ExternalFunctionResult<O>) => {
                    clearTimeout(timeoutId);
                    socket.close();
                    if (result && result.status === "success") {
                        resolve(result.data);
                    } else if (result && result.status === "error") {
                        reject(new Error(`function error: '${result.error.message}'`));
                    } else {
                        reject(new Error("invalid function result"));
                    }
                });
            });
        } catch (e) {
            reject(e);
        }
    });
    return (await externalData) as O;
};
