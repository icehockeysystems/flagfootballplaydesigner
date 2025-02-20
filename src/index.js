import React from "react"
import ReactDOM from "react-dom"
import App from './App'
import "tippy.js/dist/tippy.css"
import { mode } from "./modes/football.js"

ReactDOM.render(
  <React.StrictMode>
    <App
      mode={mode}
      showForm={true}
      showDownloadButtons={true}
      showExportImportButtons={true}
      formInputClass="form-control"
      buttonClass="btn btn-primary"
      defaultData={undefined}
      defaultLogo={undefined}
      promptBeforeUnload={false}
    />
  </React.StrictMode>,
  document.getElementById('drill-maker')
);
