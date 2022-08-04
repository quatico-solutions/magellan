/*
---------------------------------------------------------------------------------------------
  Copyright (c) Quatico Solutions AG. All rights reserved.
  Licensed under the MIT License. See LICENSE in the project root for license information.
---------------------------------------------------------------------------------------------
*/
package com.quatico.magellan.serialization;


import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.TimeZone;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;


public class LocalDateAdapterTest {
    private static Gson target;
    
    @BeforeAll
    public static void setUpTest() {
        TimeZone.setDefault(TimeZone.getTimeZone(ZoneOffset.UTC));
        GsonBuilder gsonBuilder = new GsonBuilder()
                .registerTypeAdapter(LocalDate.class, new LocalDateAdapter());
        gsonBuilder = gsonBuilder.setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX");
        target = gsonBuilder.create();
    }
    
    @AfterAll
    public static void cleanUpTest() {
        target = null;
    }
    
    @Test
    public void serialize_LocalDate_EqualToJson() {
        String actual = LocalDateAdapterTest.target.toJson(LocalDate.of(2022, 07, 01) );
        
        assertEquals("{\"__type__\":\"date\",\"value\":\"2022-07-01T00:00:00.000Z\"}", actual);
    }
    
    @Test
    public void deserialize_LocalDateJson_EqualToLocalDate() {
        LocalDate actual = target.fromJson("{\"__type__\":\"date\",\"value\":\"2022-07-01T00:00:00.000Z\"}", LocalDate.class);
        
        assertEquals(LocalDate.of(2022,07,01), actual);
    }
    
}
