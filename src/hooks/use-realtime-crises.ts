import { useEffect, useState, useCallback, useRef } from "react";
import { Crisis } from "@/types/database";

export function useRealtimeCrises(venueId: string | null) {
  const [crises, setCrises] = useState<Crisis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousFirstIdRef = useRef<string | null>(null);

  const fetchCrises = useCallback(async () => {
    if (!venueId) {
      setCrises([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/crises?venue_id=${encodeURIComponent(venueId)}`, {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to load crises");
      }

      const nextCrises = (json.crises || []) as Crisis[];
      const previousFirstId = previousFirstIdRef.current;
      const nextFirstId = nextCrises[0]?.id ?? null;

      if (
        previousFirstId &&
        nextFirstId &&
        nextFirstId !== previousFirstId &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification("New Crisis Reported", {
          body: `${nextCrises[0].crisis_type} - ${nextCrises[0].location_description || "Location unknown"}`,
          icon: "/icon.png",
        });
      }

      previousFirstIdRef.current = nextFirstId;
      setCrises(nextCrises);
      setError(null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load crises");
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    void fetchCrises();
    if (!venueId) return;

    const poll = window.setInterval(() => {
      void fetchCrises();
    }, 5000);

    return () => {
      window.clearInterval(poll);
    };
  }, [venueId, fetchCrises]);

  return { crises, loading, error, refetch: fetchCrises };
}
