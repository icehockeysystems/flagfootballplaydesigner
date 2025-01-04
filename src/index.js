import React from "react"
import ReactDOM from "react-dom"
import App from "./App"
import "tippy.js/dist/tippy.css"
import { mode } from "./modes/football.js"

window.Drupal = window.Drupal || { 'behaviors': {}, 'empty': true };

  window.Drupal.behaviors.drillMakerScript = {
    attach: function (context, settings) {
      const elements = document.querySelectorAll("div.drill-maker, #drill-maker")
      
      for (let i = 0; i < elements.length; i++) {
        const element = elements.item(i)
        if (element.dataset.drawn) {
          return false
        }

        const renderApp = () => {
          const props = element.dataset
          ReactDOM.render(
            <React.StrictMode>
              <App
                mode={mode}
                showForm={JSON.parse(props.showForm || "true")}
                showDownloadButtons={JSON.parse(props.showDownloadButtons || "true")}
                showExportImportButtons={JSON.parse(props.showExportImportButtons || "true")}
                formInputClass={props.formInputClass || "form-control"}
                buttonClass={props.buttonClass || "btn btn-primary"}
                onChange={props.onChange ? window[props.onChange] : undefined}
                defaultData={props.defaultData || undefined}
                defaultLogo={props.defaultLogo || undefined}
                promptBeforeUnload={JSON.parse(props.promptBeforeUnload || "true")}
              />
            </React.StrictMode>,
            element
          )
        }

        renderApp()
        element.dataset.drawn = true
      }
    }
  }

  if (window.Drupal.empty) {
    window.Drupal.behaviors.drillMakerScript.attach()
  }
