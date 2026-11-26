import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      roles: string[];
      permissions: string[];
      departmentId: string | null;
      departmentName: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    username: string;
    roles: string[];
    permissions: string[];
    departmentId: string | null;
    departmentName: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    roles: string[];
    permissions: string[];
    departmentId: string | null;
    departmentName: string | null;
  }
}
