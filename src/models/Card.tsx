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
  text: string;
  subtypes: string[];
  fluff: string;
  subtitle: string;
  img: string;
  imgUrl: string;
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
  'recurring-credit': ['[recurring]'],
  'interrupt': ['[interrupt]'],
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
  const faction = card.faction === 'haas' ? 'HB' : capitalizeFirst(card.faction ?? '', 3);
  const suffix = faction === 'Neutral' ? `-${side}` : '';
  if (!side || !kind || !faction) return '';
  return `./UI/${side}${kind}Default${faction}${suffix}.png`;
}

const { location } = document;
export const defaultImage = location.origin + location.pathname + 'img/jhow2.jpg';

export const createCardStore = (attributes?: Partial<Card>) => {
  const defaultAttributes: Card = {
    side: 'corp',
    faction: 'haas',
    kind: 'ice',
    unique: true,
    name: 'Howard 1.0',
    subtitle: '',
    strength: '4',
    price: '2',
    trash: '',
    influence: 1,
    mu: 1,
    minDeckSize: 45,
    subtypes: ['bioroid', 'code_gate'],
    text: [
      '<b>Lose [click]:</b> Break 1 subroutine. Only the Runner may use this ability.',
      '',
      '[subroutine] The Corp may draw 1 card.',
      '[subroutine] The Corp may draw 1 card.',
      '[subroutine] Shuffle up to one card from HQ or Archives into R&D for every card the Corp has drawn this turn.',
      '',
      '[cardname] uses 0 influence if included in an NBN deck.',
    ].join('\n'),
    fluff: '',
    img: '',
    imgUrl: defaultImage,
    x: 65,
    y: 275,
    scale: 0.74
  }

  const card = createMutable<Card>({ ...defaultAttributes, ...attributes });

  return card;
};