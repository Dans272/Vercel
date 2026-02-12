import { useState } from 'react';
import { AppView, MediaItem, Profile } from '../types';
import { compressImage } from '../utils/media';
import { inferMediaKind } from '../utils/formatters';

export const useMediaAttach = (args: {
  activeProfileId: string | null;
  view: AppView;
  attachingToEventId: string | null;
  setAttachingToEventId: (id: string | null) => void;
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
  setEditImageUrl: (v: string) => void;
  toast: (m: string) => void;
}) => {
  const { activeProfileId, view, attachingToEventId, setAttachingToEventId, setProfiles, setEditImageUrl, toast } = args;
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProfileId) return;
    setIsPhotoLoading(true);
    try {
      const base64 = await compressImage(file);
      if (view === AppView.EDIT_PROFILE) setEditImageUrl(base64);
      else setProfiles((prev) => prev.map((p) => (p.id === activeProfileId ? { ...p, imageUrl: base64 } : p)));
      toast('Photo updated');
    } catch (err) {
      console.error(err);
      toast('Error processing photo');
    } finally {
      setIsPhotoLoading(false);
      e.target.value = '';
    }
  };

  const handleLifecycleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeProfileId || !attachingToEventId) return;
    toast('Processing...');
    try {
      const newMediaItems: MediaItem[] = await Promise.all(
        Array.from(files).map(async (file: File) => {
          const kind = inferMediaKind(file.name, file.type);
          let url = '';
          if (kind === 'photo') url = await compressImage(file);
          else {
            const reader = new FileReader();
            url = await new Promise((resolve) => {
              reader.onload = (ev) => resolve(ev.target?.result as string);
              reader.readAsDataURL(file);
            });
          }
          return { id: `m-${Date.now()}-${Math.random()}`, name: file.name, kind, url, createdAt: new Date().toISOString() };
        })
      );

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === activeProfileId
            ? {
                ...p,
                timeline: (p.timeline || []).map((ev: any) =>
                  ev.id === attachingToEventId ? { ...ev, media: [...(ev.media || []), ...newMediaItems] } : ev
                )
              }
            : p
        )
      );
      toast(`Attached ${newMediaItems.length} files`);
    } catch (err) {
      console.error(err);
      toast('Upload error');
    } finally {
      setAttachingToEventId(null);
      e.target.value = '';
    }
  };

  return { isPhotoLoading, handleProfilePhotoUpload, handleLifecycleFileUpload };
};
