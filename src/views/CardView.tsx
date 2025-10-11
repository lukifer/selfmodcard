import { Show, createSignal, createMemo } from 'solid-js';

import { Card, CardKind, icons, imageUri } from '../models/Card';
import { hasStrength, hasTrash } from './AttributesView';
import { FitText } from '../components/FitText';
import { miniMarkdown, paragraphize } from '../utils';

export const iconRegexes = Object.entries(icons).reduce((regexes, [icon, strs]: [string, string[]]) => {
  if (icon) regexes.push([icon, new RegExp(strs.map(s =>
    s.replace('[', '\\[').replace(']', '\\]')
  ).join('|'), 'g')]);
  return regexes;
}, [] as Array<[string, RegExp]>)

export function iconify(content: string, cardname: string) {
  return iconRegexes.reduce((content, [icon, regex]) => (
    content.replace(regex, `<i class='icon icon-${icon}'></i>`)
  ), content
    .replace(/ ->/g, ' &rarr;')
    .replace(/\[cardname\]/g, cardname)
  );
}

const zoomIntensity = 1.03;

export const CardView = (props: {
  card: Card
}) => {
  const { card } = props;
  const [lastX, setLastX] = createSignal(0);
  const [lastY, setLastY] = createSignal(0);
  const [cardStartX, setCardStartX] = createSignal(0);
  const [cardStartY, setCardStartY] = createSignal(0);
  const [isDragging, setIsDragging] = createSignal(false);

  function onMouseDown(ev: MouseEvent) {
    setLastX(ev.clientX);
    setLastY(ev.clientY);
    setCardStartX(card.x);
    setCardStartY(card.y);
    setIsDragging(true);
  }

  function onMouseUp() {
    setIsDragging(false);
  }

  function onMouseMove(ev: MouseEvent) {
    if (!isDragging()) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    card.x = cardStartX() + (ev.clientX - lastX());
    card.y = cardStartY() + (ev.clientY - lastY());
  }

  function onWheel(ev: WheelEvent) {
    ev.preventDefault();
    ev.stopImmediatePropagation();
    
    // Get bounding rectangle of the container
    const container = ev.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();

    // Get the mouse position relative to the container
    const cursorXRelativeToContainer = ev.clientX - rect.left;
    const cursorYRelativeToContainer = ev.clientY - rect.top;

    // Scale change depending on the direction of the mouse wheel
    const scaleChange = ev.deltaY < 0 ? zoomIntensity : 1 / zoomIntensity;
    const newScale = Math.max(0.25, Math.min(3, card.scale * scaleChange));

    // Calculate the cursor's current position relative to the image origin
    const cursorXRelativeToImage = cursorXRelativeToContainer - card.x;
    const cursorYRelativeToImage = cursorYRelativeToContainer - card.y;

    // Calculate the new positions for card.x and card.y
    const newX = cursorXRelativeToContainer - cursorXRelativeToImage * newScale / card.scale;
    const newY = cursorYRelativeToContainer - cursorYRelativeToImage * newScale / card.scale;

    // Update card properties
    card.x = newX;
    card.y = newY;
    card.scale = newScale;
  }

  const nameMaxFontSize = createMemo(() => {
    const largerFontSizes: CardKind[] = ['agenda', 'ice', 'identity'];

    if (largerFontSizes.includes(card.kind))
      return 18;

    return 16;
  });

  return (
    <div
      class={`card ${card.kind} ${card.faction} ${card.side} ${card.img ? 'has-image' : ''}`}
      onMouseMove={onMouseMove}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      style={{
        'background-image': `url(${card.img})`,
        'background-position': `${card.x}px ${card.y}px`,
        'background-size': `${card.scale * 100.0}%`,
      }
    }>
      <img src={imageUri(card)} draggable="false" />

      <Show when={card.kind === 'identity' && card.side === 'runner'}>
        <div class="runner-identity-img" style={{
          'background-image': `url(${card.img})`,
          'background-position': `${card.x}px ${card.y}px`,
          'background-size': `${card.scale * 100.0}%`,          
        }}></div>
      </Show>

      <FitText class="name" maxFontSize={nameMaxFontSize()} multiLine={false} widthOnly={true} content={() => [
        card.unique && card.kind !== 'identity' ? '◆ ' : '',
        card.name,
      ].join('')}></FitText>

      <Show when={card.kind === 'identity'}>
        <FitText class="subtitle" maxFontSize={14} multiLine={false} widthOnly={true} content={() => card.subtitle}></FitText>
      </Show>
      <div class={`price outline center ${['1', '11'].includes(`${card.price}`) ? 'one' : ''} ${`${card.price}`.length > 1 ? 'ten' : ''}`}>
        { card.price === '' ? 'X' : card.price }
      </div>
      <Show when={hasStrength(card)}>
        <div class={`strength outline center ${`${card.strength}` === '1' ? 'one' : ''}`}>
          { card.strength === '' && card.kind === 'program' ? '—' : card.strength }
        </div>
      </Show>
      <Show when={hasTrash(card) && /^[0-9]+$/.test(card.trash)}>
        <div class="trash center">{ card.trash }</div>
      </Show>
      <Show when={card.kind === 'program'}>
        <div class={`mu center ${`${card.strength}` === '1' ? 'one' : ''}`}>{ card.mu }</div>
      </Show>

      <Show when={card.kind === 'identity'}>
        <div class="min-deck">{ card.minDeckSize }</div>
        <div class="max-influence">{ card.influence }</div>
      </Show>
      <div class="type"><span class="kind">{ card.kind }<Show when={card.subtypes.length > 0}>:</Show></span> { card.subtypes.join(' – ') }</div>
      <div class={`influence i${card.influence ?? 0}`}></div>
      <FitText class="main-content text" maxFontSize={14} card={card} content={() => [
        paragraphize(miniMarkdown(iconify(card.text ?? '', card.name))),
        (card.fluff ? '<p class="fluff-separator">&nbsp;</p>' : ''),
        paragraphize(miniMarkdown(card.fluff), 'fluff'),
      ].join('')}>
      </FitText>
    </div>
  )
}