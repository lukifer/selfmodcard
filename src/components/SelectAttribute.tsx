import { createEffect, Accessor } from 'solid-js';
import { Card } from '../models/Card';

type CardSelectAttribute = 'side' | 'faction' | 'kind';

export type SelectionProps<T extends CardSelectAttribute> = {
  attribute: T;
  label?: string;
  card: Card;
  options: Accessor<Partial<Record<Card[T], string>>>;
}

export function SelectAttribute<T extends CardSelectAttribute>(props: SelectionProps<T>) {
  const { attribute, card, label, options } = props

  const handleChange = (event: Event & { target: HTMLSelectElement }) => {
    if (card[attribute] !== event.target.value) {
      card[attribute] = event.target.value as Card[T];
    }
  };

  createEffect(() => {
    const updatedOptionKeys = Object.keys(props.options());
    if (!updatedOptionKeys.includes(card[attribute])) {
      card[attribute] = updatedOptionKeys[0] as Card[T];
    }
  })

  return (
    <div class="form-group">
      <label for={attribute} class="col-sm-3 control-label">{label || attribute}:</label>
      <div class="col-sm-9">
        <div class="select-wrapper">
          <select class="form-control" id={attribute} value={card[attribute]} onInput={handleChange}>
            {Object.entries(options()).map(([val, label]) => (
              <option value={val}>
                {`${label}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
