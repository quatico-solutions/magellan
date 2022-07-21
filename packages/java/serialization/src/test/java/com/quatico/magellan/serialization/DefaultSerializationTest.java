/*
---------------------------------------------------------------------------------------------
  Copyright (c) Quatico Solutions AG. All rights reserved.
  Licensed under the MIT License. See LICENSE in the project root for license information.
---------------------------------------------------------------------------------------------
*/
package com.quatico.magellan.serialization;


import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;


public class DefaultSerializationTest {
    private static Gson target;
    
    @BeforeAll
    public static void setUpTest() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        
        target = gsonBuilder.create();
    }
    
    @AfterAll
    public static void cleanUpTest() {
        target = null;
    }
    
    @Test
    public void serialize_List_EqualToJson() {
        TestContainerList expected = new TestContainerList();
        expected.dayList.add(new DayObject("monday"));
        
        String actual = target.toJson(expected);
        
        assertEquals("{\"dayList\":[{\"day\":\"monday\"}]}", actual);
    }
    
    @Test
    public void deserialize_Json_EqualToList() {
        TestContainerList expected = new TestContainerList();
        expected.dayList.add(new DayObject("monday"));
        
        TestContainerList actual = target.fromJson("{\"dayList\":[{\"day\":\"monday\"}]}", TestContainerList.class);
        
        assertThat(actual).usingRecursiveComparison().isEqualTo(expected);
    }
    
    @Test
    public void serialize_ListWithArray_EqualToJson() {
        TestContainerListArray expected = new TestContainerListArray();
        expected.daysList.add(new DayObject[] { new DayObject("monday"), new DayObject("tuesday") });
        
        String actual = target.toJson(expected);
        
        assertEquals("{\"daysList\":[[{\"day\":\"monday\"},{\"day\":\"tuesday\"}]]}", actual);
    }
    
    @Test
    public void deserialize_Json_EqualToListWithArray() {
        TestContainerListArray expected = new TestContainerListArray();
        expected.daysList.add(new DayObject[] { new DayObject("monday"), new DayObject("tuesday") });
        
        TestContainerListArray actual = target.fromJson(
                "{\"daysList\":[[{\"day\":\"monday\"},{\"day\":\"tuesday\"}]]}",
                TestContainerListArray.class);
        
        assertThat(actual).usingRecursiveComparison().isEqualTo(expected);
    }
    
    @Test
    public void deserialize_WithAnonymousList_DoesNotThrowException() {
        assertDoesNotThrow(() -> target.fromJson("[{\"day\":\"monday\"}]", List.class));
    }
    
    @Test
    public void deserialize_WithAnonymousList_FailsToDeserializeDayObject() {
        List<DayObject> actual = target.fromJson("[{\"day\":\"monday\"}]", List.class);
        
        assertThrows(ClassCastException.class, () -> actual.get(0).getClass());
    }
}
