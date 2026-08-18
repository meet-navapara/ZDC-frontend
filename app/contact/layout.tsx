import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | zimji",
  description: "Get in touch with the zimji team for support, billing, or business inquiries.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
