import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { supabase } from "../../lib/supabase"; // Sprawdź tę ścieżkę!

interface Lesson { id: string; date: string; topic: string; class?: string; }
interface Grade { id: string; value: string; comment: string; }

export default function StudentSchedule() {
    const router = useRouter();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [userdata, setUserdata] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // Używamy getSession dla uniknięcia "Auth session missing"
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session?.user) {
                console.log("Plan: Brak sesji");
                router.replace("/login");
                return;
            }

            const userId = session.user.id;

            // Pobieramy dane
            const [lessonsRes, profileRes] = await Promise.all([
                supabase.from("lessons").select("id, date, topic, class").eq("student_id", userId),
                supabase.from("profiles").select("*").eq("id", userId).single()
            ]);

            if (lessonsRes.error) console.warn("Błąd planu:", lessonsRes.error.message);

            setLessons(lessonsRes.data || []);
            setUserdata(profileRes.data || null);

        } catch (error) {
            console.error("Plan: Błąd krytyczny:", error);
        } finally {
            setLoading(false);
        }
    };

    const lessonsForSelectedDay = selectedDate
        ? lessons.filter(l => l.date === selectedDate)
        : [];

    const markedDates = lessons.reduce((acc: any, lesson) => {
        acc[lesson.date] = { marked: true, dotColor: "#4f46e5" };
        return acc;
    }, {});

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={{ marginTop: 10 }}>Ładowanie planu...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Pressable onPress={() => router.replace("/(student)")}>
                <Text style={styles.backLink}>← Wróć do panelu głównego</Text>
            </Pressable>

            <Text style={styles.title}>Cześć, {userdata?.first_name}!</Text>
            <Text style={styles.subtitle}>📅 Twoje nadchodzące zajęcia</Text>

            <Calendar
                markedDates={{
                    ...markedDates,
                    ...(selectedDate && {
                        [selectedDate]: {
                            ...markedDates[selectedDate],
                            selected: true,
                            selectedColor: "#4f46e5",
                        },
                    }),
                }}
                onDayPress={(day) => setSelectedDate(day.dateString)}
                theme={{
                    todayTextColor: '#4f46e5',
                    selectedDayBackgroundColor: '#4f46e5',
                    arrowColor: '#4f46e5',
                }}
            />

            <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>
                    {selectedDate ? `Zajęcia w dniu ${selectedDate}:` : "Wybierz dzień z kalendarza"}
                </Text>

                {lessonsForSelectedDay.length > 0 ? (
                    lessonsForSelectedDay.map((lesson) => (
                        <Pressable
                            key={lesson.id}
                            onPress={() => router.push({
                                pathname: "/(student)/lessons/[lessonId]",
                                params: { lessonId: lesson.id },
                            })}
                            style={styles.lessonCard}
                        >
                            <View>
                                <Text style={styles.lessonTopic}>{lesson.topic}</Text>
                                <Text style={styles.lessonInfo}>Klasa: {lesson.class || "Brak danych"}</Text>
                            </View>
                            <Text style={styles.arrow}>→</Text>
                        </Pressable>
                    ))
                ) : (
                    selectedDate && <Text style={styles.noLessons}>Brak zaplanowanych zajęć.</Text>
                )
            }
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    backLink: { color: "#4f46e5", marginBottom: 20, fontWeight: "600" },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
    subtitle: { fontSize: 18, color: '#666', marginBottom: 20 },
    detailsContainer: { marginTop: 20, paddingBottom: 40 },
    detailsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    lessonCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        marginBottom: 10,
        borderLeftWidth: 5,
        borderLeftColor: '#4f46e5',
        borderWidth: 1,
        borderColor: '#eee'
    },
    lessonTopic: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
    lessonInfo: { color: '#666', marginTop: 4 },
    arrow: { fontSize: 20, color: '#4f46e5' },
    noLessons: { textAlign: 'center', color: '#999', marginTop: 20 }
});