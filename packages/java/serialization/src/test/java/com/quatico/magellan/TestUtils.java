/*
---------------------------------------------------------------------------------------------
  Copyright (c) Quatico Solutions AG. All rights reserved.
  Licensed under the MIT License. See LICENSE in the project root for license information.
---------------------------------------------------------------------------------------------
*/
package com.quatico.magellan;

import java.io.IOException;
import java.net.URL;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;

public class TestUtils {
    // public static String ReadSharedTestData(String name) throws IOException {
    // return ReadSharedTestData(name, "json");
    // }

    public static String ReadResourceFile(String resourceName) throws IOException {
        return new String(Files.readAllBytes(FileSystems.getDefault()
                .getPath("../../../data/serialization/" + resourceName)
                .toAbsolutePath()
                .normalize()));
    }

    public static String ReadResourceFileLocal(String resourceName) {
        URL url = TestUtils.class.getClassLoader().getResource(resourceName);
        if (url != null) {
            try {
                Path resPath = java.nio.file.Paths.get(url.getPath());
                return new String(Files.readAllBytes(resPath));
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return "";
    }
}
