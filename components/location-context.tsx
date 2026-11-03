"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { defaultLocation, getDistrict, states } from "@/data/geo";
import { useLocale } from "@/components/locale-context";
import type { LocationSelection } from "@/lib/types";

export type AreaType = "urban" | "rural" | "unknown";

export type SavedLocation = LocationSelection & { areaType: AreaType };

type LocationContextValue = {
  location: SavedLocation;
  hydrated: boolean;
  label: string;
  setLocation: (next: SavedLocation) => void;
  areaType: AreaType;
  setAreaType: (areaType: AreaType) => void;
  isLocationOpen: boolean;
  openLocation: () => void;
  closeLocation: () => void;
};

const initial: SavedLocation = {
  stateId: defaultLocation.stateId,
  districtId: defaultLocation.districtId,
  areaType: "unknown",
};

const LocationContext = createContext<LocationContextValue | null>(null);

const STORAGE_KEY = "kbp_location_v1";
const AREA_KEY = "kbp_area_type_v1";

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<SavedLocation>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [isLocationOpen, setLocationOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SavedLocation>;
        const validState = states.find((state) => state.id === parsed.stateId);
        const validDistrict = validState?.districts.find((district) => district.id === parsed.districtId);
        if (validState && validDistrict) {
          setLocationState({
            stateId: validState.id,
            districtId: validDistrict.id,
            pin: parsed.pin,
            constituency: parsed.constituency,
            city: parsed.city,
            areaType: (localStorage.getItem(AREA_KEY) as AreaType) || parsed.areaType || "unknown",
          });
        }
      }
    } catch {
      // Ignore malformed local storage.
    }
    setHydrated(true);
  }, []);

  const setLocation = useCallback((next: SavedLocation) => {
    setLocationState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      localStorage.setItem(AREA_KEY, next.areaType);
    } catch {
      // Storage can be unavailable in private mode; in-memory state still works.
    }
  }, []);

  const setAreaType = useCallback(
    (areaType: AreaType) => setLocation({ ...location, areaType }),
    [location, setLocation],
  );

  const { locale } = useLocale();

  const label = useMemo(() => {
    const found = getDistrict(location.districtId);
    if (!found) return location.label ?? (locale === "hi" ? "उत्तर प्रदेश" : "Uttar Pradesh");
    return locale === "hi"
      ? `${found.district.nameHi}, ${found.state.nameHi}`
      : `${found.district.nameEn}, ${found.state.nameEn}`;
  }, [location.districtId, location.label, locale]);

  const value = useMemo(
    () => ({
      location,
      hydrated,
      label,
      setLocation,
      areaType: location.areaType,
      setAreaType,
      isLocationOpen,
      openLocation: () => setLocationOpen(true),
      closeLocation: () => setLocationOpen(false),
    }),
    [location, hydrated, label, setLocation, setAreaType, isLocationOpen],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error("useLocation must be used inside LocationProvider");
  return context;
}
