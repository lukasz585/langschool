import { Slot, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function TeacherLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserName(data.user?.email?.split('@')[0] || 'Nauczyciel');
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const TabButton = ({ title, path, isLast = false }: { title: string, path: string, isLast?: boolean }) => (
    <TouchableOpacity 
      onPress={() => router.replace(path as any)} 
      style={styles.tabButton}
    >
      <View style={[styles.innerButton, !isLast && styles.divider]}>
        <Text style={styles.tabText}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header z uwzględnieniem górnej strefy bezpiecznej */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Panel Nauczyciela</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Wyloguj</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Slot />
      </View>

      {/* Dolny pasek z uwzględnieniem dolnej strefy bezpiecznej (HOME BAR) */}
      <View style={[
        styles.tabBar, 
        { 
          paddingBottom: (insets.bottom > 0 ? insets.bottom : 10) + 10,
          height: 70 + (insets.bottom > 0 ? insets.bottom : 0) 
        }
      ]}>
        <TabButton title="Start" path="/(teacher)" />
        <TabButton title="Plan zajęć" path="/(teacher)/courses" />
        <TabButton title="Oceny" path="/(teacher)/grades" />
    {/* <TabButton title="Czat" path="/(teacher)/chat" isLast={true} />*/}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#4CAF50',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  userName: { color: '#E8F5E9', fontSize: 14 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingpx: 12, paddingVertical: 6, borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 10,
  },
  tabButton: { flex: 1, justifyContent: 'center' },
  innerButton: { flex: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 15 },
  divider: { borderRightWidth: 1.5, borderRightColor: '#eee' },
  tabText: { color: '#4CAF50', fontWeight: '700', fontSize: 13 },
});