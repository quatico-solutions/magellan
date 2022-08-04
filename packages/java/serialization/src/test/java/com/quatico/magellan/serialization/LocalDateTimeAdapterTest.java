/*
---------------------------------------------------------------------------------------------
  Copyright (c) Quatico Solutions AG. All rights reserved.
  Licensed under the MIT License. See LICENSE in the project root for license information.
---------------------------------------------------------------------------------------------
*/
package com.quatico.magellan.serialization;


import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.TimeZone;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;


public class LocalDateTimeAdapterTest {
    private static Gson target;
    
    @BeforeAll
    public static void setUpTest() {
        GsonBuilder gsonBuilder = new GsonBuilder()
                .registerTypeAdapter(LocalDateTime.class, new LocalDateTimeAdapter());
        gsonBuilder = gsonBuilder.setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX");
        target = gsonBuilder.create();
    }
    
    @AfterAll
    public static void cleanUpTest() {
        target = null;
    }
    
    @Test
    public void serialize_LocalDateTime_EqualToJson() {
        String actual = target.toJson(LocalDateTime.of(2022, 7, 1, 0, 0, 0));
        
        assertEquals("{\"__type__\":\"date\",\"value\":\"2022-07-01T00:00:00.000Z\"}", actual);
    }
    
    @Test
    public void deserialize_LocalDateTimeJson_EqualToLocalDateTime() {
        LocalDateTime actual = target.fromJson("{\"__type__\":\"date\",\"value\":\"2022-07-01T00:00:00.000Z\"}", LocalDateTime.class);
        
        assertEquals(LocalDateTime.of(2022, 7, 1, 0, 0, 0), actual);
    }
    
}
