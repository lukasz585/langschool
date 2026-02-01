import { router } from "expo-router";
import { supabase } from "../supabase";

export const useAuth = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  switch (profile.role) {
    case "student":
      router.replace("/(student)");
      break;
    case "teacher":
      router.replace("/(teacher)");
      break;
    case "parent":
      router.replace("/(parent)");
      break;
    default:
      throw new Error(`Unknown role: ${profile.role}`);
  }
  
  
};

export const logout = async () => {
  await supabase.auth.signOut();
  router.replace("/(auth)/login");}