import { Stack } from 'expo-router';
import React from 'react';

export default function ParentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true, // lub false, jeśli nie chcesz nagłówka
      }}
    >
      <Stack.Screen name="index" />
      {/* Możesz tu dodawać inne ekrany rodzica */}
    </Stack>
  );
}