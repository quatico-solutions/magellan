/*
---------------------------------------------------------------------------------------------
  Copyright (c) Quatico Solutions AG. All rights reserved.
  Licensed under the MIT License. See LICENSE in the project root for license information.
---------------------------------------------------------------------------------------------
*/
package com.quatico.magellan.serialization;


import java.io.IOException;
import java.util.Date;

import com.google.gson.Gson;
import com.google.gson.TypeAdapter;
import com.google.gson.TypeAdapterFactory;
import com.google.gson.reflect.TypeToken;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;


public class DateAdapterFactory implements TypeAdapterFactory {
    @Override
    public <T> TypeAdapter<T> create(Gson gson, TypeToken<T> typeToken) {
        if (!Date.class.isAssignableFrom(typeToken.getRawType())) {
            return null;
        }
        return (TypeAdapter<T>) new DateAdapter(this, gson, typeToken);
    }
    
    private static class DateAdapter<T extends Date> extends TypeAdapter<T> {
        private final DateAdapterFactory factory;
        private final Gson               gson;
        private final TypeToken<T>       typeToken;
        
        public DateAdapter(DateAdapterFactory factory, Gson gson, TypeToken<T> typeToken) {
            this.factory = factory;
            this.gson = gson;
            this.typeToken = typeToken;
        }
        
        @Override
        public void write(JsonWriter writer, T date) throws IOException {
            writer.beginObject();
            writer.name("__type__");
            writer.value("date");
            writer.name("value");
            this.gson.getDelegateAdapter(this.factory, this.typeToken).write(writer, date);
            writer.endObject();
        }
        
        @Override
        public T read(JsonReader reader) throws IOException {
            reader.beginObject();
            T result = null;
            while (reader.hasNext()) {
                String name = reader.nextName();
                switch (name) {
                case "__type__":
                    if (!reader.nextString().equals("date")) {
                        return null;
                    }
                    break;
                case "value": {
                    result = gson.getDelegateAdapter(this.factory, this.typeToken).read(reader);
                    break;
                }
                }
                
            }
            reader.endObject();
            return result;
        }
    }
}
