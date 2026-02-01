import { supabase } from "@/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";


interface Lesson {
  id: string;
  topic: string;
  date: string;
  description?: string;
  class: string;
}

export default function LessonMaterials() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) return;

    const loadLesson = async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lessonId)
        .single();

      if (error) {
        console.error(error);
      } else {
        setLesson(data);
      }

      setLoading(false);
    };

    loadLesson();
  }, [lessonId]);

  // ⏳ loading
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ❌ brak lekcji
  if (!lesson) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Nie znaleziono lekcji.</Text>
      </View>
    );
  }

  // ✅ DOPIERO TERAZ używamy lesson.topic
  return (
    <View style={{ flex: 1, padding: 20 }}>
        <Pressable onPress={() => router.replace("/(teacher)")}>
  <Text style={{ color: "#2563eb", marginBottom: 16 }}>
    ← Wróć do panelu głównego
  </Text>
</Pressable>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>
        {lesson.topic}
      </Text>

      <Text style={{ marginTop: 10 }}>
        📅 {lesson.date}
      </Text>

      <Text style={{ marginTop: 10 }}>
        Sala nr {lesson.class}
      </Text>

      {lesson.description && (
        <Text style={{ marginTop: 20 }}>
         Opis lekcji: {lesson.description}
        </Text>
      )}
    </View>
  );
}