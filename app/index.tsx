import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Index() {
  const router = useRouter();
  const [status, setStatus] = useState('Inicjalizacja...');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      setStatus('Sprawdzanie sesji...');
      const { data: { session }, error: authError } = await supabase.auth.getSession();

      if (authError) throw authError;

      if (!session) {
        console.log('Brak sesji, idę do login');
        router.replace('/login');
        return;
      }

      console.log('Sesja znaleziona dla:', session.user.id);
      setStatus('Pobieranie profilu...');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Błąd profilu:', profileError.message);
        setStatus(`Błąd: ${profileError.message}`);
        // Jeśli profilu nie ma w tabeli, wyloguj, żeby nie utknąć
        // await supabase.auth.signOut();
        // router.replace('/login');
        return;
      }

      console.log('Typ użytkownika:', profile?.user_type);
      setStatus(`Przekierowanie: ${profile?.user_type}`);

      if (profile?.user_type === 'student') router.replace('/(student)');
      else if (profile?.user_type === 'teacher') router.replace('/(teacher)');
      else if (profile?.user_type === 'parent') router.replace('/(parent)');
      else router.replace('/login');

    } catch (error) {
      console.error('Krytyczny błąd:', error);
      setStatus('Wystąpił błąd krytyczny');
      router.replace('/login');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4CAF50" />
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  statusText: { marginTop: 20, color: '#666', fontSize: 16 }
});