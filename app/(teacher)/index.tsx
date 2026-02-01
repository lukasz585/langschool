import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function TeacherDashboard() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const [studentsRes, lessonsRes, profileRes] = await Promise.all([
        supabase.from("profiles").select("id, first_name").eq("user_type", "student"),
        supabase.from("lessons").select("*").eq("teacher_id", session.user.id).order('date', { ascending: true }),
        supabase.from("profiles").select("first_name").eq("id", session.user.id).single()
      ]);

      setStudents(studentsRes.data || []);
      setLessons(lessonsRes.data || []);
      setTeacherName(profileRes.data?.first_name || "");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const nextLesson = lessons.find(l => l.date >= new Date().toISOString().split('T')[0]);

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#4CAF50" /></View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Dzień dobry, {teacherName}! 👋</Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>UCZNIOWIE</Text>
          <Text style={styles.statValue}>{students.length}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.statLabel}>LEKCJE</Text>
          <Text style={[styles.statValue, { color: '#2E7D32' }]}>{lessons.length}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Najbliższa lekcja</Text>
      {nextLesson ? (
        <Pressable 
          onPress={() => router.push({
            pathname: "/(teacher)/lessons/[lessonId]",
            params: { lessonId: nextLesson.id }
          })}
          style={({ pressed }) => [
            styles.nextLessonCard,
            { opacity: pressed ? 0.8 : 1 } // Efekt kliknięcia
          ]}
        >
          <View style={styles.lessonHeader}>
             <Text style={styles.lessonSubject}>{nextLesson.subject}</Text>
             <View style={styles.badge}>
               <Text style={styles.badgeText}>{nextLesson.class}</Text>
             </View>
          </View>
          
          <Text style={styles.lessonTopic}>Temat: {nextLesson.topic}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.lessonFooter}>
            <Text style={styles.lessonInfo}>📅 {nextLesson.date}</Text>
            <Text style={styles.arrow}>Przejdź do zajęć →</Text>
          </View>
        </Pressable>
      ) : (
        <Text style={styles.emptyText}>Brak zaplanowanych lekcji.</Text>
      )}
      
      {/* Miejsce na dole, żeby ScrollView nie kończył się pod tab barem */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  welcomeSection: { marginBottom: 20, marginTop: 10 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  dateText: { fontSize: 14, color: '#666', textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 16, elevation: 2 },
  statLabel: { fontSize: 10, color: '#888', fontWeight: 'bold' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#444' },
  nextLessonCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, borderLeftWidth: 6, borderLeftColor: '#4CAF50', elevation: 4 },
  lessonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  lessonSubject: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  badge: { backgroundColor: '#4CAF50', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  lessonTopic: { fontSize: 15, color: '#666', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  lessonFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lessonInfo: { color: '#444', fontWeight: '500' },
  arrow: { color: '#4CAF50', fontWeight: 'bold' },
  emptyText: { color: '#999', textAlign: 'center', marginTop: 10 }
});