import { createEffect } from 'solid-js';
import textFit from 'textfit';

import { Card } from '../models/Card';

type FitTextProps = {
  card?: Card;
  class?: string;
  content: () => string;
  maxFontSize: number;
  multiLine?: boolean;
  widthOnly?: boolean;
}

export const FitText = (props: FitTextProps) => {
  const { card, maxFontSize, multiLine = true, widthOnly = false } = props;

  let textRef: HTMLDivElement | undefined;

  createEffect(() => {
    props.content();
    const textFitForceFontSize = !card || card.fontSize === 'auto' ? {} : {
      minFontSize: card.fontSize,
      maxFontSize: card.fontSize,
    };
    textFit(textRef, {
      maxFontSize,
      multiLine,
      widthOnly,
      ...textFitForceFontSize
    });
  });

  return (
    <div class={props.class} ref={textRef!} innerHTML={props.content()} />
  );
};
