import { useEffect, useRef, useState } from "react";
import { LocateFixed, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { TxLocation } from "@/lib/finance/types";
import { readCurrentPosition, reversePlace, searchPlaces, type PlaceHit } from "@/lib/finance/places";

const FALLBACK = { lat: 20.5937, lng: 78.9629 };

export function LocationSheet({
  open,
  onOpenChange,
  initial,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: TxLocation | null;
  onConfirm: (location: TxLocation) => void;
}) {
  const initialRef = useRef(initial);
  initialRef.current = initial;
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const movedByUser = useRef(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [label, setLabel] = useState(initial?.label ?? "");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHits([]);
      return;
    }
    setLabel(initialRef.current?.label ?? "");
    const start = initialRef.current ?? FALLBACK;
    const zoom = initialRef.current ? 16 : 5;
    let cancelled = false;
    let map: import("leaflet").Map | null = null;
    let wait = 0;

    const boot = () => {
      const node = mapEl.current;
      if (!node) {
        wait = window.setTimeout(boot, 50);
        return;
      }
      void (async () => {
        try {
          const leaflet = await import("leaflet");
          await import("leaflet/dist/leaflet.css");
          if (cancelled || !mapEl.current) return;
          const L = leaflet.default ?? leaflet;
          map = L.map(mapEl.current, { zoomControl: false, attributionControl: true }).setView(
            [start.lat, start.lng],
            zoom,
          );
          L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap",
            maxZoom: 19,
          }).addTo(map);
          map.on("dragstart", () => {
            movedByUser.current = true;
          });
          map.on("moveend", () => {
            if (!movedByUser.current || !map) return;
            const center = map.getCenter();
            window.setTimeout(() => {
              void reversePlace(center.lat, center.lng)
                .then((next) => {
                  if (!cancelled && next) setLabel(next);
                })
                .catch(() => {});
            }, 500);
          });
          mapRef.current = map;
          window.setTimeout(() => map?.invalidateSize(), 280);
        } catch {
          if (!cancelled) setLabel("The map didn’t load. Try again in a moment.");
        }
      })();
    };
    boot();

    return () => {
      cancelled = true;
      window.clearTimeout(wait);
      map?.remove();
      mapRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      void searchPlaces(q, controller.signal)
        .then((next) => setHits(next))
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setHits([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 700);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => mapRef.current?.invalidateSize(), 60);
    return () => window.clearTimeout(timer);
  }, [hits.length]);

  function goTo(lat: number, lng: number, nextLabel: string, zoom = 16) {
    movedByUser.current = false;
    setLabel(nextLabel);
    setHits([]);
    setQuery("");
    mapRef.current?.setView([lat, lng], zoom);
  }

  function usePhone() {
    setLocating(true);
    void readCurrentPosition()
      .then(async (pos) => {
        const next = await reversePlace(pos.lat, pos.lng).catch(() => "");
        goTo(pos.lat, pos.lng, next);
      })
      .catch(() => toast.error("This phone didn’t share a location. Search the place instead."))
      .finally(() => setLocating(false));
  }

  function confirm() {
    const center = mapRef.current?.getCenter();
    if (!center) return;
    onConfirm({
      lat: center.lat,
      lng: center.lng,
      source: "map",
      ...(label ? { label } : {}),
    });
    onOpenChange(false);
  }

  return (
    <Drawer repositionInputs={false} open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Place</DrawerTitle>
          <DrawerDescription>Search where it happened, then nudge the pin if you need to.</DrawerDescription>
        </DrawerHeader>
        <div className="shrink-0 px-5 pt-1 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
            <input
              value={query}
              placeholder="Phoenix Mall, a neighbourhood, a station"
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-raised pr-3 pl-9 text-sm text-fg outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring/70"
            />
          </div>
          {hits.length > 0 ? (
            <ul className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto">
              {hits.map((hit) => (
                <li key={hit.id}>
                  <button
                    type="button"
                    onClick={() => goTo(hit.lat, hit.lng, hit.label)}
                    className="w-full rounded-xl bg-raised px-3 py-2.5 text-left text-sm text-fg"
                  >
                    {hit.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative mx-5 h-64 shrink-0 overflow-hidden rounded-2xl bg-raised">
          <div ref={mapEl} className="h-full w-full" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 z-[500] -translate-x-1/2 -translate-y-full">
            <span className="block size-3.5 rounded-full bg-expense shadow-float ring-4 ring-expense/30" />
          </div>
        </div>
        <DrawerBody className="pt-3">
          <p className="mb-3 text-sm text-muted">
            {searching ? "Searching…" : label || "Search, or use where this phone is now."}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="h-11 rounded-xl" onClick={usePhone} disabled={locating}>
              <LocateFixed className="size-4" />
              {locating ? "Finding…" : "This phone"}
            </Button>
            <Button type="button" className="h-11 flex-1 rounded-xl" onClick={confirm}>
              Use this place
            </Button>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
