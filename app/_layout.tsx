import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { UserType } from '../types/user';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Sprawdź aktualną sesję
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Nasłuchuj zmian w autoryzacji
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUserType(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Błąd podczas ładowania profilu:', error);
        setUserType(null);
      } else {
        setUserType(data?.user_type || null);
      }
    } catch (error) {
      console.error('Wyjątek podczas ładowania profilu:', error);
      setUserType(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inStudentGroup = segments[0] === '(student)';
    const inTeacherGroup = segments[0] === '(teacher)';
    const inParentGroup = segments[0] === '(parent)';

    // Jeśli użytkownik nie jest zalogowany
    if (!session) {
      if (!inAuthGroup) {
        router.replace('/login');
      }
      return;
    }

    // Jeśli użytkownik jest zalogowany ale brak typu
    if (!userType) {
      router.replace('/login');
      return;
    }

    // Przekieruj do odpowiedniego panelu
    if (inAuthGroup) {
      switch (userType) {
        case 'student':
          router.replace('/(student)');
          break;
        case 'teacher':
          router.replace('/(teacher)');
          break;
        case 'parent':
          router.replace('/(parent)');
          break;
      }
      return;
    }

    // Sprawdź czy użytkownik jest w odpowiedniej grupie
    if (userType === 'student' && !inStudentGroup) {
      router.replace('/(student)');
    } else if (userType === 'teacher' && !inTeacherGroup) {
      router.replace('/(teacher)');
    } else if (userType === 'parent' && !inParentGroup) {
      router.replace('/(parent)');
    }
  }, [session, userType, segments, isLoading]);

  // Ekran ładowania
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(student)" options={{ headerShown: false }} />
      <Stack.Screen name="(teacher)" options={{ headerShown: false }} />
      <Stack.Screen name="(parent)" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});