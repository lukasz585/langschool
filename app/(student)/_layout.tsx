import { Slot, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Importujemy hooka
import { supabase } from '../../lib/supabase';

export default function StudentDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Pobieramy wymiary bezpiecznych stref
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserName(data.user?.email || 'Uczeń');
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      {/* Header - doliczamy insets.top, aby nie chował się pod wycięciem/notchem */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>Panel Ucznia</Text>
        <Text style={styles.userName}>{userName}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Wyloguj</Text>
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <Slot />
      </View>

      {/* Bottom Tab - doliczamy insets.bottom, aby nie chował się pod przyciskami systemowymi */}
      <View style={[
        styles.tabBar, 
        { paddingBottom: (insets.bottom > 0 ? insets.bottom : 10) + 15,
          // Dodajemy większy padding od góry, aby pasek był wyższy
          paddingTop: 15}
      ]}>
         <TouchableOpacity onPress={() => router.replace('/(student)')} style={styles.tabButton}>
          <Text style={styles.tabText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(student)/courses')} style={styles.tabButton}>
          <Text style={styles.tabText}>Plan zajęć</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(student)/grades')} style={styles.tabButton}>
          <Text style={styles.tabText}>Oceny</Text>
        </TouchableOpacity>
    {/* <TouchableOpacity onPress={() => router.replace('/(student)/teachers')} style={styles.tabButton}>
          <Text style={styles.tabText}>Nauczyciele</Text>
        </TouchableOpacity>*/}
       
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  userName: { color: '#fff', marginTop: 5 },
  logoutBtn: { marginTop: 10 },
  logoutText: { color: '#fff', fontWeight: 'bold' },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 10,},
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40, // Stała wysokość dla równego rozłożenia kresek
  },
  divider: {
    borderRightWidth: 1,
    borderRightColor: '#ddd', // Kolor pionowej kreski
  },
  tabText: { 
    color: '#4CAF50', 
    fontWeight: '700', 
    fontSize: 13,
    textAlign: 'center'
  },
});