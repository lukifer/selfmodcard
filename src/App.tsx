import './App.scss';
import "@thisbeyond/solid-select/style.css";

import html2canvas from 'html2canvas';

import { Component, createSignal } from 'solid-js';

import { createCardStore } from './models/Card'; 

import { AttributesView } from './views/AttributesView'
import { CardView } from './views/CardView'

const App: Component = () => {
  const [imageData, setImageData] = createSignal('')
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
              <small>alpha</small>
            </h1>
          </div>
          <div class="row">
            <div class="col-sm-7 form-view">
              <h2>Customize your card</h2>
              <form class="form-horizontal" role="form">
                <AttributesView card={card} />
              </form>
            </div>
            <div class="col-sm-5 card-view">
              <h2>Card View</h2>
              <CardView card={card} />
              <button type="button" class="generate-image btn btn-default btn-md" onClick={generateImage}>
                <span class="glyphicon glyphicon-play"></span>
                <span>Generate Image</span>
              </button>
              <a
                class={`save-image btn btn-default btn-md ${imageData() ? '' : 'disabled'}`}
                download={cardDownloadName()}
                href={imageData()}
              >
                <span class="glyphicon glyphicon-floppy-disk"></span>
                <span>Save Image</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default App;
