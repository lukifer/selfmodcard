import { Accessor, createEffect } from 'solid-js';
import textFit from 'textfit';

type FitTextProps = {
  content: () => string;
  class?: string;
  maxFontSize: number;
  overrideFontSize?: Accessor<string>;
}

export const FitText = (props: FitTextProps) => {
  const { maxFontSize, overrideFontSize } = props;

  let textRef: HTMLDivElement | undefined;

  createEffect(() => {
    props.content();
    const fontSize = overrideFontSize();
    const textFitForceFontSize = fontSize === 'auto' ? {} : {
      minFontSize: parseFloat(fontSize),
      maxFontSize: parseFloat(fontSize),
    };
    textFit(textRef, {
      maxFontSize,
      multiLine: true,
      ...textFitForceFontSize
    });
  });

  return (
    <div class={props.class} ref={textRef!} innerHTML={props.content()} />
  );
};
