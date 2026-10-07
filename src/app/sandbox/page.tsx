import type { Metadata } from "next";
import { SandboxApp } from "@/components/sandbox/SandboxApp";

export const metadata: Metadata = {
  title: "Sandbox · A2I2",
  description: "Run AI trading agents against a simulated Robinhood Chain fork, behind guardrails, entirely in your browser.",
};

export default function SandboxPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SandboxApp />
    </div>
  );
}
