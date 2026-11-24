import { CreditCard, RefreshCcw, Tag, Truck } from "lucide-react";

const trustItems = [
  {
    title: "ការទូទាត់មានសុវត្ថិភាព",
    description: "KHQR និង ABA PayWay",
    icon: CreditCard,
  },
  {
    title: "ដឹកជញ្ជូនគ្រប់ទីកន្លែង",
    description: "២៥ ខេត្ត-ក្រុង",
    icon: Truck,
  },
  {
    title: "សេវាអតិថិជន",
    description: "ផ្ដល់ព័ត៌មាន និងបញ្ជាទិញយ៉ាងរហ័ស",
    icon: RefreshCcw,
  },
  {
    title: "តម្លៃច្បាស់លាស់",
    description: "ពុំមានថ្លៃលាក់",
    icon: Tag,
  },
];

export function TrustBar() {
  return (
    <section className="bg-gradient-to-r from-[#168DB5] via-[#21A8D8] to-[#F9318D] text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {trustItems.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <item.icon className="mt-0.5 h-6 w-6 shrink-0 text-white" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide">{item.title}</h3>
              <p className="mt-1 text-sm text-white/80">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
