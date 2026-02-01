import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { supabase } from "../../supabase";

interface Lesson {
  id: string;
  date: string;
  topic: string;
  description?: string;
  teacher_id: string;
  student_id: string;
}

interface Grade {
  id: string;
  value: string;
  comment?: string;
  teacher_id: string;
  student_id: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function TeacherDashboard() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [teacherId, setTeacherId] = useState<string>("");

  const [newLesson, setNewLesson] = useState({
    date: "",
    topic: "",
    description: "",
    student_id: "",
  });

  const [newGrade, setNewGrade] = useState({
    student_id: "",
    value: "",
    comment: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setTeacherId(user.id);

    // Pobierz uczniów
    const { data: studentsData, error: studentsError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("user_type", "student");

    if (studentsError) Alert.alert("Błąd", studentsError.message);
    else setStudents(studentsData || []);

    // Pobierz lekcje nauczyciela
    const { data: lessonsData, error: lessonsError } = await supabase
      .from("lessons")
      .select("*")
      .eq("teacher_id", user.id);

    if (lessonsError) Alert.alert("Błąd", lessonsError.message);
    else setLessons(lessonsData || []);

    // Pobierz oceny nauczyciela
    const { data: gradesData, error: gradesError } = await supabase
      .from("grades")
      .select("*")
      .eq("teacher_id", user.id);

    if (gradesError) Alert.alert("Błąd", gradesError.message);
    else setGrades(gradesData || []);

    setLoading(false);
  };

  const addLesson = async () => {
    if (!newLesson.date || !newLesson.topic || !newLesson.student_id) {
      Alert.alert("Uwaga", "Data, temat i uczeń są wymagane!");
      return;
    }

    const { data, error } = await supabase
      .from("lessons")
      .insert([{ ...newLesson, teacher_id: teacherId }])
      .select();

    if (error) Alert.alert("Błąd", error.message);
    else if (data && data.length > 0) {
      setLessons((prev) => [...prev, data[0]]);
      setNewLesson({ date: "", topic: "", description: "", student_id: "" });
    }
  };

  const addGrade = async () => {
    if (!newGrade.student_id || !newGrade.value) {
      Alert.alert("Uwaga", "Uczeń i ocena są wymagane!");
      return;
    }

    const { data, error } = await supabase
      .from("grades")
      .insert([{ ...newGrade, teacher_id: teacherId }])
      .select();

    if (error) Alert.alert("Błąd", error.message);
    else if (data && data.length > 0) {
      setGrades((prev) => [...prev, data[0]]);
      setNewGrade({ student_id: "", value: "", comment: "" });
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text>Ładowanie...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      

      
    
      
      

      {/* Lista lekcji */}
      <Text style={{ fontSize: 18, marginVertical: 20 }}>Twoi uczniowie:</Text>
      {students.map((student) => (
        <View key={student.id} style={{
            padding: 12,
            borderBottomWidth: 1,
            borderColor: "#ddd",
        }}>
          <Text>Imię i nazwisko: {student.first_name} {student.last_name}</Text> 
          <Text>Email: {student.email}</Text>
           
         
        </View>
      ))}

      

      <View style={{ marginTop: 20 }}>
              <Pressable onPress={() => router.replace("/(teacher)")}>
                <Text style={{ color: "#2563eb", marginBottom: 16 }}>
                  ← Wróć do panelu nauczyciela
                </Text>
              </Pressable>
            </View>
    </ScrollView>
  );
}
