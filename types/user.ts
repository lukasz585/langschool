export type UserType = "student" | "teacher" | "parent";

export interface User { id: string; email: string; role: UserType; }