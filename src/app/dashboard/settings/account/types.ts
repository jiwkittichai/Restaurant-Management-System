export type Account = {
  id: number;
  displayName: string;
  username: string;
  email: string;
  emailVerified: boolean;
};

export type Feedback = { type: "success" | "error"; text: string } | null;
export type AccountTask = "profile" | "email" | "password" | null;
