import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { supabase } from "../../lib/supabase";

interface Lesson {
  id: string;
  date: string;
  topic: string;
  description?: string;
  teacher_id: string;
  student_id: string;
  class: string;
  subject: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

export default function TeacherCourses() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [teacherId, setTeacherId] = useState<string>("");

  const [newLesson, setNewLesson] = useState({
    date: '',
    topic: '',
    description: '',
    student_ids: [] as string[],
    class: "",
    subject: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setTeacherId(session.user.id);

      const [studentsRes, lessonsRes] = await Promise.all([
        supabase.from("profiles").select("id, first_name, last_name").eq("user_type", "student"),
        supabase.from("lessons").select("*").eq("teacher_id", session.user.id)
      ]);

      setStudents(studentsRes.data || []);
      setLessons(lessonsRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addLesson = async () => {
    if (!newLesson.date || !newLesson.topic || newLesson.student_ids.length === 0) {
      Alert.alert("Błąd", "Wypełnij datę, temat i wybierz przynajmniej jednego ucznia.");
      return;
    }

    try {
      const lessonsToInsert = newLesson.student_ids.map((studentId) => ({
        date: newLesson.date,
        topic: newLesson.topic,
        description: newLesson.description,
        subject: newLesson.subject,
        class: newLesson.class,
        student_id: studentId,
        teacher_id: teacherId,
      }));

      const { data, error } = await supabase.from('lessons').insert(lessonsToInsert).select();

      if (error) throw error;

      Alert.alert("Sukces", "Dodano lekcje.");
      setLessons(prev => [...prev, ...(data || [])]);
      setNewLesson({ date: '', topic: '', description: '', student_ids: [], class: "", subject: "" });
      setIsAddLessonOpen(false);
    } catch (error: any) {
      Alert.alert("Błąd", error.message);
    }
  };

  const toggleStudent = (studentId: string) => {
    setNewLesson((prev) => ({
      ...prev,
      student_ids: prev.student_ids.includes(studentId)
        ? prev.student_ids.filter((id) => id !== studentId)
        : [...prev.student_ids, studentId],
    }));
  };

  const lessonsForSelectedDay = lessons.filter(l => l.date === selectedDate);
  const markedDates = lessons.reduce((acc: any, lesson) => {
    acc[lesson.date] = { marked: true, dotColor: "#4CAF50" };
    return acc;
  }, {});

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#4CAF50" /></View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Zarządzanie lekcjami</Text>
      
      <Calendar
        markedDates={{
          ...markedDates,
          [selectedDate]: { selected: true, selectedColor: "#4CAF50" },
        }}
        onDayPress={(day) => {
            setSelectedDate(day.dateString);
            setNewLesson(prev => ({ ...prev, date: day.dateString }));
        }}
        theme={{ todayTextColor: '#4CAF50', arrowColor: '#4CAF50' }}
      />

     <View style={styles.dayDetails}>
  <Text style={styles.sectionTitle}>Lekcje w dniu {selectedDate}:</Text>
  {lessonsForSelectedDay.length > 0 ? (
    lessonsForSelectedDay.map((lesson) => (
      <Pressable 
        key={lesson.id} 
        onPress={() => router.push({
          pathname: "/(teacher)/[lessonId]",
          params: { lessonId: lesson.id }
        })}
        style={({ pressed }) => [
          styles.lessonItem,
          { backgroundColor: pressed ? '#f0f0f0' : 'transparent' }
        ]}
      >
        <View style={styles.lessonRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.lessonSub}>{lesson.topic}</Text>
            <Text style={styles.lessonTopic}>
              {lesson.subject} • Klasa {lesson.class}
            </Text>
          </View>
          <Text style={styles.chevron}>→</Text>
        </View>
      </Pressable>
    ))
  ) : (
    <Text style={styles.emptyText}>Brak zajęć w tym dniu.</Text>
  )}
</View>

      <TouchableOpacity
        onPress={() => setIsAddLessonOpen(!isAddLessonOpen)}
        style={styles.collapseHeader}
      >
        <Text style={styles.collapseTitle}>➕ Dodaj nową lekcję</Text>
        <Text>{isAddLessonOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isAddLessonOpen && (
        <View style={styles.form}>
          <Text style={styles.label}>Data:</Text>
          <TextInput
            placeholder="YYYY-MM-DD"
            value={newLesson.date}
            onChangeText={(text) => setNewLesson({ ...newLesson, date: text })}
            style={styles.input}
          />

          <TextInput
            placeholder="Temat lekcji"
            value={newLesson.topic}
            onChangeText={(text) => setNewLesson({ ...newLesson, topic: text })}
            style={styles.input}
          />

          <TextInput
            placeholder="Przedmiot (np. Matematyka)"
            value={newLesson.subject}
            onChangeText={(text) => setNewLesson({ ...newLesson, subject: text })}
            style={styles.input}
          />

          <TextInput
            placeholder="Klasa (np. 1A)"
            value={newLesson.class}
            onChangeText={(text) => setNewLesson({ ...newLesson, class: text })}
            style={styles.input}
          />

          <Text style={styles.label}>Wybierz uczniów:</Text>
          <View style={styles.studentGrid}>
            {students.map((student) => (
              <TouchableOpacity
                key={student.id}
                onPress={() => toggleStudent(student.id)}
                style={[
                  styles.studentChip,
                  newLesson.student_ids.includes(student.id) && styles.studentChipSelected
                ]}
              >
                <Text style={[
                  styles.studentChipText,
                  newLesson.student_ids.includes(student.id) && styles.studentChipTextSelected
                ]}>
                  {student.first_name} {student.last_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={addLesson}>
            <Text style={styles.submitBtnText}>Zatwierdź i dodaj</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  dayDetails: { marginTop: 20, backgroundColor: '#fff', padding: 15, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  lessonItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  lessonTopic: { fontWeight: 'bold', fontSize: 15 },
  lessonSub: { color: '#666', fontSize: 13 },
  emptyText: { color: '#999', fontStyle: 'italic' },
  collapseHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderRadius: 12, marginTop: 15, elevation: 2 },
  collapseTitle: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
  form: { marginTop: 15, backgroundColor: '#fff', padding: 15, borderRadius: 12 },
  label: { fontWeight: '600', marginBottom: 5, marginTop: 10, color: '#555' },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  studentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  studentChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  studentChipSelected: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  studentChipText: { fontSize: 12, color: '#666' },
  studentChipTextSelected: { color: '#fff', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, marginTop: 20, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  
  chevron: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});