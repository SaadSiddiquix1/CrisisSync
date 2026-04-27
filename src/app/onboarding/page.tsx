"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Plus, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCodeModal } from "@/components/qr-code-modal";

const colorPresets = ["#3B82F6", "#EF4444", "#22C55E", "#A855F7", "#F59E0B", "#06B6D4"];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [accentColor, setAccentColor] = useState("#3B82F6");
  const [monthlyLimit, setMonthlyLimit] = useState(50);
  const [venueSlug, setVenueSlug] = useState("");
  const [venueId, setVenueId] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "staff">("staff");
  const [pendingInvites, setPendingInvites] = useState<Array<{ email: string; role: string }>>([]);
  const [qrOpen, setQrOpen] = useState(false);

  const guestUrl = useMemo(
    () => `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/v/${venueSlug || "venue-slug"}`,
    [venueSlug]
  );

  const createVenue = async () => {
    const res = await fetch("/api/venues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: venueName, address, city, country, phone, accent_color: accentColor }),
    });
    const json = await res.json();
    if (res.ok) {
      setVenueSlug(json.venue.slug);
      setVenueId(json.venue.id);
      setStep(2);
    }
  };

  const addInvite = async () => {
    if (!inviteEmail) return;
    setPendingInvites((prev) => [...prev, { email: inviteEmail, role: inviteRole }]);
    setInviteEmail("");
  };

  return (
    <div className="app-shell min-h-[100svh] px-5 pb-10 pt-24">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#68B0FF] via-[#4F8CFF] to-[#FF7A59] shadow-[0_4px_16px_rgba(79,140,255,0.3)]">
              <Siren className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">CrisisSync</span>
          </Link>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? "w-8 bg-primary" : "w-4 bg-border"}`} />)}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold">Step 1: Create your venue</h2>
            <Input placeholder="Venue name" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
            <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <Input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
            <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Accent color</p>
              <div className="flex gap-2">
                {colorPresets.map((c) => (
                  <button key={c} className={`h-8 w-8 rounded-full border ${accentColor === c ? "border-foreground" : "border-border"}`} style={{ backgroundColor: c }} onClick={() => setAccentColor(c)} />
                ))}
              </div>
              <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
            </div>
            <Button className="h-11 w-full" onClick={() => void createVenue()} disabled={!venueName}>Create venue <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold">Step 2: Configure your venue</h2>
            <Input type="number" value={monthlyLimit} onChange={(e) => setMonthlyLimit(Number(e.target.value))} />
            <div className="rounded-xl border border-border bg-background p-3 text-sm">
              <p><span className="text-muted-foreground">Slug:</span> {venueSlug}</p>
              <p className="mt-1 break-all"><span className="text-muted-foreground">Guest URL:</span> {guestUrl}</p>
            </div>
            <Button variant="outline" className="h-11 w-full" onClick={() => setQrOpen(true)}>Generate QR code</Button>
            <p className="text-xs text-muted-foreground">Print this QR code and place it in every guest room, lobby, and elevator for the fastest demo-ready rollout.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="h-11" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /></Button>
              <Button className="h-11 flex-1" onClick={() => setStep(3)}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold">Step 3: Optional team rollout notes</h2>
            <p className="text-sm text-muted-foreground">
              For the hackathon demo, this step is optional. You can note the first staff/admin accounts you plan to invite later and launch straight into the command center now.
            </p>
            <Input placeholder="Email address" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            <select className="h-11 w-full rounded-lg border border-border bg-background px-3" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "admin" | "staff")}>
              <option value="admin">admin</option>
              <option value="staff">staff</option>
            </select>
            <Button className="h-11 w-full" onClick={() => void addInvite()}><Plus className="mr-2 h-4 w-4" />Save rollout note</Button>
            <div className="space-y-2">
              {pendingInvites.map((i) => (
                <div key={`${i.email}-${i.role}`} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  {i.email} <span className="text-muted-foreground">({i.role})</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">These entries are local planning notes for the demo flow. Live invitation management can be finished later from the admin/operator experience.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="h-11" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4" /></Button>
              <Button className="h-11 flex-1" onClick={() => router.push("/admin/dashboard")}>Launch command center</Button>
            </div>
          </div>
        )}
      </div>
      <QrCodeModal open={qrOpen} onOpenChange={setQrOpen} slug={venueSlug || venueId || "venue"} />
    </div>
  );
}
