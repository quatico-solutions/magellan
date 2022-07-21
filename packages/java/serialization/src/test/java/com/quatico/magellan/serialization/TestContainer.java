/*
---------------------------------------------------------------------------------------------
  Copyright (c) Quatico Solutions AG. All rights reserved.
  Licensed under the MIT License. See LICENSE in the project root for license information.
---------------------------------------------------------------------------------------------
*/
package com.quatico.magellan.serialization;


import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;


class TestContainerSet {
    Set<DayObject> daySet;
    
    public TestContainerSet() {
        daySet = new HashSet<>();
    }
}


class TestContainerSetArray {
    Set<DayObject[]> daysSet;
    
    public TestContainerSetArray() {
        daysSet = new HashSet<>();
    }
}


class TestContainerMap {
    Map<String, DayObject> dayMap;
    
    public TestContainerMap() {
        dayMap = new HashMap<>();
    }
}


class TestContainerMapArray {
    Map<String, DayObject[]> daysMap;
    
    public TestContainerMapArray() {
        daysMap = new HashMap<>();
    }
}


class TestContainerList {
    List<DayObject> dayList;
    
    public TestContainerList() {
        dayList = new ArrayList<>();
    }
}


class TestContainerListArray {
    List<DayObject[]> daysList;
    
    public TestContainerListArray() {
        daysList = new ArrayList<>();
    }
}


class TestContainerComplex {
    List<Set<TestContainerMapArray>> complexData;
    
    public TestContainerComplex() {
        complexData = new ArrayList<>();
    }
}