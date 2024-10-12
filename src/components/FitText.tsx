import { createEffect } from 'solid-js';
import textFit from 'textfit';

import { Card } from '../models/Card';

type FitTextProps = {
  content: () => string;
  class?: string;
  maxFontSize: number;
  card: Card;
}

export const FitText = (props: FitTextProps) => {
  const { card, maxFontSize } = props;

  let textRef: HTMLDivElement | undefined;

  createEffect(() => {
    props.content();
    const textFitForceFontSize = card.fontSize === 'auto' ? {} : {
      minFontSize: card.fontSize,
      maxFontSize: card.fontSize,
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
