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
      createOnBlur: false,
      hideSelected: true,
      maxOptions: null,
      openOnFocus: true,
      placeholder: 'None',
      plugins: ['remove_button', 'drag_drop', 'caret_position', 'input_autogrow'],
      onOptionAdd: (value: string, item: HTMLElement) => {
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
