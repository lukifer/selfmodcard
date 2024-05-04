import { createSignal } from 'solid-js';

import { TomSelectOption, TomSelectWrapper } from './TomSelectWrapper';
import { Card } from '../models/Card';
import subtypes from '../models/subtypes.json';

const subtypesOptions = subtypes.data.map<TomSelectOption>((subtype) => ({
  value: subtype.id,
  text: subtype.attributes.name
}))

type SubtypesAttributeProps = {
  card: Card;
}

export function SubtypesAttribute(props: SubtypesAttributeProps) {
  const { card } = props;
  const [options, setOptions] = createSignal(subtypesOptions);

  const ucFirst = (str: string) => str.split(' ').map(s =>
    `${s.slice(0, 1).toLocaleUpperCase()}${s.slice(1)}`
  ).join(' ');

  const onOptionAdd = (value: string, data: unknown) => {
    // console.log(`onOptionAdded: ${value}`, data, [...subtypesOptions, {
    //   value,
    //   text: ucFirst(value),
    // }].sort((a, b) => a.text > b.text ? 1 : -1));
    setOptions([...subtypesOptions, {
      value,
      text: ucFirst(value),
    }].sort((a, b) => a.text > b.text ? 1 : -1))
  };

  // const handleRemove = (value: string) => {
  //   console.log(`Removed: ${value}`);
  // };

  const onChange = (values: string[]) => {
    props.card.subtypes = values.sort().map(subtype => {
      return subtypesOptions.find(({ value }) => value === subtype)?.text ?? ucFirst(subtype)
    });
  };

  const attribute = 'subtypes';

  return (
    <div class="form-group">
      <label for={attribute} class={`col-sm-3 control-label ${attribute}`}>
        Subtypes
      </label>
      <div class="col-sm-9">
        { card.subtypes.join(', ') }
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
