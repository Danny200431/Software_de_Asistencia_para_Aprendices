import type { ReactNode } from "react";
import { HomeNavbar } from "@/src/features/auth/components/HomeNavbar";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HomeNavbar />
      {children}
    </>
  );
}
