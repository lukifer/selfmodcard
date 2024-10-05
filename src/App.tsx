import './App.scss';
import "@thisbeyond/solid-select/style.css";

import html2canvas from 'html2canvas';
import { parse } from 'search-params'

import { Component, Show, createSignal, createEffect, createResource } from 'solid-js';

import { createCardStore, Card } from './models/Card'; 

import { AttributesView } from './views/AttributesView';
import { CardView } from './views/CardView';

import { zip, unzip } from './utils';

const fontSizes = ['auto', ...[...Array(25)].map((_, n) => 
  `${(6 + (n/2))}px`
)]

async function cardDataFromQueryString(cardData: string): Promise<Partial<Card>> {
  try {
    const str = await unzip(`${cardData}`);
    if (str) {
      const json = JSON.parse(str) as Partial<Card>;
      if (json.side && json.faction) {
        return json;
      }
    }
  } catch(_) {
    return {};
  }
}

export function loadImageAsDataUri(url: string, onload: (str: string) => void) {
  const img = document.createElement('img');
  img.crossOrigin = 'anonymous';
  img.src = url;

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      try {
        const dataURL = canvas.toDataURL('image/png');
        onload(dataURL);
      } catch (err) {}
    }
  };

  img.onerror = (error) => {
    console.error("Failed to load image:", error);
  };
};

const App: Component = () => {
  const [imageData, setImageData] = createSignal('');
  const [fontSize, setFontSize] = createSignal<string>('auto');
  const [compressedCardData, setCompressedCardData] = createSignal<string>('');

  const { location } = document;
  const searchParams = parse(location.search);

  const card = createCardStore({});

  createEffect(async () => {
    if (!!searchParams.card) {
      const cardData = await cardDataFromQueryString(`${searchParams.card}`);
      Object.keys(cardData).forEach(k => {
        card[k] = cardData[k];
      });
    }
  });

  if (card.imgUrl && /^http/.test(card.imgUrl)) {
    loadImageAsDataUri(card.imgUrl, (dataUri: string) => {
      card.img = dataUri;
    })
  }

  async function generateImage(): Promise<void> {
    const cardNode = document.querySelector<HTMLElement>('.card');
    const canvas: HTMLCanvasElement = await html2canvas(cardNode, {
      allowTaint: true
    });
    setImageData(canvas.toDataURL('image/png'));
  }

  function cardDownloadName() {
    let cardname = card.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `netrunner-${cardname}.png`;
  }

  async function copyCardData() {
    const { img, ...cardData } = card;
    const cardJson = JSON.stringify(cardData);
    const zippedCard = await zip(cardJson);
    await navigator.clipboard.writeText(location.origin + location.pathname + '?card=' + zippedCard);
    setCompressedCardData(zippedCard);
  }

  return (
    <>
      <div>
        <div class="container">
          <div class="page-header">
            <h1>
              Netrunner Card Creator
            </h1>
            <h6>Under development; adapted from <a href="http://cardcreator.grndl.net/">GRNDL Card Creator</a> by <a href="https://github.com/yonbergman/self-modifying-card">@yonbergman</a></h6>
          </div>
          <div class="row">
            <div class="col-sm-7 form-view">
              <form class="form-horizontal" role="form">
                <AttributesView card={card} />
              </form>
            </div>
            <div class="col-sm-5 card-view">
              <CardView card={card} fontSize={fontSize} />
              <div class="copy-clipboard">
                <a href="javascript:void(0);" onClick={copyCardData}>
                  <i class="glyphicon glyphicon-share"></i>
                  Copy Card URL To Clipboard
                </a>
                <Show when={!!compressedCardData()}>
                  <div class="complete">
                    Copied!: <pre>{location.origin + location.pathname}?card={compressedCardData()}</pre>
                    <Show when={card.img && !card.imgUrl}>
                      <div class="warning">
                        (Uploaded image not included. To preserve image data, use Image URL instead.)
                      </div>
                    </Show>
                    </div>
                </Show>
              </div>
              <div class="card-controls">
                <button type="button" class="generate-image btn btn-default btn-md" onClick={generateImage}>
                  <span class="glyphicon glyphicon-play"></span>
                  <span>{imageData() ? 'Update' : 'Build'} PNG</span>
                </button>
                <a
                  class={`save-image btn btn-default btn-md ${imageData() ? '' : 'disabled'}`}
                  download={cardDownloadName()}
                  href={imageData()}
                >
                  <span class="glyphicon glyphicon-floppy-disk"></span>
                  <span>Save PNG</span>
                </a>
                <label for="font-size">
                  Text Size:
                </label>
                <div class="select-wrapper">
                  <select id="font-size" class="form-control" value={fontSize()} onInput={(({ target }) => {
                    setFontSize(target.value);
                  })}>
                    {fontSizes.map((size) => (
                      <option value={size}>
                        {`${size}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default App;
