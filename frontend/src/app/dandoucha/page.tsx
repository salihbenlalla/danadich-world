"use client";

import dynamic from "next/dynamic";

const DandouchaExperience = dynamic(
  () => import("./DandouchaExperience"),
  { ssr: false }
);

export default function DandouchaPage() {
  return <DandouchaExperience />;
}
