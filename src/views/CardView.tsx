import { Accessor, Show } from 'solid-js';
import { Card, icons, imageUri } from '../models/Card';
import { hasStrength, hasTrash } from './AttributesView';
import { FitText } from '../components/FitText';

export const iconRegexes = Object.entries(icons).reduce((regexes, [icon, strs]: [string, string[]]) => {
  if (icon) regexes.push([icon, new RegExp(strs.map(s =>
    s.replace('[', '\\[').replace(']', '\\]')
  ).join('|'), 'g')]);
  return regexes;
}, [] as Array<[string, RegExp]>)

export function iconify(content: string) {
  return iconRegexes.reduce((content, [icon, regex]) => (
    content.replace(regex, `<i class='icon icon-${icon}'></i>`)
  ), content);
}

export const CardView = (props: {
  card: Card
  fontSize: Accessor<string>
}) => {
  const { card, fontSize } = props;

  let lastX: number;
  let lastY: number;
  let isDragging = false;
  
  function onMouseDown(ev: MouseEvent) {
    lastX = ev.clientX;
    lastY = ev.clientY;
    isDragging = true;
  }

  function onMouseUp() {
    isDragging = false;
  }

  function onMouseMove(ev: MouseEvent) {
    if (!isDragging) return;
    ev.preventDefault();
    card.x = card.x + (ev.clientX - lastX);
    card.y = card.y + (ev.clientY - lastY);
  }

  function onWheel(ev: WheelEvent) {
    const zoomIntensity = 1.03;
    
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
      <img src={imageUri(card)} />

      <div class="name">{ card.unique && '◆ ' }{ card.name }</div>
      <Show when={card.kind === 'identity'}>
        <div class="subtitle">{ card.subtitle }</div>
      </Show>
      <div class="price outline center">{ card.price }</div>
      <Show when={hasStrength(card)}>
        <div class="strength outline center">{ card.strength }</div>
      </Show>
      <Show when={hasTrash(card) && /^[0-9]+$/.test(card.trash)}>
        <div class="trash center">{ card.trash }</div>
      </Show>
      <Show when={card.kind === 'program'}>
        <div class="mu center">{ card.mu }</div>
      </Show>

      <Show when={card.kind === 'identity'}>
        <div class="min-deck">{ card.minDeckSize }</div>
        <div class="max-influence">{ card.influence }</div>
      </Show>
      <div class="type"><span class="kind">{ card.kind }:</span> { card.subtypes.join(' – ') }</div>
      <div class={`influence i${card.influence ?? 0}`}></div>
      <FitText class="main-content text" maxFontSize={14} overrideFontSize={fontSize} content={() =>
        `<p>${iconify(card.text).split('\n\n').join('</p><p>')}</p>`
        +
        '<p class="fluff">' + card.fluff + '</p>'
      }>
      </FitText>
    </div>
  )
}