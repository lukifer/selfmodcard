import { createEffect, createMemo, Show } from "solid-js";

import { SelectAttribute } from "../components/SelectAttribute";
import { SubtypesAttribute } from "../components/SubtypesAttribute";
import { NumberAttribute } from '../components/NumberAttribute';
import { TextAttribute } from "../components/TextAttribute";
import { loadImageAsDataUri } from '../App';
import { capitalizeFirst, subtypeKey } from '../utils';

// import onrjson from '../onr.json'

import {
  Card,
  corpFactions,
  corpKinds,
  defaultImage,
  runnerFactions,
  runnerKinds,
  strengthMeaning,

  Side,
  Faction,
} from "../models/Card"

export const hasStrength = (card: Card) => {
  if (card.kind === 'identity' && card.side !== 'runner')
    return false;
  return !!strengthMeaning[card.kind];
};

export const hasInfluence = (card: Card) => {
  return card.kind !== 'identity' && (card.kind !== 'agenda' || card.faction === 'neutral');
};

export const hasMU = (card: Card) => card.kind === "program";

export const hasTrash = (card: Card) => ['asset', 'upgrade', 'operation', 'ice'].includes(card.kind);

function opts<T extends readonly string[]>(vals: T) {
  return vals.reduce((acc, v) => ({
    ...acc,
    [v]: capitalizeFirst(v ?? '', 3),
  }), {} as { [K in T[number]]: string })
}

const helpTooltip = <>
  <dl>
    <dt><i class="icon icon-click"></i></dt><dd>[click]</dd>
    <dt><i class="icon icon-credit"></i></dt><dd>[credit]</dd>
    <dt><i class="icon icon-subroutine"></i></dt><dd>[sub]<br />--&gt;</dd>
    <dt><i class="icon icon-recurring-credit"></i></dt><dd>[recurring]</dd>
    <dt><i class="icon icon-trash"></i></dt><dd>[trash]</dd>
    <dt><i class="icon icon-link"></i></dt><dd>[link]</dd>
    <dt><i class="icon icon-mu"></i></dt><dd>[mu]</dd>
    <dt><i class="icon icon-1mu"></i></dt><dd>[1mu]</dd>
    <dt><i class="icon icon-2mu"></i></dt><dd>[2mu]</dd>
    <dt><i class="icon icon-interrupt"></i></dt><dd>[interrupt]</dd>
  </dl>
</>

