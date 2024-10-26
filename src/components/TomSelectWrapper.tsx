import { Accessor, Component, createEffect, onCleanup, onMount } from 'solid-js';
import TomSelect from 'tom-select';
import { subtypeKey } from '../utils';

export interface TomSelectOption {
  value: string;
  text: string;
}

export interface TomSelectProps {
  id: string;
  options: Accessor<TomSelectOption[]>;
  value?: string[];
  onOptionAdd?: (value: string, data: unknown) => void;
  onChange?: (values: string[]) => void;
}

export const TomSelectWrapper: Component<TomSelectProps> = (props) => {
  let selectElement: HTMLSelectElement | undefined;
  let tomSelectInstance: TomSelect;

  createEffect(() => {
    const options = props.options();
    if (tomSelectInstance) {
      // tomSelectInstance.setupOptions(options);
      tomSelectInstance.refreshOptions();
    }
  }, props.options())

  // let lastValue = '';
  createEffect(() => {
    const value = [...props.value].map(subtypeKey).join(',');
    // lastValue = value;
    if (tomSelectInstance && value !== (tomSelectInstance?.getValue() as string[])?.join(',')) {
      // console.log('tomSelectInstance.setValue', [...props.value], [...props.value].map(subtypeKey));
      // tomSelectInstance.refreshOptions();
      tomSelectInstance.setValue([...props.value].map(subtypeKey));
    }
  })

  onMount(() => {
    if (!selectElement) return;

    tomSelectInstance = new TomSelect(selectElement, {
      options: props.options(),
      create: true,
      createOnBlur: false,
      hideSelected: true,
      maxOptions: null,
      openOnFocus: true,
      placeholder: 'None',
      plugins: ['remove_button', 'drag_drop', 'caret_position', 'input_autogrow'],
      onOptionAdd: (value: string, item: HTMLElement) => {
        // console.log(`tomSelectInstance onOptionAdd`, value, item, tomSelectInstance.options);
        props.onOptionAdd?.(value, item);
      },
      // onOptionRemove: (val: string) => {
      //   console.log('onOptionRemove', val);
      // },
      onChange: (values: string[]) => {
        tomSelectInstance.control_input.value = '';
        props.onChange?.([...values]);
      }
    });

    // Sync external value changes with TomSelect
    if (props.value !== undefined) {
      tomSelectInstance.setValue([...props.value].map(subtypeKey));
    }

    // Cleanup when the component is unmounted
    onCleanup(() => {
      tomSelectInstance.destroy();
    });
  });

  return (
    <select id={props.id} ref={selectElement} multiple>
      {props.options().map((item) => (
        <option value={item.value}>{item.text}</option>
      ))}
    </select>
  );
};
