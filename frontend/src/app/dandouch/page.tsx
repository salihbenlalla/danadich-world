"use client";

import dynamic from "next/dynamic";

const DandouchDashboard = dynamic(
  () => import("./DandouchDashboard"),
  { ssr: false }
);

export default function DandouchPage() {
  return <DandouchDashboard />;
}
