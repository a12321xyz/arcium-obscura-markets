import { LockKeyhole, ShieldCheck, UsersRound, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const items = [
  {
    icon: LockKeyhole,
    title: "Encrypted client-side",
    text: "Amount and outcome are encrypted with the Arcium SDK before they leave your browser."
  },
  {
    icon: Zap,
    title: "Processed in MPC",
    text: "Arcium MXE updates pools and resolves winners without any node seeing individual bets."
  },
  {
    icon: ShieldCheck,
    title: "No front-running",
    text: "Only aggregate pool data is public; individual bet size and side stay hidden until claim."
  },
  {
    icon: UsersRound,
    title: "Opinion markets",
    text: "No oracle needed. Private collective voting determines the winning outcome once quorum is met."
  }
];

export function PrivacyPanel() {
  return (
    <section className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 blur-3xl opacity-50" />
      <Card className="overflow-hidden border-white/10 bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem]">
        <CardContent className="grid gap-8 p-8 sm:p-12 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="group relative">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] ring-1 ring-white/10 transition-all group-hover:scale-110 group-hover:bg-primary/20 group-hover:ring-primary/40">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  {item.text}
                </p>
                {index < items.length - 1 && (
                  <div className="absolute -right-4 top-1/2 hidden h-12 w-px -translate-y-1/2 bg-white/5 lg:block" />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
