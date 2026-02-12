import React from 'react';
import {
  ChevronLeft, ChevronRight, PenTool, Sparkles, History, ScrollText, Heart, MapPin,
  Anchor, Map as MapIcon, Quote, CloudUpload, ExternalLink, Library, Globe, Image as ImageIcon,
  Settings, Trash2, Users, UserPlus, Camera, Upload
} from 'lucide-react';
import { AppView, Profile, MediaItem, LifeEvent, FamilyTree } from '../types';
import { getEventIcon, getPlaceholderImage } from '../constants';
import { formatEventSentence, inferMediaKind } from '../utils/formatters';
import { formatFullDate } from '../utils/date';

type RelSet = { parents: Profile[]; spouses: Profile[]; children: Profile[] };

const ProfileView: React.FC<{
  activeProfile: Profile;
  profiles: Profile[];
  familyTrees: FamilyTree[];
  selectedTreeId: string | null;

  // navigation
  onBack: () => void;
  onEdit: () => void;
  onLinkRelative: (role: 'parent' | 'spouse' | 'child') => void;

  // mutations
  onDeleteProfile: () => void;
  onSetActiveProfile: (id: string) => void;

  // media upload
  onUploadMediaClick: () => void;
  onMediaFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mediaInputRef: React.RefObject<HTMLInputElement>;

  // event attachment
  attachingToEventId: string | null;
  setAttachingToEventId: (id: string | null) => void;

  // AI states + actions
  isAiLoading: boolean;
  isResearchLoading: boolean;
  isPhotoLoading: boolean;
  isGeneratingPortrait: boolean;

  onGenerateSummary: () => void;
  onResearch: () => void;
  onGeneratePortrait: () => void;

  // toast helper for inline triggers if needed
  showToast: (m: string) => void;
}> = (props) => {
  const {
    activeProfile, profiles,
    onBack, onEdit, onLinkRelative,
    onDeleteProfile, onSetActiveProfile,
    onUploadMediaClick, onMediaFileChange, mediaInputRef,
    attachingToEventId, setAttachingToEventId,
    isAiLoading, isResearchLoading, isPhotoLoading, isGeneratingPortrait,
    onGenerateSummary, onResearch, onGeneratePortrait
  } = props;

  const isPlaceholder = activeProfile.imageUrl.startsWith('data:image/svg+xml');
  const rels: RelSet = {
    parents: profiles.filter(p => activeProfile.parentIds.includes(p.id)),
    spouses: profiles.filter(p => activeProfile.spouseIds.includes(p.id)),
    children: profiles.filter(p => activeProfile.childIds.includes(p.id))
  };

  const timeline = [...(activeProfile.timeline || [])].sort((a, b) => {
    const da = a.date || '';
    const db = b.date || '';
    return da.localeCompare(db);
  });

  // Flatten all media from timeline events for the gallery section
  const media = timeline.flatMap(ev => ev.media || []) as MediaItem[];

  return (
    <div className="flex flex-col h-full bg-[#f9f8f6]">
      <header className="pt-16 px-8 pb-4 bg-[#f5f2eb] flex justify-between items-center">
        <button onClick={onBack} className="text-stone-400 flex items-center space-x-2">
          <ChevronLeft size={18} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Archive</span>
        </button>
        <div className="flex items-center space-x-2">
          <button onClick={onEdit} className="p-2 rounded-full bg-white border border-stone-200 text-stone-400">
            <PenTool size={16} />
          </button>
          <button onClick={onDeleteProfile} className="p-2 rounded-full bg-white border border-stone-200 text-stone-400">
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 pb-10">
        <div className="pt-6 pb-8 flex items-start space-x-6">
          <div className="relative">
            <img src={activeProfile.imageUrl || getPlaceholderImage(activeProfile.id)} className="w-28 h-28 rounded-[34px] object-cover grayscale border border-stone-100 shadow-sm" />
            <button
              onClick={onUploadMediaClick}
              className="absolute -bottom-2 -right-2 p-2 rounded-full bg-stone-900 text-white shadow"
              aria-label="Add media"
            >
              <Camera size={16} />
            </button>
            <input ref={mediaInputRef} type="file" onChange={onMediaFileChange} accept="image/*,video/*" className="hidden" />
          </div>

          <div className="flex-1">
            <h2 className="text-4xl font-serif text-slate-900 leading-tight">{activeProfile.name}</h2>
            <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-stone-400">
              {activeProfile.birthYear} — {activeProfile.deathYear || '...'}
            </div>
            {activeProfile.summary && (
              <p className="mt-4 text-sm text-stone-600 leading-relaxed">{activeProfile.summary}</p>
            )}
          </div>
        </div>

        <section className="space-y-3 mb-10">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">AI Studio</h3>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <button
              onClick={onGenerateSummary}
              disabled={isAiLoading}
              className="bg-white p-4 rounded-[32px] border border-stone-50 shadow-sm text-left hover:shadow-md transition-all disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <Sparkles className="text-amber-600" size={18} />
                <div className="font-black uppercase text-[10px] tracking-widest text-stone-500">
                  {isAiLoading ? 'Generating...' : 'Generate Summary'}
                </div>
              </div>
              <div className="mt-2 text-sm text-stone-600">Short biography from the profile and timeline.</div>
            </button>

            <button
              onClick={onResearch}
              disabled={isResearchLoading}
              className="bg-white p-4 rounded-[32px] border border-stone-50 shadow-sm text-left hover:shadow-md transition-all disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <Library className="text-amber-600" size={18} />
                <div className="font-black uppercase text-[10px] tracking-widest text-stone-500">
                  {isResearchLoading ? 'Researching...' : 'Historical Context'}
                </div>
              </div>
              <div className="mt-2 text-sm text-stone-600">Add period context based on time and places.</div>
            </button>

            <button
              onClick={onGeneratePortrait}
              disabled={isGeneratingPortrait || isPhotoLoading}
              className="bg-white p-4 rounded-[32px] border border-stone-50 shadow-sm text-left hover:shadow-md transition-all disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <ImageIcon className="text-amber-600" size={18} />
                <div className="font-black uppercase text-[10px] tracking-widest text-stone-500">
                  {(isGeneratingPortrait || isPhotoLoading) ? 'Generating...' : 'Portrait'}
                </div>
              </div>
              <div className="mt-2 text-sm text-stone-600">Generate a respectful AI portrait concept.</div>
            </button>
          </div>
        </section>

        <section className="space-y-3 mb-10">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Relationships</h3>
            <div className="flex items-center space-x-2">
              <button onClick={() => onLinkRelative('parent')} className="text-[10px] font-bold uppercase text-amber-700 flex items-center space-x-1">
                <UserPlus size={14} /><span>Parent</span>
              </button>
              <button onClick={() => onLinkRelative('spouse')} className="text-[10px] font-bold uppercase text-amber-700 flex items-center space-x-1">
                <UserPlus size={14} /><span>Spouse</span>
              </button>
              <button onClick={() => onLinkRelative('child')} className="text-[10px] font-bold uppercase text-amber-700 flex items-center space-x-1">
                <UserPlus size={14} /><span>Child</span>
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[{ label: 'Parents', list: rels.parents }, { label: 'Spouses', list: rels.spouses }, { label: 'Children', list: rels.children }].map(group => (
              <div key={group.label} className="bg-white p-5 rounded-[32px] border border-stone-50 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-stone-400">{group.label}</div>
                <div className="mt-3 space-y-2">
                  {group.list.length === 0 ? (
                    <div className="text-sm text-stone-400 italic">None listed</div>
                  ) : group.list.map(p => (
                    <button key={p.id} onClick={() => onSetActiveProfile(p.id)} className="w-full flex items-center space-x-3 p-2 rounded-2xl hover:bg-stone-50 transition-all">
                      <img src={p.imageUrl} className="w-10 h-10 rounded-2xl object-cover grayscale" />
                      <div className="text-left flex-1">
                        <div className="font-serif text-lg">{p.name}</div>
                        <div className="text-[10px] text-stone-400 font-black uppercase">{p.birthYear} — {p.deathYear || '...'}</div>
                      </div>
                      <ChevronRight className="text-stone-200" size={16} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3 mb-10">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Timeline</h3>
          </div>

          <div className="space-y-3">
            {timeline.length === 0 ? (
              <div className="bg-white p-6 rounded-[32px] border border-stone-50 shadow-sm text-stone-400 italic">No life events yet.</div>
            ) : timeline.map(ev => {
              const Icon = getEventIcon(ev.type);
              return (
                <div key={ev.id} className="bg-white p-5 rounded-[32px] border border-stone-50 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center">
                      <Icon size={18} className="text-stone-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-serif text-xl text-slate-900">{formatEventSentence(ev, activeProfile.name)}</div>
                      <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-stone-400">
                        {ev.date ? formatFullDate(ev.date) : 'Date unknown'} {ev.place ? `• ${ev.place}` : ''}
                      </div>
                      {ev.notes && <div className="mt-2 text-sm text-stone-600">{ev.notes}</div>}
                      {ev.media?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {ev.media.map(m => (
                            <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-2 px-3 py-2 rounded-full bg-stone-50 border border-stone-100">
                              <ExternalLink size={14} className="text-stone-400" />
                              <span className="text-[11px] font-bold text-stone-600">{m.name || m.kind}</span>
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <button
                      onClick={() => setAttachingToEventId(attachingToEventId === ev.id ? null : ev.id)}
                      className="text-[10px] font-bold uppercase text-amber-700"
                    >
                      {attachingToEventId === ev.id ? 'Cancel' : 'Attach'}
                    </button>
                  </div>

                  {attachingToEventId === ev.id && (
                    <div className="mt-4 border-t pt-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Select media to attach</div>
                      <div className="grid gap-2 md:grid-cols-3">
                        {media.map(m => (
                          <button
                            key={m.id}
                            onClick={() => props.showToast('Attach flow handled in App.tsx')}
                            className="bg-stone-50 border border-stone-100 p-3 rounded-2xl text-left hover:bg-stone-100"
                          >
                            <div className="text-[11px] font-bold text-stone-700">{m.name || m.kind}</div>
                            <div className="text-[10px] text-stone-400">{m.kind}</div>
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 text-[10px] text-stone-400">Note: media attach action is wired in App.tsx.</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3 mb-10">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Media</h3>
          </div>

          {media.length === 0 ? (
            <div className="bg-white p-6 rounded-[32px] border border-stone-50 shadow-sm text-stone-400 italic">No media yet.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {media.map(m => (
                <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="bg-white p-4 rounded-[32px] border border-stone-50 shadow-sm hover:shadow-md transition-all">
                  <div className="text-[10px] font-black uppercase tracking-widest text-stone-400">{m.kind}</div>
                  <div className="mt-2 font-serif text-xl text-slate-900">{m.name || 'Untitled'}</div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ProfileView;
