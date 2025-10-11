import { createSignal } from 'solid-js';

import { TomSelectOption, TomSelectWrapper } from './TomSelectWrapper';
import { Card } from '../models/Card';
import subtypes from '../models/subtypes.json';
import { subtypeKey, ucFirst } from '../utils';

const subtypesOptions = subtypes.data.map<TomSelectOption>((subtype) => ({
  // value: subtype.id,
  value: subtype.attributes.name,
  text: subtype.attributes.name
}))

const populateCustomOptions = (options: TomSelectOption[], cardOptions: Card['subtypes']) => {
  return [...cardOptions].reduce((updatedOptions, text) => {
    const value = subtypeKey(text);

    if (options.find(o => o.value === value))
      return updatedOptions;

    return [
      ...updatedOptions, {
        value,
        text,
      }
    ]
  }, options).sort((a, b) => a.text.localeCompare(b.text));
}

type SubtypesAttributeProps = {
  card: Card;
}

export function SubtypesAttribute(props: SubtypesAttributeProps) {
  const { card } = props;
  const [options, setOptions] = createSignal(populateCustomOptions(subtypesOptions, card.subtypes));

  const onOptionAdd = (value: string, data: { text: string }) => {
    const text = subtypeKey(data.text);
    const existingOptions = options();
    if (!existingOptions.find(o => subtypeKey(o.text) === text)) {
      setOptions([...existingOptions, {
        value,
        text: data.text,
      }].sort((a, b) => a.text.localeCompare(b.text)));
    }
  };

  // const handleRemove = (value: string) => {
  //   console.log(`Removed: ${value}`);
  // };

  const onChange = (values: string[]) => {
    props.card.subtypes = values.map(subtype => {
      const opt = options().find(({ value }) => subtypeKey(value) === subtypeKey(subtype));
      // if (!opt) console.log('onChange failed', values, [...options()]);
      return opt?.text ?? ucFirst(subtype);
    });
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
          options={options}
          onOptionAdd={onOptionAdd}
          onChange={onChange}
        />
      </div>
    </div>
  );
};
