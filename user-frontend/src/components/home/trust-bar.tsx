import { CreditCard, RefreshCcw, Tag, Truck } from "lucide-react";
import { LocaleText } from "@/components/i18n/locale-text";

const trustItems = [
  {
    titleEn: "Secure payments",
    titleKm: "ការទូទាត់មានសុវត្ថិភាព",
    descriptionEn: "KHQR and ABA PayWay",
    descriptionKm: "KHQR និង ABA PayWay",
    icon: CreditCard,
  },
  {
    titleEn: "Delivery across Cambodia",
    titleKm: "ដឹកជញ្ជូនគ្រប់ទីកន្លែង",
    descriptionEn: "Across 25 provinces and cities",
    descriptionKm: "២៥ ខេត្ត-ក្រុង",
    icon: Truck,
  },
  {
    titleEn: "Customer service",
    titleKm: "សេវាអតិថិជន",
    descriptionEn: "Quick help with information and orders",
    descriptionKm: "ផ្ដល់ព័ត៌មាន និងបញ្ជាទិញយ៉ាងរហ័ស",
    icon: RefreshCcw,
  },
  {
    titleEn: "Transparent pricing",
    titleKm: "តម្លៃច្បាស់លាស់",
    descriptionEn: "No hidden fees",
    descriptionKm: "ពុំមានថ្លៃលាក់",
    icon: Tag,
  },
];

export function TrustBar() {
  return (
    <section className="bg-gradient-to-r from-[#168DB5] via-[#21A8D8] to-[#F9318D] text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {trustItems.map((item) => (
          <div key={item.titleEn} className="flex items-start gap-3">
            <item.icon className="mt-0.5 h-6 w-6 shrink-0 text-white" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide">
                <LocaleText en={item.titleEn} km={item.titleKm} />
              </h3>
              <p className="mt-1 text-sm text-white/80">
                <LocaleText en={item.descriptionEn} km={item.descriptionKm} />
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
