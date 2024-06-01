import { createMemo, Show } from "solid-js";

import { SelectAttribute } from "../components/SelectAttribute";
import { SubtypesAttribute } from "../components/SubtypesAttribute";
import { NumberAttribute } from '../components/NumberAttribute';
import { capitalizeFirst } from '../utils';
import { TextAttribute } from "../components/TextAttribute";

import {
  Card,
  corpFactions,
  corpKinds,
  runnerFactions,
  runnerKinds,
  strengthMeaning,
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

// TODO
//   <p>You can add icons by using the following phrases</p>
// <dl class="dl-horizontal">
//   <dt><i class="icon icon-click"></i></dt><dd>[click]</dd>
//   <dt><i class="icon icon-credit"></i></dt><dd>[credit]</dd>
//   <dt><i class="icon icon-subroutine"></i></dt><dd>[sub] or --></dd>
//   <dt><i class="icon icon-recurring-credit"></i></dt><dd>[recurring]</dd>
//   <dt><i class="icon icon-trash"></i></dt><dd>[trash]</dd>
//   <dt><i class="icon icon-link"></i></dt><dd>[link]</dd>
//   <dt><i class="icon icon-mu"></i></dt><dd>[mu]</dd>
//   <dt><i class="icon icon-1mu"></i></dt><dd>[1mu]</dd>
//   <dt><i class="icon icon-2mu"></i></dt><dd>[2mu]</dd>
//   <dt><i class="icon icon-interrupt"></i></dt><dd>[interrupt]</dd>
// </dl>

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

  const factionOpts = createMemo(() => card.side === 'runner' ? opts(runnerFactions) : opts(corpFactions));
  const kindOpts = createMemo(() => card.side === 'runner' ? opts(runnerKinds) : opts(corpKinds));

  return (
    <div class="attributes">

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
      
      <TextAttribute
        attribute="name"
        label="Name"
        card={card}
      ></TextAttribute>

      <Show when={card.kind === 'identity'}>
        <TextAttribute
          attribute="subtitle"
          label="Subtitle"
          card={card}
        ></TextAttribute>

        <NumberAttribute
          attribute="minDeckSize"
          card={card}
          label="Minimum Deck Size"
          min={0}
        />

        <NumberAttribute
          attribute="influence"
          card={card}
          label="Influence"
          min={0}
        />
      </Show>

      <Show when={card.kind !== 'identity'}>
        <div class="form-group checkbox">
          <div class="col-sm-3" />
          <div class="col-sm-9">
            <label>
              <input type="checkbox" name="unique" value="unique" checked={card.unique} onChange={() => card.unique = !card.unique} />
              Is Unique
            </label>
          </div>
        </div>
      </Show>

      <SubtypesAttribute card={card} />

      <NumberAttribute
        attribute="price"
        card={card}
        label="Cost"
        min={0}
      />

      <Show when={hasInfluence(card)}>
        <NumberAttribute
          attribute="influence"
          card={card}
          label="Influence"
          min={0}
          max={5}
        />
      </Show>

      <Show when={hasMU(card)}>
        <NumberAttribute
          attribute="mu"
          card={card}
          min={0}
        />
      </Show>

      <Show when={hasStrength(card)}>
        <NumberAttribute
          attribute="strength"
          card={card}
          label={strengthMeaning[card.kind]}
        ></NumberAttribute>
      </Show>

      <Show when={hasTrash(card)}>
        <NumberAttribute
          attribute="trash"
          card={card}
          label="Trash Cost"
          min={0}
        ></NumberAttribute>
      </Show>

      <TextAttribute
        textarea
        attribute="text"
        rows={5}
        card={card}
        info="Lorem ipsum"
      ></TextAttribute>

      <TextAttribute
        textarea
        attribute="fluff"
        card={card}
      ></TextAttribute>

      {/* <div class="form-group">
        <label for="text" class="col-sm-3 control-label">Text: <i class="text-help glyphicon glyphicon-question-sign"></i></label>
        <div class="col-sm-9">
          <textarea id="text" class="form-control"/>
        </div>
      </div> */}

      <div class="form-group">
        <label for="text" class="col-sm-3 control-label">Image:</label>
        <div class="col-sm-9">
          <input type="file" id="image" class='form-control' onChange={imageReady} />
        </div>
      </div>

      <div>
        {null && JSON.stringify(card)}
      </div>
    </div>
  );
};