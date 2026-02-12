
import { Profile, FamilyTree, LifeEvent } from '../types';
import { getPlaceholderImage } from '../constants';

const tagToLabel: Record<string, string> = {
  BIRT: 'Birth',
  DEAT: 'Death',
  BURI: 'Burial',
  RESI: 'Residence',
  EMIG: 'Departure/Emigration',
  IMMI: 'Arrival/Immigration',
  CENS: 'Census',
  MARR: 'Marriage',
  GRAD: 'Graduation',
  BARM: 'Bar Mitzvah',
  BATM: 'Bat Mitzvah',
  CONF: 'Confirmation',
  EVEN: 'Event'
};

export const parseGedcom = (text: string, userId: string, maxGenerations = 4): { importedProfiles: Profile[], tree: FamilyTree } => {
  const importStamp = Date.now().toString();
  const indis = new Map<string, any>();
  const fams = new Map<string, any>();
  let currentIndi: any = null;
  let currentFam: any = null;
  let currentEvent: any = null;
  let homeGedId: string | null = null;

  text.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) return;
    const level = parts[0];
    const tagOrXref = parts[1];
    const rest = parts.slice(2).join(' ');

    if (level === '0') {
      currentEvent = null;
      if (rest === 'INDI') {
        const gid = tagOrXref;
        if (!homeGedId) homeGedId = gid;
        currentIndi = { 
          gedId: gid, 
          name: 'Unknown', 
          gender: 'U',
          timeline: [], 
          birthYear: 'Unknown', 
          deathYear: undefined,
          famc: null,
          fams: []
        };
        indis.set(gid, currentIndi);
        currentFam = null;
      } else if (rest === 'FAM') {
        currentFam = { gedId: tagOrXref, husb: '', wife: '', chil: [], date: '', place: '' };
        fams.set(tagOrXref, currentFam);
        currentIndi = null;
      } else {
        currentIndi = null;
        currentFam = null;
      }
    } else if (currentIndi) {
      if (level === '1') {
        if (tagOrXref === 'NAME') {
          currentIndi.name = rest.replace(/\//g, '').trim();
        } else if (tagOrXref === 'SEX') {
          currentIndi.gender = rest.trim().toUpperCase() === 'M' ? 'M' : (rest.trim().toUpperCase() === 'F' ? 'F' : 'U');
        } else if (tagOrXref === 'FAMC') {
          currentIndi.famc = rest.replace(/@/g, '');
        } else if (tagOrXref === 'FAMS') {
          currentIndi.fams.push(rest.replace(/@/g, ''));
        } else if (tagToLabel[tagOrXref]) {
          currentEvent = { 
            id: `ev-${importStamp}-${Math.random().toString(36).substr(2, 9)}`,
            type: tagToLabel[tagOrXref], 
            date: '', 
            place: '', 
            media: [] 
          };
          currentIndi.timeline.push(currentEvent);
        }
      } else if (level === '2' && currentEvent) {
        if (tagOrXref === 'DATE') {
          currentEvent.date = rest;
          const yearMatch = rest.match(/\b\d{4}\b/);
          if (yearMatch) {
            if (currentEvent.type === 'Birth') currentIndi.birthYear = yearMatch[0];
            if (currentEvent.type === 'Death') currentIndi.deathYear = yearMatch[0];
          }
        } else if (tagOrXref === 'PLAC') {
          currentEvent.place = rest;
        }
      }
    } else if (currentFam) {
      if (level === '1') {
        if (tagOrXref === 'HUSB') currentFam.husb = rest.replace(/@/g, '');
        if (tagOrXref === 'WIFE') currentFam.wife = rest.replace(/@/g, '');
        if (tagOrXref === 'CHIL') currentFam.chil.push(rest.replace(/@/g, ''));
        if (tagOrXref === 'MARR') currentEvent = { type: 'MARR' };
      } else if (level === '2' && currentEvent) {
        if (tagOrXref === 'DATE') currentFam.date = rest;
        if (tagOrXref === 'PLAC') currentFam.place = rest;
      }
    }
  });

  const calculateGenerations = () => {
    const generations = new Map<string, number>();
    const visited = new Set<string>();
    
    const traverse = (gedId: string, gen: number) => {
      if (visited.has(gedId) || !indis.has(gedId)) return;
      visited.add(gedId);
      generations.set(gedId, gen);
      
      const indi = indis.get(gedId);
      if (indi.famc) {
        const fam = fams.get('@' + indi.famc + '@');
        if (fam) {
          if (fam.husb) traverse('@' + fam.husb + '@', gen + 1);
          if (fam.wife) traverse('@' + fam.wife + '@', gen + 1);
        }
      }
      
      indi.fams.forEach((famId: string) => {
        const fam = fams.get('@' + famId + '@');
        if (fam) {
          fam.chil.forEach((childId: string) => {
            traverse('@' + childId + '@', gen - 1);
          });
        }
      });
    };
    
    if (homeGedId) traverse(homeGedId, 0);
    return generations;
  };

  const generations = calculateGenerations();
  const profileIdFor: Record<string, string> = {};
  
  const filteredIndis: any[] = [];
  indis.forEach((indi, gedId) => {
    const gen = generations.get(gedId);
    if (gen !== undefined && Math.abs(gen) <= maxGenerations) {
      profileIdFor[gedId] = `imp-${importStamp}-${gedId.replace(/@/g, '')}`;
      filteredIndis.push(indi);
    }
  });

  const importedProfiles: Profile[] = filteredIndis.map(indi => ({
    id: profileIdFor[indi.gedId],
    userId,
    name: indi.name,
    gender: indi.gender,
    birthYear: indi.birthYear,
    deathYear: indi.deathYear,
    imageUrl: getPlaceholderImage(indi.gender),
    summary: `Archival record for ${indi.name}.`,
    isMemorial: true,
    timeline: indi.timeline,
    memories: [],
    sources: [],
    parentIds: [],
    childIds: [],
    spouseIds: []
  }));

  // Link relationships using the family records
  fams.forEach(fam => {
    const husb = importedProfiles.find(p => p.id === profileIdFor[`@${fam.husb}@`]);
    const wife = importedProfiles.find(p => p.id === profileIdFor[`@${fam.wife}@`]);
    const children = fam.chil.map((c: string) => importedProfiles.find(p => p.id === profileIdFor[`@${c}@`])).filter(Boolean);
    
    // Spouses
    if (husb && wife) {
      if (!husb.spouseIds.includes(wife.id)) husb.spouseIds.push(wife.id);
      if (!wife.spouseIds.includes(husb.id)) wife.spouseIds.push(husb.id);
    }

    // Parents and Children
    children.forEach((child: Profile) => {
      if (husb) {
        if (!child.parentIds.includes(husb.id)) child.parentIds.push(husb.id);
        if (!husb.childIds.includes(child.id)) husb.childIds.push(child.id);
      }
      if (wife) {
        if (!child.parentIds.includes(wife.id)) child.parentIds.push(wife.id);
        if (!wife.childIds.includes(child.id)) wife.childIds.push(child.id);
      }
    });

    // Reconcile marriage events
    const reconcileMarriage = (person: Profile | undefined, spouse: Profile | undefined) => {
      if (!person) return;
      const existing = person.timeline.find(e => 
        e.type === 'Marriage' && (e.date === fam.date || (!e.date && !fam.date))
      );
      if (existing) {
        existing.spouseName = spouse?.name || 'Unknown';
        if (fam.place) existing.place = fam.place;
      } else {
        person.timeline.push({
          id: `ev-fam-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'Marriage',
          date: fam.date,
          place: fam.place,
          spouseName: spouse?.name || 'Unknown',
          media: []
        });
      }
    };
    
    reconcileMarriage(husb, wife);
    reconcileMarriage(wife, husb);
  });

  const newTree: FamilyTree = {
    id: `tree-${importStamp}`,
    userId,
    name: 'Staged Import Tree',
    createdAt: new Date().toISOString(),
    homePersonId: homeGedId ? (profileIdFor[homeGedId] || '') : '',
    memberIds: importedProfiles.map(p => p.id),
  };

  return { importedProfiles, tree: newTree };
};
