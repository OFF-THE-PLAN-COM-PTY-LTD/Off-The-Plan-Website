"use client";

import { useState } from "react";

const LIFESTYLE_OPTIONS = [
  "Bar area",
  "BBQ Facilities",
  "Bike share",
  "Bin Chute",
  "Book Retreat and Library",
  "Building manager / Concierge",
  "Business center",
  "Cabanas",
  "Car share",
  "City views",
  "Co working options",
  "Consultation Room",
  "Delivery Room",
  "Dining room(s)",
  "EV charging capability",
  "Fireplaces",
  "Fully Equipped Gym",
  "Guest apartment",
  "Jacuzzi/Spa(s)",
  "Kids Play Area",
  "Lounge and Casual dining",
  "Massage Room",
  "Music Room",
  "Outdoor fireplace",
  "Outdoor Gym",
  "Outdoor Theatre",
  "Putting Green",
  "Rooftop Garden",
  "Sauna and Steam Rooms",
  "Sky Deck",
  "Swimming Pool(s)",
  "Tennis Courts",
  "Teppanyaki Grill",
  "Theatre",
  "Waterfront",
  "Wine Cellar",
  "Yoga Studio",
];

export function AddYourOwn({
  lifestyle,
  setLifestyle,
  standardOptions = LIFESTYLE_OPTIONS,
}: {
  lifestyle: string[];
  setLifestyle: React.Dispatch<React.SetStateAction<string[]>>;
  /**
   * Features considered "standard" — anything in `lifestyle` not in this
   * list is treated as user-added and shown in the custom section.
   * Defaults to the residential list (LIFESTYLE_OPTIONS) for back-compat
   * but should be passed the current category's feature list when known.
   */
  standardOptions?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  function add() {
    const trimmed = value.trim();
    if (trimmed && !lifestyle.includes(trimmed)) {
      setLifestyle((prev) => [...prev, trimmed]);
    }
    setValue("");
    setOpen(false);
  }

  const custom = lifestyle.filter((item) => !standardOptions.includes(item));

  return (
    <div className="mt-4">
      {custom.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {custom.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 font-sans text-sm text-ink/80"
            >
              <input type="checkbox" checked readOnly className="w-4 h-4 accent-orange flex-shrink-0" />
              {item}
              <button
                type="button"
                onClick={() => setLifestyle((prev) => prev.filter((x) => x !== item))}
                className="text-ink/30 hover:text-red-500 ml-1 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {open ? (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            placeholder="Enter feature name"
            autoFocus
            className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 transition-colors w-64"
          />
          <button type="button" onClick={add} className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors">
            Add
          </button>
          <button type="button" onClick={() => { setOpen(false); setValue(""); }} className="font-mono text-[10px] uppercase tracking-widest text-ink/40 hover:text-ink transition-colors">
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-sans text-sm text-orange hover:underline mt-1"
        >
          + Add your own
        </button>
      )}
    </div>
  );
}
