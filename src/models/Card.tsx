import { createMutable } from 'solid-js/store';

import { capitalizeFirst } from '../utils';
// import { createHistoryStore } from './models/HistoryStore';

export const CARD_LOCAL_STORAGE_KEY = 'card';

export const corpFactions = ['neutral', 'haas', 'jinteki', 'nbn', 'weyland'] as const;
export const runnerFactions = ['neutral', 'anarch', 'criminal', 'shaper'] as const;
export const corpKinds = ['agenda', 'asset', 'ice', 'identity', 'operation', 'upgrade'] as const;
export const runnerKinds = ['event', 'hardware', 'identity', 'program', 'resource'] as const;

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
  fontSize: number | 'auto';
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

export function blankCard(card: Card) {
  const blank = {
    side: 'corp',
    faction: 'neutral',
    kind: 'agenda',
    unique: false,
    name: '',
    subtitle: '',
    strength: '0',
    price: '0',
    trash: '',
    influence: 1,
    mu: 1,
    minDeckSize: 45,
    subtypes: [],
    text: '',
    fluff: '',
    img: '',
    imgUrl: '',
    x: 0,
    y: 0,
    scale: 1.0,
    fontSize: 'auto'
  }
  Object.keys(blank).forEach((k) => {
    card[k] = blank[k];
  });
}

const { location } = document;
export const defaultImage = location.origin + location.pathname + 'img/jhow2.jpg';

export const createCardStore = (attributes: Partial<Card>, onChange: () => void) => {
  const defaultCardAttributes: Card = {
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
    subtypes: ['Bioroid', 'Code Gate'],
    text: [
      '**Lose [click]**: Break 1 subroutine. Only the Runner may use this ability.',
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
    scale: 0.74,
    fontSize: 'auto'
  }

  const card = createMutable<Card>({ ...defaultCardAttributes, ...attributes });

  // Wrap the store to persist changes to localStorage
  return new Proxy(card, {
    set(updatedCard, prop, value) {
      updatedCard[prop] = value;
      let saveTarget: Partial<Card> = updatedCard;
      // We don't save images over 4MB
      if (updatedCard.img.length > 4 * 1024 * 1024) {
        const { img, ...rest } = updatedCard;
        saveTarget = rest;
      }
      localStorage.setItem(CARD_LOCAL_STORAGE_KEY, JSON.stringify(saveTarget));
      // localStorage.setItem(CARD_LOCAL_STORAGE_KEY, JSON.stringify(saveTarget).replace('http://hack', 'https://hack').replace('2323', '2332'));
      onChange();
      return true;
    }
  });
};