export const AttributesView = (props: { card: Card }) => {
  const { card } = props;

  const imageReady = (ev: Event) => {
    const selectedFile = (ev.target as HTMLInputElement).files![0];
    const reader = new FileReader();
    
    reader.onload = () => {
      card.img = reader.result.toString();
    };
    reader.readAsDataURL(selectedFile);
  };

  const imageUrlReady = (ev: Event) => {
    card.imgUrl = (ev.target as HTMLInputElement).value;
    if (/^http/.test(card.imgUrl)) {
      loadImageAsDataUri(card.imgUrl, (dataUri: string) => {
        card.img = dataUri;
      })
    }
  }

  const factionOpts = createMemo(() => card.side === 'runner' ? opts(runnerFactions) : opts(corpFactions));
  const kindOpts = createMemo(() => card.side === 'runner' ? opts(runnerKinds) : opts(corpKinds));
  const strengthLabel = createMemo<string>(() => strengthMeaning[card.kind]);

  let lastCardName = '';
  // createEffect(() => {
  //   if (onrjson[card.name] && card.name !== lastCardName) {
  //     lastCardName = card.name;
  //     const o = onrjson[card.name];
  //     card.text = o.Text;
  //     card.side = `${o.Side}`.toLowerCase() as Side;
  //     if (o.Faction) switch (o.Faction) {
  //       case 'HB': card.faction = 'haas'; break;
  //       default: card.faction = `${o.Faction}`.toLowerCase() as Faction;
  //     }
  //     switch (o.Type) {
  //       case 'U': card.kind = 'upgrade'; break;
  //       case 'A': card.kind = 'agenda'; break;
  //       case 'R': card.kind = 'resource'; break;
  //       case 'M': card.kind = 'program'; break;
  //       case 'H': card.kind = 'hardware'; break;
  //       case 'N': card.kind = 'asset'; break;
  //       case 'I': card.kind = 'ice'; break;
  //       case 'O': card.kind = 'operation'; break;
  //       case 'P': card.kind = 'event'; break;
  //     }
  //     card.influence = parseInt(o.Inf) ?? 0;
  //     card.subtypes = o['Subtypes (NSG)'] ? `${o['Subtypes (NSG)']}`.split(',').map(subtypeKey) : [];
  //     if (o.Art) {
  //       card.imgUrl = o.Art.replace('https', 'http').replace('2332', '2323');
  //       if (card.imgUrl && /^http/.test(card.imgUrl)) {
  //         loadImageAsDataUri(card.imgUrl, (dataUri: string) => {
  //           card.img = dataUri;
  //         })
  //       }
  //     }
  //     card.fluff = o.Flavor ?? '';
  //     if (o['$']) card.price = o['$'];
  //   }
  // })

  return (
    <div class="attributes">
      
      <TextAttribute
        attribute="name"
        label="Name"
        card={card}
        fullWidth
      ></TextAttribute>

      <Show when={card.kind !== 'identity'}>
        <div class="form-group checkbox">
          <div class="col-sm-3" />
          <div class="col-sm-9">
            <label>
              <input type="checkbox" name="unique" value="unique" checked={card.unique} onChange={() => card.unique = !card.unique} />
              Unique
            </label>
          </div>
        </div>
      </Show>
      
      <SelectAttribute
        attribute="side"
        label="Side"
        card={card}
        options={() => opts(['corp', 'runner'])}
      ></SelectAttribute>

      <SelectAttribute
        attribute="faction"
        label="Faction"
        card={card}
        options={factionOpts}
      ></SelectAttribute>

      <SelectAttribute
        attribute="kind"
        label="Type"
        card={card}
        options={kindOpts}
      ></SelectAttribute>

      <Show when={card.kind === 'identity'}>
        <TextAttribute
          attribute="subtitle"
          label="Subtitle"
          card={card}
        ></TextAttribute>

        <NumberAttribute
          attribute="minDeckSize"
          card={card}
          label={() => 'Minimum Deck Size'}
          min={0}
        />

        <NumberAttribute
          attribute="influence"
          card={card}
          label={() => 'Influence'}
          min={0}
        />
      </Show>

      <SubtypesAttribute card={card} />

      <NumberAttribute
        attribute="price"
        card={card}
        label={() => 'Cost'}
        min={0}
        placeholder="X"
      />

      <Show when={hasInfluence(card)}>
        <NumberAttribute
          attribute="influence"
          card={card}
          label={() => 'Influence'}
          placeholder="No Influence Cost"
          min={0}
          max={5}
        />
      </Show>

      <Show when={hasMU(card)}>
        <NumberAttribute
          attribute="mu"
          label={() => 'MU'}
          card={card}
          min={0}
        />
      </Show>

      <Show when={hasStrength(card)}>
        <NumberAttribute
          attribute="strength"
          card={card}
          label={strengthLabel}
          placeholder="-"
        ></NumberAttribute>
      </Show>

      <Show when={hasTrash(card)}>
        <NumberAttribute
          attribute="trash"
          card={card}
          label={() => 'Trash Cost'}
          placeholder="Not Trashable"
          min={0}
        ></NumberAttribute>
      </Show>

      <TextAttribute
        textarea
        attribute="text"
        rows={5}
        card={card}
        info={helpTooltip}
      ></TextAttribute>

      <TextAttribute
        textarea
        attribute="fluff"
        card={card}
      ></TextAttribute>

      <div class="form-group">
        <label for="text" class="col-sm-3 control-label">Image:</label>
        <div class="col-sm-9">
          <input
            id="image_url"
            placeholder="Image URL"
            class='form-control'
            value={card.imgUrl === defaultImage ? '' : card.imgUrl}
            onChange={imageUrlReady}
          />
          <div>- or -</div>
          <input type="file" id="image" class='form-control' onChange={imageReady} />
        </div>
      </div>

      {/* <div>
        {null && JSON.stringify(card)}
      </div> */}
    </div>
  );
};