/*
---------------------------------------------------------------------------------------------
  Copyright (c) Quatico Solutions AG. All rights reserved.
  Licensed under the MIT License. See LICENSE in the project root for license information.
---------------------------------------------------------------------------------------------
*/
package com.quatico.magellan;


import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import lombok.RequiredArgsConstructor;


public class TransportSerializerTest {
    private static TransportSerializer testObj;
    
    @BeforeAll
    public static void setUpTest() {
        testObj = new TransportSerializer();
    }
    
    @AfterAll
    public static void cleanUpTest() {
        testObj = null;
    }
    
    private static Stream<Arguments> provideSerializationTestSet() throws IOException {
        return Stream.of(
                Arguments.of(new ObjectObj("expected"), TestUtils.ReadResourceFile("object.json")),
                Arguments.of(
                        new ArrayObj(new String[] { "expected", "expected" }),
                        TestUtils.ReadResourceFile("array.json")),
                Arguments.of(new IntObj(10), TestUtils.ReadResourceFile("number_int.json")),
                Arguments.of(new FloatObj(10.1f), TestUtils.ReadResourceFile("number_float.json")),
                Arguments.of(new DoubleObj(10.1), TestUtils.ReadResourceFile("number_double.json")),
                Arguments.of(
                        new DateObj(Date.from(Instant.parse("2022-07-01T00:00:00.000Z"))),
                        TestUtils.ReadResourceFile("date.json")),
                Arguments.of(
                        new SetObj(new LinkedHashSet<>(Arrays.asList("expected", "expected2", "expected3"))),
                        TestUtils.ReadResourceFile("set.json")),
                Arguments.of(
                        new MapObj(new LinkedHashMap<String, String>() {
                            {
                                put("value1", "expected");
                                put("value2", "expected");
                            }
                        }),
                        TestUtils.ReadResourceFile("map.json")));
    }
    
    private static Stream<Arguments> provideDeserializationTestSet() throws IOException {
        return Stream.of(
                Arguments.of(TestUtils.ReadResourceFile("object.json"), new ObjectObj("expected")),
                Arguments.of(
                        TestUtils.ReadResourceFile("array.json"),
                        new ArrayObj(new String[] { "expected", "expected" })),
                Arguments.of(TestUtils.ReadResourceFile("number_int.json"), new IntObj(10)),
                Arguments.of(TestUtils.ReadResourceFile("number_float.json"), new FloatObj(10.1f)),
                Arguments.of(TestUtils.ReadResourceFile("number_double.json"), new DoubleObj(10.1)),
                Arguments.of(
                        TestUtils.ReadResourceFile("date.json"),
                        new DateObj(Date.from(Instant.parse("2022-07-01T00:00:00.000Z")))),
                Arguments.of(
                        TestUtils.ReadResourceFile("set.json"),
                        new SetObj(new LinkedHashSet<>(Arrays.asList("expected", "expected2", "expected3")))),
                Arguments.of(
                        TestUtils.ReadResourceFile("map.json"),
                        new MapObj(new LinkedHashMap<String, String>() {
                            {
                                put("value1", "expected");
                                put("value2", "expected");
                            }
                        }))

        );
    }
    
    @Test
    void serialize_NullObject_ThrowsError() {
        IllegalArgumentException actual = assertThrows(IllegalArgumentException.class, () -> testObj.serialize(null));
        
        assertThat(actual.getMessage()).hasToString("objToSerialise must not be null");
    }
    
    @Test
    void serialize_AnonymousClass_ThrowsError() {
        IllegalArgumentException actual = assertThrows(IllegalArgumentException.class, () -> testObj.serialize(new AnonymousClass() {{
            value = 3;
        }}));
        
        assertThat(actual.getMessage()).hasToString(
                "objToSerialise class com.quatico.magellan.TransportSerializerTest$3 must not be a anonymous class");
    }
    
    @Test
    void serialize_LocalClass_ThrowsError() {
        class LocalClass {
            public int value = 3;
        }

        IllegalArgumentException actual = assertThrows(IllegalArgumentException.class, () -> testObj.serialize(new LocalClass()));
        
        assertThat(actual.getMessage()).hasToString(
                "objToSerialise class com.quatico.magellan.TransportSerializerTest$1LocalClass must not be a local class");
    }
    
    @ParameterizedTest
    @MethodSource("provideSerializationTestSet")
    void serialize_Argument_MatchesJson(Object target, String expected) {
        String actual = testObj.serialize(target);
        
        assertEquals(expected, actual);
    }
    
    @ParameterizedTest
    @MethodSource("provideDeserializationTestSet")
    void deserialize_Json_MatchesArgument(String target, Object expected) {
        Object actual = testObj.deserialize(target, expected.getClass());
        
        assertThat(actual).usingRecursiveComparison().isEqualTo(expected);
    }
    
    private static class AnonymousClass {
        public int value = 3;
    }
}


@RequiredArgsConstructor
class ArrayObj {
    final String[] array;
}


@RequiredArgsConstructor
class DateObj {
    final Date date;
}


@RequiredArgsConstructor
class MapObj {
    final Map<String, String> map;
}


@RequiredArgsConstructor
class SetObj {
    final Set<String> set;
}


@RequiredArgsConstructor
class ObjectObj {
    final String id;
}


@RequiredArgsConstructor
class IntObj {
    final int number;
}


@RequiredArgsConstructor
class FloatObj {
    final float number;
}


@RequiredArgsConstructor
class DoubleObj {
    final double number;
}