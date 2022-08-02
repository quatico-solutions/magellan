/*
---------------------------------------------------------------------------------------------
  Copyright (c) Quatico Solutions AG. All rights reserved.
  Licensed under the MIT License. See LICENSE in the project root for license information.
---------------------------------------------------------------------------------------------
*/
package com.quatico.magellan.serialization;


import java.lang.reflect.Type;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.gson.JsonPrimitive;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;
import com.quatico.magellan.TransportSerializer;


public class LocalDateAdapter implements JsonSerializer<LocalDate>, JsonDeserializer<LocalDate> {
    private static final DateTimeFormatter formatter            = DateTimeFormatter.ofPattern(TransportSerializer.getDateFormat());
    
    @Override
    public JsonElement serialize(LocalDate localDate, Type srcType, JsonSerializationContext context) {
        JsonObject result = new JsonObject();
        result.addProperty("__type__", "date");
        result.add("value", new JsonPrimitive(String.format("%sT00:00:00.000Z", formatter.format(localDate))));
        return result;
    }
    
    @Override
    public LocalDate deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context)
            throws JsonParseException {
        JsonObject obj = json.getAsJsonObject();
        if(obj.get("__type__").getAsString().equals("date")) {
            return LocalDate.parse(
                    obj.get("value").getAsString(),
                    DateTimeFormatter.ofPattern(TransportSerializer.getDateTimeFormat()));
        }
        throw new JsonParseException("Not a valid LocalDate string");
    }
}