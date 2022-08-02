/*
---------------------------------------------------------------------------------------------
  Copyright (c) Quatico Solutions AG. All rights reserved.
  Licensed under the MIT License. See LICENSE in the project root for license information.
---------------------------------------------------------------------------------------------
*/
package com.quatico.magellan;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonParseException;
import com.google.gson.JsonSyntaxException;
import com.quatico.magellan.serialization.DateAdapterFactory;
import com.quatico.magellan.serialization.LocalDateAdapter;
import com.quatico.magellan.serialization.LocalDateTimeAdapter;
import com.quatico.magellan.serialization.MapAdapterFactory;
import com.quatico.magellan.serialization.SetAdapterFactory;
import com.quatico.magellan.serialization.UtcDateAdapter;


public class TransportSerializer {
    static final String dateFormat     = "yyyy-MM-dd";
    static final String dateTimeFormat = String.format("%s'T'HH:mm:ss.SSS'Z'",dateFormat);
    private final Gson gson;
    
    public TransportSerializer() {
        gson = getGson(new GsonBuilder());
    }
    
    public static String getDateFormat() {
        return dateFormat;
    }
    
    public static String getDateTimeFormat() {
        return dateTimeFormat;
    }
    
    private static Gson getGson(GsonBuilder builder) {
        return builder.registerTypeAdapter(Date.class, new UtcDateAdapter())
                      .registerTypeAdapter(LocalDate.class, new LocalDateAdapter())
                      .registerTypeAdapter(LocalDateTime.class, new LocalDateTimeAdapter())
                      .registerTypeAdapterFactory(new DateAdapterFactory())
                      .registerTypeAdapterFactory(new SetAdapterFactory())
                      .registerTypeAdapterFactory(new MapAdapterFactory())
                      .serializeNulls()
                      .setDateFormat(dateTimeFormat)
                      .create();
    }
    
    public String serialize(Object objToSerialise) throws IllegalArgumentException {
        if (objToSerialise == null) {
            throw new IllegalArgumentException("objToSerialise must not be null");
        }
        
        return gson.toJson(objToSerialise);
    }
    
    public <T> T deserialize(String json, Class<T> classOf) throws IllegalArgumentException {
        if (json == null) {
            throw new IllegalArgumentException("json must not be null");
        }
        try {
            return gson.fromJson(json, classOf);
        } catch (JsonSyntaxException ex) {
            throw new IllegalArgumentException("Invalid json sync. JSON not be deserialized.");
        } catch (JsonParseException ex) {
            throw new IllegalArgumentException("Invalid json structure. JSON can not be deserialized.");
        }
    }
}
