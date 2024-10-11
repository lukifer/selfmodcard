import { createSignal } from 'solid-js';

import { TomSelectOption, TomSelectWrapper } from './TomSelectWrapper';
import { Card } from '../models/Card';
import subtypes from '../models/subtypes.json';
import { ucFirst } from '../utils';

const subtypesOptions = subtypes.data.map<TomSelectOption>((subtype) => ({
  value: subtype.id,
  text: subtype.attributes.name
}))

const populateCustomOptions = (options: TomSelectOption[], cardOptions: Card['subtypes']) => {
  const missingOptions = cardOptions.map(o => o.toLowerCase()).filter(cardOption => !options.find(o => o.value === cardOption));
  return [
    ...options,
    ...missingOptions.map(value => ({
      value,
      text: ucFirst(value)
    }))
  ]
}

type SubtypesAttributeProps = {
  card: Card;
}

export function SubtypesAttribute(props: SubtypesAttributeProps) {
  const { card } = props;
  const [options, setOptions] = createSignal(populateCustomOptions(subtypesOptions, card.subtypes));

  const onOptionAdd = (value: string, data: unknown) => {
    setOptions([...subtypesOptions, {
      value,
      text: ucFirst(value),
    }]);
  };

  // const handleRemove = (value: string) => {
  //   console.log(`Removed: ${value}`);
  // };

  const onChange = (values: string[]) => {
    props.card.subtypes = values.map(subtype => (
      subtypesOptions.find(({ value }) => value === subtype)?.text ?? ucFirst(subtype)
    ));
  };

  const attribute = 'subtypes';

  return (
    <div class="form-group">
      <label for={attribute} class={`col-sm-3 control-label ${attribute}`}>
        Subtypes
      </label>
      <div class={`col-sm-9 ${card.subtypes.length > 0 ? 'hide-placeholder' : ''}`}>
        <TomSelectWrapper
          id={attribute}
          value={card.subtypes}
          options={options()} 
          onOptionAdd={onOptionAdd} 
          onChange={onChange}
        />
      </div>
    </div>
  );
};
