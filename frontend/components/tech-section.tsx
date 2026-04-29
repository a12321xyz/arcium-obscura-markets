import { Cpu, Lock, Network, Zap } from "lucide-react";

const steps = [
  {
    icon: Lock,
    title: "Client-Side Encryption",
    description: "User bets (amount and outcome) are encrypted in the browser using the Arcium SDK (X25519 + Rescue).",
    color: "text-primary"
  },
  {
    icon: Network,
    title: "MPC Processing",
    description: "Arcium Multi-Party Computation (MPC) nodes update the market's aggregate pools without decrypting individual data.",
    color: "text-secondary"
  },
  {
    icon: Cpu,
    title: "MXE Computation",
    description: "The Multi-Chain Execution (MXE) environment manages the state transitions and ensures deterministic outcomes.",
    color: "text-accent"
  },
  {
    icon: Zap,
    title: "On-Chain Settlement",
    description: "Solana Anchor program receives the signed aggregate results and handles payouts via the vault PDA.",
    color: "text-primary"
  }
];

export function TechSection() {
  return (
    <section className="py-12">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">The Arcium Obscura Stack</h2>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          Arcium Obscura Markets leverages Multi-Party Computation to preserve the integrity of the betting window.
        </p>
      </div>

      <div className="relative">
        {/* Connector line for desktop */}
        <div className="absolute top-1/2 left-0 hidden w-full -translate-y-1/2 border-t border-dashed border-white/10 lg:block" />
        
        <div className="grid gap-8 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-card shadow-glow-sm relative z-10">
                  <Icon className={`h-8 w-8 ${step.color}`} />
                  <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold border border-white/10">
                    0{index + 1}
                  </div>
                </div>
                <h3 className="mb-3 text-lg font-bold">{step.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-16 rounded-[2rem] border border-white/10 bg-white/[0.02] p-8 lg:p-12">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h3 className="text-2xl font-black mb-6">Why Privacy Matters</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Zero Herding Bias</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    In public markets, large bets influence latecomers. Arcium hides these signals, ensuring every participant votes their true conviction.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Anti Front-Running</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    MEV bots cannot exploit your intent because the plaintext outcome only exists inside the MPC cluster during computation.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Network className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Decentralized Opinion</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Opinion markets resolve through collective private voting, preventing social pressure and censorship from skewing the results.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,229,255,0.1),transparent_70%)] animate-pulse" />
            
            {/* Simulation of secret sharing nodes */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="h-4/5 w-4/5 rounded-full border border-dashed border-primary/40 animate-[spin_20s_linear_infinite]" />
              <div className="absolute h-4/5 w-4/5 rounded-full border border-dashed border-secondary/40 animate-[spin_30s_linear_infinite_reverse]" />
            </div>

            <div className="relative z-10 flex flex-col items-center p-8">
              <div className="h-32 w-32 rounded-full border border-white/20 bg-black/40 backdrop-blur-xl flex items-center justify-center shadow-2xl mb-6 group-hover:scale-110 transition-transform duration-500">
                 <ShieldCheck className="h-16 w-16 text-primary" />
              </div>
              <p className="text-sm font-black text-foreground uppercase tracking-[0.2em] mb-2">MPC Privacy Shield</p>
              <div className="h-px w-12 bg-primary/40 mb-4" />
              <p className="text-[10px] font-mono text-muted-foreground text-center max-w-[200px] leading-relaxed uppercase tracking-tighter opacity-80">
                Rescue Cipher • X25519 Keys<br/>
                Threshold MPC • Zero-Knowledge<br/>
                Signed Callback Verification
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
