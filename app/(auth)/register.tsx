import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { supabase } from "../../supabase";

export default function Register() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher" | "admin">("student");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
  console.log("START REGISTER");

  if (!firstName || !lastName || !email || !password) {
    Alert.alert("Błąd", "Uzupełnij wszystkie pola");
    return;
  }

  setLoading(true);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  console.log("SIGNUP DATA:", data);
  console.log("SIGNUP ERROR:", error);

  if (error) {
    setLoading(false);
    Alert.alert("SIGNUP ERROR", error.message);
    return;
  }

  const userId = data.user?.id ?? data.session?.user?.id;

  console.log("USER ID:", userId);

  if (!userId) {
    setLoading(false);
    Alert.alert("INFO", "Brak userId (email confirmation?)");
    return;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      email,
      user_type: role,
    });

  console.log("PROFILE ERROR:", profileError);

  setLoading(false);

  if (profileError) {
    Alert.alert("PROFILE ERROR", profileError.message);
  } else {
    Alert.alert("SUKCES", "Konto utworzone");
    router.replace("/login");
  }
};


  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Rejestracja</Text>

      <TextInput
        placeholder="Imię"
        value={firstName}
        onChangeText={setFirstName}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

      <TextInput
        placeholder="Nazwisko"
        value={lastName}
        onChangeText={setLastName}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

      <TextInput
        placeholder="Hasło"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

      <Text style={{ marginTop: 10 }}>Rodzaj konta</Text>

      <View style={{ borderWidth: 1, marginBottom: 20 }}>
        <Picker selectedValue={role} onValueChange={(v) => setRole(v)}>
          <Picker.Item label="Uczeń" value="student" />
          <Picker.Item label="Nauczyciel" value="teacher" />
          <Picker.Item label="Administrator" value="admin" />
        </Picker>
      </View>
      
      <Button title={loading ? "Tworzenie konta..." : "Załóż konto"} onPress={handleRegister} />
      
    </View>
  );
}