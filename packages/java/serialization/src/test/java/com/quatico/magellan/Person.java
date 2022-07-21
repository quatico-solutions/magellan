/*
---------------------------------------------------------------------------------------------
  Copyright (c) Quatico Solutions AG. All rights reserved.
  Licensed under the MIT License. See LICENSE in the project root for license information.
---------------------------------------------------------------------------------------------
*/
package com.quatico.magellan;


import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;


class Person {
    private Address  address;
    private int      age;
    private Date     birthday;
    private Person[] children;
    private HashMap  friends;
    private float    height;
    private String   name;
    private String   surname;
    private HashSet  tel;
    
    public Person() {
    }
    
    public Person(
            String name,
            String surname,
            int age,
            float height,
            Date birthday,
            Person[] children,
            Address address,
            HashMap friends,
            String[] tel) {
        this.name = name;
        this.surname = surname;
        this.age = age;
        this.height = height;
        this.birthday = birthday;
        this.children = children;
        this.address = address;
        this.friends = friends;
        if (tel != null) {
            this.tel = new HashSet(Arrays.asList(tel));
        }
    }
    
    public Person setAddress(Address address) {
        this.address = address;
        return this;
    }
    
    public Person setAge(int age) {
        this.age = age;
        return this;
    }
    
    public Person setBirthday(Date birthday) {
        this.birthday = birthday;
        return this;
    }
    
    public Person setChildren(Person[] children) {
        this.children = children;
        return this;
    }
    
    public Person setFriends(HashMap friends) {
        this.friends = friends;
        return this;
    }
    
    public Person setHeight(float height) {
        this.height = height;
        return this;
    }
    
    public Person setName(String name) {
        this.name = name;
        return this;
    }
    
    public Person setSurname(String surname) {
        this.surname = surname;
        return this;
    }
    
    public Person setTel(HashSet tel) {
        this.tel = tel;
        return this;
    }
}
