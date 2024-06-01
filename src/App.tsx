import './App.scss';
import "@thisbeyond/solid-select/style.css";

import html2canvas from 'html2canvas';

import { Component, createSignal } from 'solid-js';

import { createCardStore } from './models/Card'; 

import { AttributesView } from './views/AttributesView'
import { CardView } from './views/CardView'

const fontSizes = ['auto', ...[...Array(25)].map((_, n) => 
  `${(6 + (n/2))}px`
)]

const App: Component = () => {
  const [imageData, setImageData] = createSignal('')
  const [fontSize, setFontSize] = createSignal<string>('auto')
  const card = createCardStore();

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
    </>
  );
};

export default App;
