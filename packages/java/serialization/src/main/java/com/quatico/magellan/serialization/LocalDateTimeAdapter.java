/*
---------------------------------------------------------------------------------------------
  Copyright (c) Quatico Solutions AG. All rights reserved.
  Licensed under the MIT License. See LICENSE in the project root for license information.
---------------------------------------------------------------------------------------------
*/
package com.quatico.magellan.serialization;


import java.lang.reflect.Type;
import java.time.LocalDateTime;
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


public class LocalDateTimeAdapter implements JsonSerializer<LocalDateTime>, JsonDeserializer<LocalDateTime> {
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern(TransportSerializer.getDateTimeFormat());
    
    @Override
    public JsonElement serialize(LocalDateTime localDateTime, Type srcType, JsonSerializationContext context) {
        JsonObject result = new JsonObject();
        result.addProperty("__type__", "date");
        result.add("value", new JsonPrimitive(formatter.format(localDateTime)));
        return result;
    }
    
    @Override
    public LocalDateTime deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context)
            throws JsonParseException {
        JsonObject obj = json.getAsJsonObject();
        if (obj.get("__type__").getAsString().equals("date")) {
            return LocalDateTime.parse(
                    obj.get("value").getAsString(),
                    DateTimeFormatter.ofPattern(TransportSerializer.getDateTimeFormat()));
        }
        throw new JsonParseException("Not a valid LocalDate string");
    }
}