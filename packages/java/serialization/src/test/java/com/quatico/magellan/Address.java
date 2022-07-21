/*
---------------------------------------------------------------------------------------------
  Copyright (c) Quatico Solutions AG. All rights reserved.
  Licensed under the MIT License. See LICENSE in the project root for license information.
---------------------------------------------------------------------------------------------
*/
package com.quatico.magellan;


class Address {
    private String city;
    private String street;
    private String zip;
    
    public Address() {}
    
    public Address(String street, String zip, String city) {
        this.street = street;
        this.zip = zip;
        this.city = city;
    }
    
    public Address setStreet(String street) {
        this.street = street;
        return this;
    }
    
    public Address setZip(String zip) {
        this.zip = zip;
        return this;
    }
    
    public Address setCity(String city) {
        this.city = city;
        return this;
    }
}
