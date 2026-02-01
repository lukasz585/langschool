import { useRouter } from 'expo-router';
import { useState, } from 'react';
import {
  ActivityIndicator,
  Alert, Image, KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { supabase } from '../../lib/supabase';
import { UserType } from '../../types/user';

// ... (importy pozostają bez zmian)

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedType, setSelectedType] = useState<UserType>('student');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Błąd', 'Proszę wypełnić wszystkie pola');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Błąd', 'Proszę podać poprawny adres email');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Logowanie użytkownika
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Nie udało się zalogować');

      console.log('Zalogowano użytkownika:', authData.user.id);

      // 2. Pobierz profil z logowaniem czasu trwania (diagnostyka tunelu)
      console.log('Pobieram dane z tabeli profiles...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Błąd profilu:', profileError.message);
        // Jeśli nie ma profilu w bazie, nie pozwól zalogować (np. błąd RLS)
        await supabase.auth.signOut();
        throw new Error(`Błąd bazy danych: ${profileError.message}`);
      }

      console.log('Dane profilu pobrane:', profileData);

      // 3. Weryfikacja typu konta
      if (profileData?.user_type !== selectedType) {
        await supabase.auth.signOut();
        
        const typeNames = {
          student: 'Uczeń',
          teacher: 'Nauczyciel',
          parent: 'Rodzic',
        };
        
        Alert.alert(
          'Błędny typ konta',
          `To konto jest zarejestrowane jako "${typeNames[profileData?.user_type as UserType] || profileData?.user_type}". Proszę wybrać odpowiedni typ.`
        );
        setIsLoading(false);
        return;
      }

      // 4. Sukces - Przekierowanie
      console.log('Logowanie sukces, przekierowuję do:', selectedType);
      
      // Mała poprawka dla router.replace - wymuszamy ścieżkę absolutną
      if (selectedType === 'student') router.replace('/(student)');
      else if (selectedType === 'teacher') router.replace('/(teacher)');
      else if (selectedType === 'parent') router.replace('/(parent)');

    } catch (error: any) {
      console.error('Błąd procesu logowania:', error.message);
      
      let errorMessage = error.message;
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Nieprawidłowy email lub hasło';
      }
      
      Alert.alert('Błąd logowania', errorMessage);
      setIsLoading(false);
    }
  };

  // ... (reszta komponentu i style bez zmian)

  const accountTypes: { type: UserType; label: string; icon: string }[] = [
    { type: 'student', label: 'Uczeń', icon: '📚' },
    { type: 'teacher', label: 'Nauczyciel', icon: '👨‍🏫' }
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo i nagłówek */}
          <View style={styles.logoContainer}>
       {/* <Text style={styles.logo}>//🌍</Text> */}
            <View style={styles.logo}>
  <Image
    source={require("../../assets/images/logo.png")}
    style={{ width: 150, height: 150 }}
  />
</View>
            <Text style={styles.title}>LangSchool</Text>
            <Text style={styles.subtitle}>Zaloguj się do swojego konta</Text>
          </View>

          {/* Wybór typu konta */}
          <View style={styles.typeSelector}>
            <Text style={styles.sectionLabel}>Wybierz typ konta:</Text>
            <View style={styles.typeButtons}>
              {accountTypes.map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.typeButton,
                    selectedType === item.type && styles.typeButtonActive,
                  ]}
                  onPress={() => setSelectedType(item.type)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.typeButtonIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === item.type && styles.typeButtonTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Formularz logowania */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adres email</Text>
              <TextInput
                style={[styles.input, isLoading && styles.inputDisabled]}
                placeholder="twoj@email.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!isLoading}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hasło</Text>
              <TextInput
                style={[styles.input, isLoading && styles.inputDisabled]}
                placeholder="Wpisz hasło"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                editable={!isLoading}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.loginButtonText}>Logowanie...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Zaloguj się</Text>
              )}
            </TouchableOpacity>
          </View>

          <Pressable onPress={() => router.push('/register')} style={{ marginTop: 20 }}>
        <Text style={{ color: "blue", textAlign: "center" }}>
          Nie masz konta? Załóż je
        </Text>
      </Pressable>

          {/* Informacja pomocnicza */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              💡 Wybierz typ konta, który odpowiada Twojemu profilowi w systemie
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  content: {
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
  marginBottom: 16,
  alignItems: "center",
  justifyContent: "center",
},
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  typeSelector: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  typeButtonIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonDisabled: {
    backgroundColor: '#a5d6a7',
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  helpText: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
});