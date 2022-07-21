/*
---------------------------------------------------------------------------------------------
  Copyright (c) Quatico Solutions AG. All rights reserved.
  Licensed under the MIT License. See LICENSE in the project root for license information.
---------------------------------------------------------------------------------------------
*/
package com.quatico.magellan.serialization;


import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.TimeZone;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;


public class DateAdapterFactoryTest {
    private static Gson target;
    
    @BeforeAll
    public static void setUpTest() {
        TimeZone.setDefault(TimeZone.getTimeZone(ZoneOffset.UTC));
        GsonBuilder gsonBuilder = new GsonBuilder()
                .registerTypeAdapterFactory(new DateAdapterFactory());
        gsonBuilder = gsonBuilder.setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX");
        target = gsonBuilder.create();
    }
    
    @AfterAll
    public static void cleanUpTest() {
        target = null;
    }
    
    @Test
    public void serialize_Date_EqualToJson() {
        String actual = DateAdapterFactoryTest.target.toJson(new Date(Date.UTC(1970 - 1900, 3, 1, 0, 0, 0)));
        
        assertEquals("{\"__type__\":\"date\",\"value\":\"1970-04-01T00:00:00.000Z\"}", actual);
    }
    
    @Test
    public void serialize_DateInTimezoneOffset_EqualToJson() {
        String actual = DateAdapterFactoryTest.target.toJson(Date.from(OffsetDateTime.parse("1970-04-01T00:00:00.000+01:00").toInstant()));
        
        assertEquals("{\"__type__\":\"date\",\"value\":\"1970-03-31T23:00:00.000Z\"}", actual);
    }
    
    @Test
    public void deserialize_DateTimeJson_EqualToDate() {
        Date actual = target.fromJson("{\"__type__\":\"date\",\"value\":\"1970-04-01T00:00:00.000Z\"}", Date.class);
        
        assertEquals(new Date(Date.UTC(1970 - 1900, 3, 1, 0, 0, 0)), actual);
    }
    
}
