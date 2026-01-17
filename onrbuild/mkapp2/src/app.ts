export interface State<T> {
  val: T
  readonly oldVal: T
  readonly rawVal: T
}

export type StateView<T> = Readonly<State<T>>
export type Val<T> = State<T> | T
export type Primitive = string | number | boolean | bigint
export type PropValue = Primitive | ((e: any) => void) | null
export type PropValueOrDerived = PropValue | StateView<PropValue> | (() => PropValue)
export type Props = Record<string, PropValueOrDerived> & { class?: PropValueOrDerived; is?: string }
export type PropsWithKnownKeys<ElementType> = Partial<{[K in keyof ElementType]: PropValueOrDerived}>
export type ValidChildDomValue = Primitive | Node | null | undefined
export type BindingFunc = ((dom?: Node) => ValidChildDomValue) | ((dom?: Element) => Element)
export type ChildDom = ValidChildDomValue | StateView<Primitive | null | undefined> | BindingFunc | readonly ChildDom[]
export type TagFunc<Result> = (first?: Props & PropsWithKnownKeys<Result> | ChildDom, ...rest: readonly ChildDom[]) => Result

type Tags = Readonly<Record<string, TagFunc<Element>>> & {
  [K in keyof HTMLElementTagNameMap]: TagFunc<HTMLElementTagNameMap[K]>
}
declare function state<T>(): State<T>
declare function state<T>(initVal: T): State<T>

export interface Van {
  readonly state: typeof state
  readonly derive: <T>(f: () => T) => State<T>
  readonly add: (dom: Element | DocumentFragment, ...children: readonly ChildDom[]) => Element
  readonly tags: Tags & ((namespaceURI: string) => Readonly<Record<string, TagFunc<Element>>>)
  readonly hydrate: <T extends Node>(dom: T, f: (dom: T) => T | null | undefined) => T
}

export type Signal<T> = { val: T };
export const vstate = <T>(van: any, initial: T) => van.state(initial) as Signal<T>;

export type ZoomSelector = string | HTMLElement | HTMLElement[] | NodeList

export interface ZoomOptions {
  margin?: number
  background?: string
  scrollOffset?: number
  container?: string | HTMLElement | ZoomContainer
  template?: string | HTMLTemplateElement
}

export interface ZoomContainer {
  width?: number
  height?: number
  top?: number
  bottom?: number
  right?: number
  left?: number
}

export interface ZoomOpenOptions { target?: HTMLElement }

export interface Zoom {
  open(options?: ZoomOpenOptions): Promise<Zoom>
  openModal(element: HTMLElement): Promise<Zoom>
  close(): Promise<Zoom>
  toggle(options?: ZoomOpenOptions): Promise<Zoom>
  attach(...selectors: ZoomSelector[]): Zoom
  detach(...selectors: ZoomSelector[]): Zoom
  update(options: ZoomOptions): Zoom
  clone(options?: ZoomOptions): Zoom
  on(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): Zoom
  off(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): Zoom
  getOptions(): ZoomOptions
  getImages(): HTMLElement[]
  getZoomedImage(): HTMLElement
}
declare function mediumZoom(
  selector?: ZoomSelector,
  options?: ZoomOptions
): Zoom
declare function mediumZoom(options?: ZoomOptions): Zoom

type Card = {
  id: string;
  name: string;
  side: string;
  faction: string;
  kind: string;
  subtypes: string[];
  text: string;
  front: string;
  back: string;
};

const corpFactions   = ["corp", "corp-neutral", "haas", "nbn", "jinteki", "weyland"] as const;
const runnerFactions = ["runner", "runner-neutral", "anarch", "criminal", "shaper"] as const;
const corpKinds      = ['agenda', 'asset', 'ice', 'operation', 'upgrade'] as const;
const runnerKinds    = ['event', 'hardware', 'program', 'resource'] as const;

type Face          = "front" | "back" | "both";
type CorpFaction   = typeof corpFactions[number];
type RunnerFaction = typeof runnerFactions[number];
type Faction       = "" | CorpFaction | RunnerFaction;
type CorpKind      = typeof corpKinds[number];
type RunnerKind    = typeof runnerKinds[number];
type Kind          = "" | CorpKind | RunnerKind;

type SelectEvent = Event & { target: HTMLSelectElement };
type InputEvent  = Event & { target: HTMLInputElement };

const upperFirst = (s: string) => s.length < 4 ? s.toUpperCase() : s[0].toUpperCase() + s.slice(1);
const iconSize = 24;
const icon = { width: iconSize, height: iconSize }

let zoom: Zoom;

