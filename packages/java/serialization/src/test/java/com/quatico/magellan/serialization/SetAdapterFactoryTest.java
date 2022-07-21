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


public class SetAdapterFactoryTest {
    private static Gson target;
    
    @BeforeAll
    public static void setUpTest() {
        GsonBuilder gsonBuilder = new GsonBuilder()
                .registerTypeAdapterFactory(new SetAdapterFactory());
        
        target = gsonBuilder.create();
    }
    
    @AfterAll
    public static void cleanUpTest() {
        target = null;
    }
    
    @Test
    public void serialize_Set_EqualToJson() {
        TestContainerSet expected = new TestContainerSet();
        expected.daySet.add(new DayObject("monday"));
        
        String actual = target.toJson(expected);
        
        assertEquals("{\"daySet\":{\"__type__\":\"set\",\"value\":[{\"day\":\"monday\"}]}}", actual);
    }
    
    @Test
    public void deserialize_Json_EqualToSet() {
        TestContainerSet expected = new TestContainerSet();
        expected.daySet.add(new DayObject("monday"));
        
        TestContainerSet actual = target.fromJson("{\"daySet\":{\"__type__\":\"set\",\"value\":[{\"day\":\"monday\"}]}}", TestContainerSet.class);
        
        assertThat(actual).usingRecursiveComparison().isEqualTo(expected);
    }
    
    @Test
    public void serialize_SetWithArray_EqualToJson() {
        TestContainerSetArray expected = new TestContainerSetArray();
        expected.daysSet.add(new DayObject[] { new DayObject("monday"), new DayObject("tuesday") });
        
        String actual = target.toJson(expected);
        
        assertEquals("{\"daysSet\":{\"__type__\":\"set\",\"value\":[[{\"day\":\"monday\"},{\"day\":\"tuesday\"}]]}}", actual);
    }
    
    @Test
    public void deserialize_Json_EqualToSetWithArray() {
        TestContainerSetArray expected = new TestContainerSetArray();
        expected.daysSet.add(new DayObject[] { new DayObject("monday"), new DayObject("tuesday") });
        
        TestContainerSetArray actual = target.fromJson(
                "{\"daysSet\":{\"__type__\":\"set\",\"value\":[[{\"day\":\"monday\"},{\"day\":\"tuesday\"}]]}}",
                TestContainerSetArray.class);
        
        assertThat(actual).usingRecursiveComparison().isEqualTo(expected);
    }
}
