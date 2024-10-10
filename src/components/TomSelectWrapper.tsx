import { Component, createEffect, onCleanup, onMount } from 'solid-js';
import TomSelect from 'tom-select';

export interface TomSelectOption {
  value: string;
  text: string;
}

export interface TomSelectProps {
  id: string;
  options: TomSelectOption[];
  value?: string[];
  onOptionAdd?: (value: string, data: unknown) => void;
  onChange?: (values: string[]) => void;
}

export const TomSelectWrapper: Component<TomSelectProps> = (props) => {
  let selectElement: HTMLSelectElement | undefined;
  let tomSelectInstance: TomSelect;

  createEffect(() => {
    if (tomSelectInstance) tomSelectInstance.refreshOptions();
  }, props.options)

  onMount(() => {
    if (!selectElement) return;

    tomSelectInstance = new TomSelect(selectElement, {
      options: props.options,
      create: true,
      createOnBlur: true,
      hideSelected: false,
      maxOptions: null,
      openOnFocus: true,
      placeholder: 'Subtypes',
      plugins: ['remove_button', 'dropdown_input'],
      onOptionAdd: (value: string, item: HTMLElement) => {
        // console.log('onOptionAdd', value, item);
        props.onOptionAdd?.(value, item);
      },
      // onOptionRemove: (val: string) => {
      //   console.log('onOptionRemove', val);
      // },
      onChange: (values: string[]) => {
        // console.log('onChange', values, tomSelectInstance.control_input);
        // tomSelectInstance.setTextboxValue('');
        tomSelectInstance.control_input.value = '';
        tomSelectInstance.close();
        props.onChange?.(values);
      }
    });

    // Sync external value changes with TomSelect
    if (props.value !== undefined) {
      tomSelectInstance.setValue([...props.value].map(x => x.toLowerCase()));
    }

    // Cleanup when the component is unmounted
    onCleanup(() => {
      tomSelectInstance.destroy();
    });
  });

  return (
    <select id={props.id} ref={selectElement} multiple>
      {props.options.map((item) => (
        <option value={item.value}>{item.text}</option>
      ))}
    </select>
  );
};