export async function bootstrap({ van }: { van: Van }) {

  const { div, input, select, option, optgroup, img, main, h1, h3, h5, h6, header, a, b, i, p, br, span, button, ul, li } = van.tags;

  function App(cards: Card[]) {

    // const face      = vstate<Face>(van, "both");
    const face      = vstate<Face>(van, "front");
    const faction   = vstate<Faction>(van, "");
    const kind      = vstate<Kind>(van, "");
    const query     = vstate<string>(van, "");
    
    const queryMatches = (c: Card) => {
      if (!query.val) return true;
      const q = query.val.toLowerCase();
      return (c.name.toLowerCase().includes(q) || c.text.toLowerCase().includes(q) || c.subtypes.some(s => s.toLowerCase().includes(q)));
    }
  
    const factionMatches = (c: Card) =>
      !faction.val || (["corp", "runner"].includes(faction.val)
        ? c.side === faction.val
        : (
          ['runner-neutral', 'corp-neutral'].includes(faction.val)
          ? `${c.side}-${c.faction}` === faction.val
          : c.faction === faction.val
        )
      );

    const kindMatches = (c: Card) => !kind.val || c.kind === kind.val;
    
    const kinds = van.derive(() => {
      if (faction.val === '') return [...corpKinds, ...runnerKinds];
      const isCorp = (corpFactions).includes(faction.val as CorpFaction);
      const filteredKinds = isCorp ? corpKinds : runnerKinds;
      if (kind.val && !(filteredKinds as Readonly<Kind[]>).includes(kind.val)) {
        kind.val = '';
      }
      return filteredKinds;
    });

    const onInvert = (e: Event & { target: HTMLAnchorElement }, c: Card) => {
      if (face.val === 'both')
        return openImgLightbox(e);

      e.preventDefault();
      e.stopPropagation();

      (e.target.parentNode?.parentNode as HTMLElement).classList.toggle("flip");
    }

    const openLightbox = (div?: HTMLElement) => {
      if (!div) return;

      zoom = mediumZoom({ background: 'rgba(0,0,0,.7)', margin: 24 });
      zoom.openModal(div);
    };

    const openImgLightbox = (e: Event & { target: HTMLAnchorElement | HTMLImageElement | HTMLButtonElement }) => {
      e.preventDefault();
      e.stopPropagation();

      const imgbox = (e.target as HTMLElement).tagName === "IMG"
        ? e.target.parentNode?.parentNode as HTMLElement
        : e.target.parentNode as HTMLElement;
      
      const sel = imgbox.classList.contains("flip") ? ".reverse" : "img:first-child";
      const img = imgbox.querySelector(sel) as HTMLElement;

      zoom = mediumZoom(img, { background: 'rgba(0,0,0,.7)', margin: 24 });
      zoom.on('closed', () => { zoom.detach(img); }, { once: true });
      zoom.open();
    };
    
    const filteredCards = van.derive(() =>
      cards
        .filter(factionMatches)
        .filter(kindMatches)
        .filter(queryMatches)
    );

    const onZoom = (e: Event & { target: HTMLInputElement }) => {
      document.documentElement.style.setProperty('--zoom', String(parseFloat(e.target.value || '1')));
    }
  
    const CardBox = (c: Card, face: Face, withBack?: boolean) => {
      const src = face === "front" ? c.front : c.back;
      const back = !withBack ? [] : [
        img({
          class: "cardimg reverse",
          loading: "lazy",
          src: face !== "front" ? c.front : c.back,
          alt: c.name
        })
      ];
      return div({ class: `imgbox` },
        a({
          href: src,
          onclick: e => onInvert(e, c)
        },
          img({
            class: "cardimg",
            loading: "lazy",
            src,
            alt: c.name
          }),
          ...back,
        ),
        button({
          class: 'mag',
          type: 'button',
          title: 'Fullscreen',
          'aria-label': 'Fullscreen',
          onclick: e => openImgLightbox(e),
        }, '🔍'),
      )};

    const CardView = (c: Card) =>
      div({ class: "card" },
        face.val === "both"
        ? div({ class: "pair" },
          CardBox(c, "front"),
          CardBox(c, "back")
        )
        : CardBox(c, face.val, true)
      );
    
    const onFaceChange    = (e: SelectEvent) => face.val    = e.target.value as Face;
    const onFactionChange = (e: SelectEvent) => faction.val = e.target.value as Faction;
    const onKindChange    = (e: SelectEvent) => kind.val    = e.target.value as Kind;
    const onFilterChange  = (e: InputEvent)  => query.val   = e.target.value;

    const changeZoom = (n: number) => {
      const el = document.getElementById("zoomrange") as HTMLInputElement;
      el.value = `${parseFloat(el.value) + n}`;
      el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    };
  
    const controls = header(
      div({ class: "bar" },
        div({ class: "left" },
          div(
            { class: "onrselect" },
            select({ onchange: onFaceChange },
              option({ value: "front", selected: face.val === "front" }, "Re:Factor 2096"),
              option({ value: "back",  selected: face.val === "back" }, "ONR 1996"),
              option({ value: "both",  selected: face.val === "both" }, "Re:Factor + ONR")
            ),
          ),
          div({ class: "zoomwrap" },
            button({ onclick: () => changeZoom(-0.05) }, '➖'),
            input({
              id: "zoomrange",
              type: "range",
              min: 0.5,
              max: 1.1,
              step: 0.05,
              value: 0.8,
              oninput: onZoom,
            }),
            button({ onclick: () => changeZoom(0.05) }, '➕'),
          ),
          a({
            class: "tooltip bottom bottom-download",
            href: "/assets/data/refactor2096.zip",
            download: true
          }, img({ ...icon, src: "/assets/images/download.svg", alt: "Download ZIP" })), // ⬇️ ⬇ 💾
          a({
            href: "javascript:void(0)",
            class: "tooltip bottom",
            onclick: (e) => openLightbox(document.getElementById('about-container') as HTMLElement)
          }, img({ ...icon, src: "/assets/images/question-circle.svg", alt: "What is this?" })),
          input({
            class: "mobile",
            value: query.val,
            placeholder: "Filter",
            oninput: onFilterChange
          }),
        ),
        div({ class: "right" },
          input({
            class: "desktop",
            value: query.val,
            placeholder: "Filter",
            oninput: onFilterChange
          }),
          select(
            { onchange: onFactionChange, value: faction.val },
            option({ value: '' }, 'All Factions'),
            ...[corpFactions, runnerFactions].map(factions => {
              return optgroup({ label: upperFirst(factions[0]) },
                ...factions.map((value, n) => option(
                  { value },
                  n === 0
                    ? `All ${upperFirst(factions[0])}`
                    : upperFirst(value.replace(`${factions[0]}-`, ''))
                  )
                )
              )
            })
          ),
          () => select(
            { onchange: onKindChange },
            option({ value: '', selected: kind.val === '' }, 'All Types'),
            kinds.val.map(value => option(
              { value, selected: kind.val === value },
              upperFirst(value)
            )),
          )
        )
      )
    );

    van.derive(() => {
      document.documentElement.style.setProperty('--col-w', face.val === 'both'
        ? 'calc(var(--card-w) * 2 + var(--pair-gap))'
        : 'var(--card-w)'
      );
    })

    const eml = (x: string) => x.replace(" at ", "@").replace(" dot ", ".");
    const mkemail = (x: string) => a({ href: `mailto:${eml(x)}` }, eml(x));

    return (
      div({ id: "app" },
        // div({ id: "head" },
        //   div({ id: "head-inner", class: "stretch" },
        //     h1("Re:Factor 2096"),
        //     a({ class: "download", href: "/assets/data/refactor2096.zip", download: true }, "⬇️ Download PNGs (66 MB)")
        //   ),
        // ),
        controls,
        main(
          () => div(
            { id: "grid", class: `grid ${face.val === 'both' ? 'paired' : ''}`, "aria-live": "polite" },
            filteredCards.val.map(CardView)
          )
        ),
        div({ id: "about-container", style: "display: none" },
          div({ class: "about" },
            div({ class: "about-inner" },
              h1("Re:Factor 2096"),
              h6("a labor of love by ", a({ href: "https://github.com/lukifer", target: "_blank" }, "lukifer")),
              h5("v0.99: Draft release: everything subject to change."),
              p(b("Re:Factor"), " reimagines Richard Garfield's original 1996 Netrunner CCG as a new set of ",
              () => span(`${cards.length}`),
              " cards for the 21st-century LCG, complete with factions and influence, and rules-compatible with cards from FFG or ",
              a({ href: "https://nullsignal.games/", target: "_blank" }, "Null Signal Games"), ". ",
              i("(No affiliation.)")),
              p("Card mechanics have been adapted as-is, without consideration for balance or power level (other than assigning influence). Were this a real set, many cards would likely be banned for competitive play."),
              p("Every card is self-contained, explaining any custom rules in its text (but see clarifications below)."),
              p({ class: "small" },
                "Card images generated with ",
                a({ href: "https://hack.themind.gg", target: "_blank" }, "Self-Modifying Card"),
                " using templates by ",
                a({ href: "https://www.reddit.com/r/Netrunner/comments/yuapf2/mnemics_custom_netrunner_cards_1024_custom_cards/", target: "_blank" }, "MNeMiC"),
                ". ONR card art adapted from ",
                a({ href: "https://www.reddit.com/r/Netrunner/comments/hu282l/original_netrunner_mpcformatted/", target: "_blank" }, "kj4860's"),
                " AI Upscales. Any copyrighted content is used under Fair Use. Published under ",
                a({ href: "https://creativecommons.org/publicdomain/zero/1.0/", target: "_blank" }, "Creative Commons Zero"), " and the ",
                a({ href: "https://researchenterprise.org/2013/12/06/the-woody-guthrie-public-license/", target: "_blank" }, "Woody Guthrie Public License"),
                " (the public domain)."
              ),
              h3("Fervently Unasked Questions"),
              ul(
                li(
                  b("Q: What new ONR rules do I need to know?"),
                  br(), "A: ", b("None!"),
                  " All mechanics and rules are printed onto cards (sometimes as reminder text). Other ONR rules differences (such as purging at any time by forfeiting future clicks) do not apply."
                ),
                li(b("Q: What's a Psi Trace?"),
                  br(), "A: In Original Netrunner, traces were blind bids, with \"Trace[X]\" setting a ", i("ceiling"), " of X on the trace, rather than a floor. ",
                  div({ class: "spacer" }, " "),
                  b("Re:Factor"), " has adapted this to a new mechanic, called a \"Psi Trace\". (For card effect purposes, a Psi Trace is considered both a trace and a psi game.)",
                  div({ class: "spacer" }, " "),
                  "The runner will need a ", b("Link"), " card in order to bid on a Psi Trace. If the Runner cannot or does not bid, their base link (printed on their identity, plus bonuses from installed cards) must still be overcome by the Corp. Note that for Psi Traces, unlike normal traces, the Corp wins ties."
                ),
                li(
                  b("Q: Can the Runner use Link card abilities during normal (non-psi) traces?"),
                  br(), "Yes. After the Corp has paid to set the trace, the Runner can use any Link card abilities, in addition to paying credits normally. Setting base link can be considered to overwrite the printed link on the Runner's identity; any passive link bonuses (such as ",
                  i("Cybertrooper Talut"), ") will continue to apply."
                ),
                li(
                  b("Q: Are Hidden resources considered to be resources while facedown?"),
                  br(), "Yes, and the Corp can trash them normally (such as when the runner is tagged). This is only the case when the runner has announced they are installing a face-down Hidden resource; if the same card is installed through a different card effect, such as Apex, it is still considered a blank generic card; however, that card can still be flipped face-up during a paid ability window, or per any custom timing rules printed on the card."
                ),
                li(
                  b("Q: What is the install cost of Hidden resources?"),
                  br(), "All resources with subtype Hidden have an install cost of 0, which must still be \"paid\". So for instance, ",
                  i("Scarcity of Resources"), " would require the Runner to pay 2 credits to install a Hidden resource face-down. However, this install cost is not paid when turning a Hidden resource face-up."
                ),
                li(
                  b("Q: Does the Runner win the game after acquiring 7 bad publicity?"),
                  br(), "Only if card text says so. In ONR, this was the only effect of BP; in ",
                  b("Re:Factor"), ", the text to win after acquiring 7 BP has been added to those specific cards."
                ),
                li(
                  b("Q: Why is $CARD in $FACTION?"),
                  br(), "This card pool simply wasn't designed around factions or \"color pie\". Some creative liberties were taken to ensure a roughly even spread of card types across all factions."
                ),
                li(
                  b("Q: Why is $SUBTYPE added / missing?"),
                  br(), "Some subtypes were added to maintain consistency (such as \"Observer\" to ICE which applies tags). Some subtypes were removed when they had no rules interactions (such as ",
                  i("Sword"), ")."
                ),
                li(
                  b("Q: I have questions / feedback / corrections / Opinions™️!"),
                  br(), "All feedback is extremely welcome, to ",
                  () => mkemail("refactor at themind dot gg"),
                  "! (I reserve the right to not accept every suggested change. 🙂)"
                ),
                li(
                  b("Q: Where can I get raw card data?"),
                  br(), "Card data is available as ", a({ href: "/assets/data/cards.json", download: true}, "JSON"),
                  ", though currently lacking numeric details like strength and cost (to be corrected soon)."
                ),
                li(
                  b("Q: Why would you do this?!"),
                  br(), "A: I don't understand the question."
                ),
              ),
              br(),
            )
          )
        ),
      )
    );
  }

  const cards = await (await fetch("/assets/data/cards.json")).json();

  van.add(
    document.body,
    App(cards)
  );
}
