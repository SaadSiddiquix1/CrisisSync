"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Languages, LogOut, Sparkles, UserSwitch2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useShowcase } from "@/components/showcase-provider";
import { ShowcaseLocaleToggle, ShowcaseModeToggle } from "@/components/showcase-controls";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { tShowcase } from "@/lib/showcase-i18n";

export function PersonaSwitcher({ role }: { role: "staff" | "admin" | "operator" }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { locale } = useShowcase();
  const [open, setOpen] = useState(false);

  const currentDashboard =
    role === "admin"
      ? "/admin/dashboard"
      : role === "staff"
        ? "/staff/dashboard"
        : "/operator/dashboard";

  const relogin = async (nextRole?: "staff" | "admin" | "operator") => {
    await supabase.auth.signOut();
    router.push(nextRole ? `/login?role=${nextRole}` : "/login");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="hidden rounded-2xl border border-border bg-background px-4 py-4 lg:block">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">{tShowcase(locale, "showcase.switcher")}</p>
            <p className="mt-1 text-xs text-muted-foreground">Jump between roles without getting trapped in the same session.</p>
          </div>
          <SheetTrigger className="touch-card inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
            <UserSwitch2 className="h-3.5 w-3.5" />
            {tShowcase(locale, "showcase.switcher")}
          </SheetTrigger>
        </div>
      </div>

      <SheetTrigger className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary text-primary-foreground shadow-[0_20px_48px_rgba(106,169,255,0.28)] lg:hidden">
        <UserSwitch2 className="h-5 w-5" />
      </SheetTrigger>

      <PersonaSheetBody
        locale={locale}
        onClose={() => setOpen(false)}
        onContinue={() => {
          setOpen(false);
          router.push(currentDashboard);
        }}
        onLoginAs={async (nextRole) => {
          setOpen(false);
          await relogin(nextRole);
        }}
        onLogout={async () => {
          setOpen(false);
          await relogin();
        }}
        pathname={pathname}
      />
    </Sheet>
  );
}

function PersonaSheetBody({
  locale,
  pathname,
  onClose: _onClose,
  onContinue,
  onLoginAs,
  onLogout,
}: {
  locale: "en" | "hi";
  pathname: string;
  onClose: () => void;
  onContinue: () => void;
  onLoginAs: (role: "staff" | "admin" | "operator") => Promise<void>;
  onLogout: () => Promise<void>;
}) {
  void _onClose;
  return (
    <SheetContent side="bottom" className="max-h-[86vh] rounded-t-[2rem] border-t border-border bg-[rgba(6,10,18,0.96)] px-0 pb-8 pt-0 text-white backdrop-blur-3xl">
      <SheetHeader className="border-b border-white/6 px-5 pb-4 pt-5">
        <SheetTitle className="text-white">{tShowcase(locale, "showcase.switcher")}</SheetTitle>
        <SheetDescription className="text-[#9CB2CF]">Current route: {pathname}</SheetDescription>
      </SheetHeader>
      <div className="space-y-5 px-5 pt-5">
        <div className="grid gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="touch-card flex items-center justify-between rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:border-white/16 hover:bg-white/[0.05]"
          >
            <div>
              <p className="text-sm font-semibold text-white">{tShowcase(locale, "showcase.continueRole")}</p>
              <p className="mt-1 text-sm text-[#AFC0D8]">Stay in the current authenticated workspace.</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-[#9FD0FF]" />
          </button>

          {(["admin", "staff", "operator"] as const).map((nextRole) => (
            <button
              key={nextRole}
              type="button"
              onClick={() => void onLoginAs(nextRole)}
              className="touch-card flex items-center justify-between rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:border-white/16 hover:bg-white/[0.05]"
            >
              <div>
                <p className="text-sm font-semibold text-white">
                  {nextRole === "admin"
                    ? tShowcase(locale, "login.admin")
                    : nextRole === "staff"
                      ? tShowcase(locale, "login.staff")
                      : tShowcase(locale, "login.operator")}
                </p>
                <p className="mt-1 text-sm text-[#AFC0D8]">{tShowcase(locale, "showcase.rolePortal")}</p>
              </div>
              <Sparkles className="h-4 w-4 text-[#9FD0FF]" />
            </button>
          ))}

          <button
            type="button"
            onClick={() => void onLogout()}
            className="touch-card flex items-center justify-between rounded-[1.4rem] border border-red-500/20 bg-red-500/10 px-4 py-4 text-left transition hover:bg-red-500/15"
          >
            <div>
              <p className="text-sm font-semibold text-white">{tShowcase(locale, "showcase.logout")}</p>
              <p className="mt-1 text-sm text-[#F5C6C2]">Clear the current session and return to the role portal.</p>
            </div>
            <LogOut className="h-4 w-4 text-[#FFB4AA]" />
          </button>
        </div>

        <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Languages className="h-4 w-4 text-[#9FD0FF]" />
            {tShowcase(locale, "showcase.locale")}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ShowcaseLocaleToggle />
            <ShowcaseModeToggle />
          </div>
        </div>
      </div>
    </SheetContent>
  );
}
