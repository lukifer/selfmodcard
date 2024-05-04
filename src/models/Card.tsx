import { createMutable } from 'solid-js/store';

import { capitalizeFirst } from '../utils';
// import { createHistoryStore } from './models/HistoryStore';

export const corpFactions = ['neutral', 'weyland', 'haas', 'jinteki', 'nbn'] as const;
export const runnerFactions = ['neutral', 'anarch', 'criminal', 'shaper'] as const;
export const corpKinds = ['agenda', 'asset', 'operation', 'upgrade', 'ice', 'identity'] as const;
export const runnerKinds = ['event', 'hardware', 'program', 'resource', 'identity'] as const;

export type Side = 'corp' | 'runner';
export type Faction = (typeof corpFactions)[number] | (typeof runnerFactions)[number];
export type CardKind = (typeof corpKinds)[number] | (typeof runnerKinds)[number];

export type Card = {
  side: Side;
  faction: Faction;
  kind: CardKind;
  unique: boolean;
  name: string;
  price: string; // TODO: numbers
  strength: string;
  trash: string;
  minDeckSize: number;
  influence: number;
  mu: number;
  type: string;
  text: string;
  subtypes: string[];
  fluff: string;
  subtitle: string;
  img: string;
  scale: number
  x: number;
  y: number;
};

export const icons = {
  credit: ['[credit]', '[cr]', '[c]'],
  click: ['[click]'],
  link: ['[link]'],
  trash: ['[trash]'],
  mu: ['[mu]'],
  '1mu': ['[1mu]'],
  '2mu': ['[2mu]'],
  subroutine: ['[subroutine]', '[sub]','--->','-->','->'],
  'recurring-credit': ['[recurring]']
}

export const strengthMeaning = {
  agenda: 'Agenda Points',
  ice: 'Strength',
  identity: 'Link',
  program: 'Strength',
};

export function isRunner(card: Card) {
  return card.side === 'runner';
}

export function isNeutralIdentity(card: Card) {
  return card.kind === 'identity' && card.faction === 'neutral';
}

export function hasInfluence (card: Card) {
  return card.kind !== 'identity' && 
    (card.kind !== 'agenda' || card.faction === 'neutral');
}

export function imageUri(card: Card) {
  const side = capitalizeFirst(card.side ?? '');
  const kind = card.kind === 'identity' ? `${side}ID` : capitalizeFirst(card.kind ?? '');
  const faction = capitalizeFirst(card.faction ?? '', 3);
  const suffix = faction === 'Neutral' ? `-${side}` : '';
  return `/UI/${side}${kind}Default${faction}${suffix}.png`;
}

export const createCardStore = (attributes?: Partial<Card>) => {
  const defaultAttributes: Card = {
    side: 'corp',
    faction: 'jinteki',
    kind: 'asset',
    unique: false,
    name: 'Mokujin',
    subtitle: '',
    strength: '',
    price: '0',
    trash: '2',
    influence: 2,
    mu: 1,
    minDeckSize: 45,
    type: 'ambush', // TODO: delete
    subtypes: ['ambush'],
    text: "If you pay 2 [c] when the Runner accesses Mokujin,the runner must take Mokujin.\nWhile the runner has Mokujin they can't run on central servers.\n[click] [click] [click]: Trash Mokujin",
    fluff: '"I was completely stumped" - Whizzard',
    img: '',
    x: 0,
    y: 0,
    // imgPosition: {
    //   x: 0,
    //   y: 0,
    //   scale: 1.0,
    // },
    scale: 1.0,
  };

  const card = createMutable<Card>({ ...defaultAttributes, ...attributes });

  return card;
};