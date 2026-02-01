import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase"; // Sprawdź czy ścieżka jest poprawna

interface Grade { 
    id: string; 
    value: string; 
    comment: string; 
    subject: string; 
    created_at: string; 
}

export default function StudentGrades() {
    const router = useRouter();
    const [grades, setGrades] = useState<Grade[]>([]);
    const [userdata, setUserdata] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            console.log("Oceny: Pobieranie sesji...");
            
            // Bezpieczniejszy getSession
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session?.user) {
                console.log("Oceny: Brak sesji");
                router.replace("/login");
                return;
            }

            const userId = session.user.id;

            // Pobieranie ocen i profilu równolegle
            const [gradesRes, profileRes] = await Promise.all([
                supabase
                    .from("grades")
                    .select("id, value, comment, subject, created_at")
                    .eq("student_id", userId),
                supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", userId)
                    .single()
            ]);

            if (gradesRes.error) console.warn("Błąd pobierania ocen:", gradesRes.error.message);

            setGrades(gradesRes.data || []);
            setUserdata(profileRes.data || null);

        } catch (error) {
            console.error("Oceny: Błąd krytyczny:", error);
        } finally {
            setLoading(false);
        }
    };

    // Grupowanie ocen według przedmiotów
    const gradesBySubject = grades.reduce<Record<string, Grade[]>>((acc, grade) => {
        const subject = grade.subject || "Inne";
        if (!acc[subject]) {
            acc[subject] = [];
        }
        acc[subject].push(grade);
        return acc;
    }, {});

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={{ marginTop: 10 }}>Wczytywanie Twoich ocen...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Pressable onPress={() => router.replace("/(student)")}>
                <Text style={styles.backLink}>← Wróć do panelu głównego</Text>
            </Pressable>

            <Text style={styles.title}>Twoje wyniki</Text>
            <Text style={styles.subtitle}>Uczeń: {userdata?.first_name} {userdata?.last_name}</Text>

            <View style={styles.gradesSection}>
                {Object.keys(gradesBySubject).length > 0 ? (
                    Object.entries(gradesBySubject).map(([subject, subjectGrades]) => (
                        <View key={subject} style={styles.subjectCard}>
                            <Text style={styles.subjectTitle}>{subject}</Text>
                            <View style={styles.gradesList}>
                                {subjectGrades.map((grade) => (
                                    <View key={grade.id} style={styles.gradeItem}>
                                        <View style={styles.gradeBadge}>
                                            <Text style={styles.gradeValue}>{grade.value}</Text>
                                        </View>
                                        <View style={styles.gradeDetails}>
                                            <Text style={styles.gradeDate}>
                                                {new Date(grade.created_at).toLocaleDateString()}
                                            </Text>
                                            {grade.comment ? (
                                                <Text style={styles.gradeComment}>{grade.comment}</Text>
                                            ) : null}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Nie masz jeszcze żadnych ocen.</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    backLink: { color: "#4f46e5", marginBottom: 20, fontWeight: "600" },
    title: { fontSize: 26, fontWeight: 'bold', color: '#1e293b' },
    subtitle: { fontSize: 16, color: '#64748b', marginBottom: 24 },
    gradesSection: { paddingBottom: 40 },
    subjectCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 3,
    },
    subjectTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 8,
    },
    gradesList: { gap: 12 },
    gradeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    gradeBadge: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#c7d2fe',
    },
    gradeValue: { fontSize: 18, fontWeight: 'bold', color: '#4f46e5' },
    gradeDetails: { marginLeft: 12, flex: 1 },
    gradeDate: { fontSize: 12, color: '#94a3b8' },
    gradeComment: { fontSize: 14, color: '#475569', marginTop: 2 },
    emptyContainer: { marginTop: 40, alignItems: 'center' },
    emptyText: { color: '#94a3b8', fontSize: 16 }
});