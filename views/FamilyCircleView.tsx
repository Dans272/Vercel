import React from 'react';
import { ChevronLeft, ExternalLink } from 'lucide-react';

interface FamilyCircleViewProps {
  onBack: () => void;
}

/**
 * Embedded prototype for the Family Circle feature.
 * Notes:
 * - This is intentionally isolated (iframe) so it cannot interfere with the main app state.
 * - The prototype persists data in browser localStorage (key: familyCirclePrototypeV1).
 * - Next step for production is to port the UI into React and wire it to the Archive store + database.
 */
export default function FamilyCircleView({ onBack }: FamilyCircleViewProps) {
  return (
    <div className="flex flex-col h-full bg-[#f9f8f6]">
      <header className="pt-16 px-8 pb-4 bg-[#f5f2eb] border-b border-stone-200">
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-900"
          >
            <ChevronLeft size={18} />
            <span className="text-[11px] font-bold uppercase tracking-widest">Back</span>
          </button>

          <a
            href="/family_circle_prototype_post_bar.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-stone-500 hover:text-stone-900"
          >
            <span className="text-[11px] font-bold uppercase tracking-widest">Open full page</span>
            <ExternalLink size={16} />
          </a>
        </div>

        <div className="mt-4">
          <h2 className="text-3xl font-serif text-slate-800">Family Circle</h2>
          <p className="text-stone-400 text-[10px] font-bold uppercase">
            Prototype embedded for now
          </p>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="w-full h-full bg-white rounded-[28px] border border-stone-200 overflow-hidden shadow-sm">
          <iframe
            title="Family Circle Prototype"
            src="/family_circle_prototype_post_bar.html"
            className="w-full h-full"
          />
        </div>
      </main>
    </div>
  );
}
