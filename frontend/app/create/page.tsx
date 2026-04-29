import { CreateMarketForm } from "@/components/create-market-form";
import { PrivacyPanel } from "@/components/privacy-panel";

export default function CreatePage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Market Factory</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Create a prediction or opinion market</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Prediction markets resolve by an oracle-style creator call. Opinion markets resolve from encrypted aggregate voting with a quorum threshold.
        </p>
      </div>
      <CreateMarketForm />
      <PrivacyPanel />
    </div>
  );
}
