import { Accessor, onCleanup } from 'solid-js';
import { Card } from '../models/Card'

type CardSelectAttribute = keyof Card;

type NumberAttributeProps<T extends CardSelectAttribute> = {
  attribute: T;
  card: Card;
  label: Accessor<string>;
  min?: number;
  max?: number;
  placeholder?: string;
}

export function NumberAttribute<T extends CardSelectAttribute>(props: NumberAttributeProps<T>) {
  const { attribute, card, label, max, min, placeholder } = props;

  const updateContent = (ev: Event) => {
    const el = ev.target as HTMLInputElement;
    card[attribute] = el.value as Card[T];
  };

  let inputRef: HTMLInputElement | null;
  
  onCleanup(() => {
    if (inputRef) {
      inputRef.removeEventListener('keyup', updateContent);
      inputRef.removeEventListener('change', updateContent);
    }
  });

  return (
    <div class="form-group">
      <label for={attribute} class={`col-sm-3 control-label ${attribute}`}>
        {label() ?? attribute}:
      </label>
      <div class="col-sm-5">
        <input 
          type={"number"}
          class="form-control" 
          id={attribute}
          placeholder={placeholder ?? label() ?? attribute}
          value={card[attribute]?.toString() ?? ''}
          ref={inputRef}
          min={min}
          max={max}
          onKeyUp={updateContent}
          onChange={updateContent}
        />
      </div>
    </div>
  );
}
