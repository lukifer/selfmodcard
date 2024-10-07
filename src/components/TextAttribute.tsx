import { createSignal, JSXElement, onCleanup, Show } from 'solid-js';
import { Tooltip, OverlayTrigger } from "solid-bootstrap";

import { Card } from '../models/Card';
import { capitalizeFirst } from '../utils';

type CardSelectAttribute = keyof Card;

export type TextAttributeProps<T extends CardSelectAttribute> = {
  attribute: T;
  card: Card;
  label?: string;
  textarea?: boolean;
  rows?: number;
  info?: string | JSXElement;
  fullWidth?: boolean;
}

export function TextAttribute<T extends CardSelectAttribute>(props: TextAttributeProps<T>) {
  const { attribute, card, info, label, rows } = props;
  const [showPopover, setShowPopover] = createSignal(false)

  const updateContent = (ev: Event) => {
    const el = ev.target as HTMLInputElement | HTMLTextAreaElement;
    card[attribute] = el.value as Card[T];
  };

  let inputRef: HTMLInputElement | null;
  let textareaRef: HTMLTextAreaElement | null;
  
  onCleanup(() => {
    if (inputRef) {
      inputRef.removeEventListener('keyup', updateContent);
      inputRef.removeEventListener('change', updateContent);
    }
    if (textareaRef) {
      textareaRef.removeEventListener('keyup', updateContent);
      textareaRef.removeEventListener('change', updateContent);
    }
  });

  return (
    <div class="form-group">
      <label id={`label-${attribute}`} for={attribute} class={`col-sm-3 control-label ${attribute}`}>
        {label || capitalizeFirst(attribute)}:
        <Show when={!!props.info}>
          <OverlayTrigger
            show={showPopover()}
            placement="right"
            popperConfig={{
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, 8],
                  },
                },
              ],
            }}
            overlay={
              <Tooltip id="help-tooltip">
                { info }
              </Tooltip>
            }
          >
            <span>
              &nbsp;
              <i id={`info-${attribute}`} onMouseOver={() => setShowPopover(true)} onMouseOut={() => setShowPopover(false)} class="text-help glyphicon glyphicon-question-sign"></i>
            </span>
          </OverlayTrigger>
        </Show>
      </label>
      <div class={props.textarea || props.fullWidth ? 'col-sm-9' : 'col-sm-5'}>
        <Show when={!props.textarea}>
          <input 
            type={"text"}
            class="form-control" 
            id={attribute}
            placeholder={attribute} 
            value={card[attribute].toString()}
            ref={inputRef}
            onKeyUp={updateContent}
            onChange={updateContent}
          />
        </Show>
        <Show when={props.textarea}>
          <textarea 
            class="form-control"
            rows={rows}
            ref={textareaRef} 
            onKeyUp={updateContent} 
            onChange={updateContent}>
            {card[attribute]}
          </textarea>
        </Show>
      </div>
    </div>
  );
};
