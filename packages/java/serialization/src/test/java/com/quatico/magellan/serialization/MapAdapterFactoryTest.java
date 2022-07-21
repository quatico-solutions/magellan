/*
---------------------------------------------------------------------------------------------
  Copyright (c) Quatico Solutions AG. All rights reserved.
  Licensed under the MIT License. See LICENSE in the project root for license information.
---------------------------------------------------------------------------------------------
*/
package com.quatico.magellan.serialization;


import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;


public class MapAdapterFactoryTest {
    private static Gson target;
    
    @BeforeAll
    public static void setUpTest() {
        GsonBuilder gsonBuilder = new GsonBuilder()
                .registerTypeAdapterFactory(new MapAdapterFactory());
        target = gsonBuilder.create();
    }
    
    @AfterAll
    public static void cleanUpTest() {
        target = null;
    }
    
    @Test
    public void serialize_HashMap_EqualToJson() {
        TestContainerMap expected = new TestContainerMap();
        expected.dayMap.put("expected", new DayObject("monday"));
        
        String actual = target.toJson(expected);
        
        assertEquals("{\"dayMap\":{\"__type__\":\"map\",\"value\":{\"expected\":{\"day\":\"monday\"}}}}", actual);
    }
    
    @Test
    public void deserialize_Json_EqualToHashMap() {
        TestContainerMap expected = new TestContainerMap();
        expected.dayMap.put("expected", new DayObject("monday"));
        
        TestContainerMap actual = target.fromJson(
                "{\"dayMap\":{\"__type__\":\"map\",\"value\":{\"expected\":{\"day\":\"monday\"}}}}",
                TestContainerMap.class);
        
        assertThat(actual).usingRecursiveComparison().isEqualTo(expected);
    }
    
    @Test
    public void serialize_HashMapWithArray_EqualToJson() {
        TestContainerMapArray expected = new TestContainerMapArray();
        expected.daysMap.put("expected", new DayObject[] { new DayObject("monday"), new DayObject("tuesday") });
        
        String actual = target.toJson(expected);
        
        assertEquals("{\"daysMap\":{\"__type__\":\"map\",\"value\":{\"expected\":[{\"day\":\"monday\"},{\"day\":\"tuesday\"}]}}}", actual);
    }
    
    @Test
    public void deserialize_Json_EqualToHashMapWithArray() {
        TestContainerMapArray expected = new TestContainerMapArray();
        expected.daysMap.put("expected", new DayObject[] { new DayObject("monday"), new DayObject("tuesday") });
        
        TestContainerMapArray actual = target.fromJson(
                "{\"daysMap\":{\"__type__\":\"map\",\"value\":{\"expected\":[{\"day\":\"monday\"},{\"day\":\"tuesday\"}]}}}",
                TestContainerMapArray.class);
        
        assertThat(actual).usingRecursiveComparison().isEqualTo(expected);
    }
}