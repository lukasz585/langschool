import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

interface Lesson { id: string; date: string; topic: string; subject: string; }
interface Grade { id: string; value: string; subject: string; }

export default function StudentDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userdata, setUserdata] = useState<any>(null);
    const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
    const [average, setAverage] = useState<string>("0.00");
    const [recentGrades, setRecentGrades] = useState<Grade[]>([]);
    const [latestGrade, setLatestGrade] = useState<Grade | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const userId = session.user.id;

            // Pobieramy profil, lekcje i oceny równolegle
            const [profileRes, lessonsRes, gradesRes] = await Promise.all([
                supabase.from("profiles").select("*").eq("id", userId).single(),
                supabase.from("lessons").select("*").eq("student_id", userId).order('date', { ascending: true }),
                supabase.from("grades").select("*").eq("student_id", userId).order('created_at', { ascending: false })
            ]);

            // 1. Dane profilu
            setUserdata(profileRes.data);

            // 2. Logika najbliższej lekcji
            if (lessonsRes.data) {
                const today = new Date().toISOString().split('T')[0];
                const upcoming = lessonsRes.data.find(l => l.date >= today);
                setNextLesson(upcoming || null);
            }

            // 3. Logika średniej i ostatnich ocen
            if (gradesRes.data && gradesRes.data.length > 0) {
                const total = gradesRes.data.reduce((acc, curr) => acc + parseFloat(curr.value), 0);
                const avg = total / gradesRes.data.length;
                setAverage(avg.toFixed(2));
                const latest = gradesRes.data[0];
                setLatestGrade(latest);
                setRecentGrades(gradesRes.data.slice(0, 3)); // Tylko 3 ostatnie
            }

        } catch (error) {
            console.error("Dashboard Error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.welcomeSection}>
                <Text style={styles.welcomeText}>Cześć, {userdata?.first_name || 'Uczniu'}! 👋</Text>
                <Text style={styles.dateText}>{new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
            </View>

            {/* Sekcja statystyk */}
<View style={styles.statsRow}>
    {/* KARTA 1: Średnia */}
    <View style={styles.statCard}>
        <Text style={styles.statLabel}>Twoja średnia</Text>
        <Text style={styles.statValue}>{average}</Text>
    </View>

    {/* KARTA 2: Ostatnia ocena */}
    <View style={[styles.statCard, { backgroundColor: '#eef2ff' }]}>
        <Text style={styles.statLabel}>Ostatnia ocena</Text>
        {latestGrade ? (
            <View>
                <Text style={[styles.statValue, { color: '#4f46e5' }]}>
                    {latestGrade.value}
                </Text>
                <Text style={styles.latestSubjectText} numberOfLines={1}>
                    {latestGrade.subject}
                </Text>
            </View>
        ) : (
            <Text style={styles.statValue}>-</Text>
        )}
    </View>
</View>

            {/* KARTA: Najbliższa lekcja */}
            <Text style={styles.sectionTitle}>Najbliższe zajęcia</Text>
            {nextLesson ? (
                <Pressable 
                    key={nextLesson.id}
                            onPress={() => router.push({
                                pathname: "/(student)/[lessonId]",
                                params: { lessonId: nextLesson.id },
                            })}
                    style={styles.nextLessonCard}
                >
                    <View style={styles.lessonIconBadge}>
                        <Text style={{ fontSize: 24 }}>📚</Text>
                    </View>
                    <View>
                        <Text style={styles.lessonTopic}>{nextLesson.topic}</Text>
                        <Text style={styles.lessonDate}>{nextLesson.date}</Text>
                        <Text style={styles.lessonSubject}>{nextLesson.subject || "Lekcja indywidualna"}</Text>
                    </View>
                </Pressable>
            ) : (
                <Text style={styles.emptyText}>Brak zaplanowanych lekcji.</Text>
            )}

           

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    welcomeSection: { marginBottom: 24, marginTop: 10 },
    welcomeText: { fontSize: 26, fontWeight: 'bold', color: '#1e293b' },
    dateText: { fontSize: 14, color: '#64748b', textTransform: 'capitalize' },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statCard: { 
        flex: 1, 
        backgroundColor: '#fff', 
        padding: 16, 
        borderRadius: 16, 
        elevation: 2,
        shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }
    },
    statLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 4 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 12 },
    linkText: { color: '#4f46e5', fontWeight: '600' },
    nextLessonCard: { 
        backgroundColor: '#4f46e5', 
        padding: 20, 
        borderRadius: 20, 
        flexDirection: 'row', 
        alignItems: 'center',
        marginBottom: 24
    },
    latestSubjectText: {
        fontSize: 12,
        color: '#4f46e5',
        fontWeight: '600',
        marginTop: -2, // Przybliża nazwę przedmiotu do dużej cyfry oceny
    },
    lessonIconBadge: { 
        width: 50, height: 50, backgroundColor: 'rgba(255,255,255,0.2)', 
        borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 
    },
    lessonTopic: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    lessonDate: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    lessonSubject: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 4, fontWeight: '600' },
    gradesList: { backgroundColor: '#fff', borderRadius: 16, padding: 8 },
    gradeRow: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' 
    },
    gradeSubject: { color: '#475569', fontWeight: '500' },
    gradeBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    gradeValue: { fontWeight: 'bold', color: '#1e293b' },
    emptyText: { color: '#94a3b8', textAlign: 'center', marginVertical: 20 }
});