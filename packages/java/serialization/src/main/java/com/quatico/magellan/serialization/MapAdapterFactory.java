/*
---------------------------------------------------------------------------------------------
  Copyright (c) Quatico Solutions AG. All rights reserved.
  Licensed under the MIT License. See LICENSE in the project root for license information.
---------------------------------------------------------------------------------------------
*/
package com.quatico.magellan.serialization;


import java.io.IOException;
import java.util.Map;

import com.google.gson.Gson;
import com.google.gson.TypeAdapter;
import com.google.gson.TypeAdapterFactory;
import com.google.gson.reflect.TypeToken;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;


public class MapAdapterFactory implements TypeAdapterFactory {
    @Override
    public <T> TypeAdapter<T> create(Gson gson, TypeToken<T> typeToken) {
        if (!Map.class.isAssignableFrom(typeToken.getRawType())) {
            return null;
        }
        return (TypeAdapter<T>) new MapAdapter(this, gson, typeToken);
    }
    
    private static class MapAdapter<T extends Map> extends TypeAdapter<T> {
        private final MapAdapterFactory factory;
        private final Gson              gson;
        private final TypeToken<T>      typeToken;
        
        public MapAdapter(MapAdapterFactory factory, Gson gson, TypeToken<T> typeToken) {
            this.factory = factory;
            this.gson = gson;
            this.typeToken = typeToken;
        }
        
        @Override
        public void write(JsonWriter writer, T map) throws IOException {
            writer.beginObject();
            writer.name("__type__");
            writer.value("map");
            writer.name("value");
            this.gson.getDelegateAdapter(this.factory, this.typeToken).write(writer, map);
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
                    if (!reader.nextString().equals("map")) {
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
