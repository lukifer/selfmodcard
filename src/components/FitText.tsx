import { Accessor, createEffect } from 'solid-js';
import textFit from 'textfit';

type FitTextProps = {
  overrideFontSize?: Accessor<string>;
  content: () => string;
  class?: string;
}

export const FitText = (props: FitTextProps) => {
  const { overrideFontSize } = props;

  let textRef: HTMLDivElement | undefined;

  createEffect(() => {
    props.content();
    const fontSize = overrideFontSize();
    const textFitForceFontSize = fontSize === 'auto' ? {} : {
      minFontSize: parseFloat(fontSize),
      maxFontSize: parseFloat(fontSize),
    };
    textFit(textRef, {multiLine: true, ...textFitForceFontSize});
  });

  return (
    <div class={props.class} ref={textRef!} innerHTML={props.content()} />
  );
};
