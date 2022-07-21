/*
---------------------------------------------------------------------------------------------
  Copyright (c) Quatico Solutions AG. All rights reserved.
  Licensed under the MIT License. See LICENSE in the project root for license information.
---------------------------------------------------------------------------------------------
*/
package com.quatico.magellan.serialization;


import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.HashSet;
import java.util.Set;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;


public class ComplexSerializationTest {
    private static Gson target;
    
    @BeforeAll
    public static void setUpTest() {
        GsonBuilder gsonBuilder = new GsonBuilder()
                .registerTypeAdapterFactory(new DateAdapterFactory())
                .registerTypeAdapterFactory(new SetAdapterFactory())
                .registerTypeAdapterFactory(new MapAdapterFactory());
        
        target = gsonBuilder.create();
    }
    
    @AfterAll
    public static void cleanUpTest() {
        target = null;
    }
    
    @Test
    public void serialize_ComplexNestedData_EqualToJson() {
        TestContainerMapArray map = new TestContainerMapArray();
        map.daysMap.put("expected", new DayObject[] { new DayObject("monday"), new DayObject("tuesday") });
        Set<TestContainerMapArray> set = new HashSet<>();
        set.add(map);
        TestContainerComplex expected = new TestContainerComplex();
        expected.complexData.add(set);
        
        String actual = target.toJson(expected);
        
        assertEquals(
                "{\"complexData\":[{\"__type__\":\"set\",\"value\":[{\"daysMap\":{\"__type__\":\"map\","
                + "\"value\":{\"expected\":[{\"day\":\"monday\"},{\"day\":\"tuesday\"}]}}}]}]}",
                actual);
    }
    
    @Test
    public void deserialize_Json_EqualToComplexNestedData() {
        TestContainerMapArray map = new TestContainerMapArray();
        map.daysMap.put("expected", new DayObject[] { new DayObject("monday"), new DayObject("tuesday") });
        Set<TestContainerMapArray> set = new HashSet<>();
        set.add(map);
        TestContainerComplex expected = new TestContainerComplex();
        expected.complexData.add(set);
        
        TestContainerComplex actual = target.fromJson(
                "{\"complexData\":[{\"__type__\":\"set\",\"value\":[{\"daysMap\":{\"__type__\":\"map\","
                + "\"value\":{\"expected\":[{\"day\":\"monday\"},{\"day\":\"tuesday\"}]}}}]}]}",
                TestContainerComplex.class);
        
        assertThat(actual).usingRecursiveComparison().isEqualTo(expected);
    }
}
