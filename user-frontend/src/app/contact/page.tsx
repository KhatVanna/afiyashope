import type { Metadata } from "next";
import Link from "next/link";
import { Headphones, Mail, MapPin } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { LocaleText } from "@/components/i18n/locale-text";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Afiya Shope customer support.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <ScrollReveal>
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            <LocaleText en="Home" km="ទំព័រដើម" />
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">
            <LocaleText en="Contact" km="ទំនាក់ទំនង" />
          </span>
        </nav>
      </ScrollReveal>

      <ScrollReveal delay={40}>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-navy">
            <LocaleText en="Contact" km="ទំនាក់ទំនង" />
          </h1>
          <p className="mt-3 text-lg font-medium">Tel: +1 (000) 000-0000</p>
          <p className="mt-2 text-muted-foreground">
            <LocaleText
              en="Questions about a product or your order? We typically reply within 24 hours."
              km="មានសំណួរអំពីទំនិញ ឬការបញ្ជាទិញរបស់អ្នកមែនទេ? ជាធម្មតា យើងឆ្លើយតបក្នុងរយៈពេល ២៤ ម៉ោង។"
            />
          </p>
        </div>
      </ScrollReveal>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <ScrollReveal delay={0}>
          <InfoCard
            icon={<Headphones className="h-5 w-5 text-primary" />}
            titleEn="Help & Contact"
            titleKm="ជំនួយ និងទំនាក់ទំនង"
            textEn="Speak with support for product advice and order help."
            textKm="ទាក់ទងផ្នែកជំនួយ ដើម្បីទទួលបានដំបូន្មានអំពីទំនិញ និងការបញ្ជាទិញ។"
          />
        </ScrollReveal>
        <ScrollReveal delay={90}>
          <InfoCard
            icon={<Mail className="h-5 w-5 text-primary" />}
            titleEn="Email"
            titleKm="អ៊ីមែល"
            textEn="support@afiyashope.local"
            textKm="support@afiyashope.local"
          />
        </ScrollReveal>
        <ScrollReveal delay={180}>
          <InfoCard
            icon={<MapPin className="h-5 w-5 text-primary" />}
            titleEn="Service Hours"
            titleKm="ម៉ោងបម្រើសេវា"
            textEn="Mon–Fri, 9:00–18:00"
            textKm="ចន្ទ–សុក្រ, ៩:០០–១៨:០០"
          />
        </ScrollReveal>
      </div>

      <ScrollReveal delay={80} className="mx-auto mt-10 max-w-2xl">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            <LocaleText en="Make contact" km="ផ្ញើសារមកយើង" />
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            <LocaleText
              en="Send us a message and our team will get back to you soon."
              km="ផ្ញើសារមកយើង ហើយក្រុមការងាររបស់យើងនឹងឆ្លើយតបក្នុងពេលឆាប់ៗនេះ។"
            />
          </p>
          <ContactForm />
        </div>
      </ScrollReveal>
    </div>
  );
}

function InfoCard({
  icon,
  titleEn,
  titleKm,
  textEn,
  textKm,
}: {
  icon: React.ReactNode;
  titleEn: string;
  titleKm: string;
  textEn: string;
  textKm: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
      <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        {icon}
      </div>
      <h3 className="font-semibold">
        <LocaleText en={titleEn} km={titleKm} />
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        <LocaleText en={textEn} km={textKm} />
      </p>
    </div>
  );
}
