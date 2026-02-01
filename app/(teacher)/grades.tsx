import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
// SPRAWDŹ TĘ ŚCIEŻKĘ: jeśli masz plik w folderze głównym, użyj "../../supabase"
import { supabase } from "../../lib/supabase";

export default function TeacherGrades() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState("");

  const [newGrade, setNewGrade] = useState({
    student_id: "",
    value: "",
    comment: "",
    subject: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // getUser() czasem blokuje, getSession() jest bezpieczniejsze przy starcie
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setTeacherId(session.user.id);

      const { data: stData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("user_type", "student");

      setStudents(stData || []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const addGrade = async () => {
    if (!newGrade.student_id || !newGrade.value || !newGrade.subject) {
      Alert.alert("Błąd", "Wypełnij ucznia, przedmiot i ocenę!");
      return;
    }

    const { error } = await supabase.from("grades").insert([{
      ...newGrade,
      teacher_id: teacherId,
      value: newGrade.value.replace(',', '.')
    }]);

    if (error) Alert.alert("Błąd", error.message);
    else {
      Alert.alert("Sukces", "Ocena dodana!");
      setNewGrade({ student_id: "", value: "", comment: "", subject: "" });
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="green" /></View>;

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: 'white' }}>
      <Text style={styles.title}>Dodaj ocenę</Text>

      <Text style={styles.label}>Wybierz ucznia:</Text>
      <View style={styles.studentList}>
        {students.map(s => (
          <Pressable 
            key={s.id} 
            onPress={() => setNewGrade({...newGrade, student_id: s.id})}
            style={[styles.studentBtn, newGrade.student_id === s.id && styles.active]}
          >
            <Text style={{ color: newGrade.student_id === s.id ? 'white' : 'black' }}>
                {s.first_name} {s.last_name}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput placeholder="Przedmiot" value={newGrade.subject} onChangeText={t => setNewGrade({...newGrade, subject: t})} style={styles.input} />
      <TextInput placeholder="Ocena (1-6)" value={newGrade.value} onChangeText={t => setNewGrade({...newGrade, value: t})} keyboardType="numeric" style={styles.input} />
      <TextInput placeholder="Komentarz" value={newGrade.comment} onChangeText={t => setNewGrade({...newGrade, comment: t})} style={styles.input} />

      <Pressable onPress={addGrade} style={styles.btn}><Text style={{color: 'white', fontWeight: 'bold'}}>ZAPISZ OCENĘ</Text></Pressable>
      
      <Pressable onPress={() => router.replace("/(teacher)")} style={{marginTop: 20}}>
        <Text style={{color: 'blue', textAlign: 'center'}}>← Wróć</Text>
      </Pressable>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { marginBottom: 10, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 10 },
  btn: { backgroundColor: 'green', padding: 15, borderRadius: 8, alignItems: 'center' },
  studentList: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 15 },
  studentBtn: { padding: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 5 },
  active: { backgroundColor: 'green', borderColor: 'green' }
});