# About this project

The goal of this project is to build a complete Drill Maker widget that is
contained in a Javascript and CSS bundle. All that's needed to add it to a page
is the following HTML.

```html
<div id="drill-maker"></div>
<script src="drill-maker/js/main.HASH.js"></script>
<link rel="stylesheet" href="drill-maker/css/main.HASH.css">
```

# Attributes

You can customize the Drill Maker with the following attributes on the DIV
element:

- data-show-form: If "true", shows the title and description input
  fields. If "false", hides these fields. Defaults to "true".

- data-show-download-buttons: If "true", shows the download buttons. If
  "false", hides these buttons. Defaults to "true".

- data-show-export-import-buttons: If "true", shows the export and import
  buttons. If "false", hides these buttons. Defaults to "true".

- data-form-input-class: Sets the class on the title and description input
  fields. Defaults to Bootstrap's "form-control" class.

- data-button-class: Sets the class on the export and input buttons. Defaults
  to Bootstrap 4's "btn btn-primary" classes.

- data-on-change: Set to the name of a global callback function, called when
  the component's state changes. Receives an exported data object and a Base64
  encoded image string.

- data-default-data: Set to a JSON string to initialize the component with
  previously exported data.

- data-default-logo: Set to a Base64-encoded raster image to replace the built-
  in logo.

- data-prompt-before-unload: If "true", prompts user before leaving the page if
  any changes are detected since the last download or export.

## Approach

The app is built with [React][React] and [Create React App][CRA].

[Create React App Configuration Override][craco] is used to finesse the final
build files.

CSS is bundled within the app with [styled-components][styled-components].
However, class names are added to all elements for custom style overrides.

Canvas support is thanks to [Paper.js][paper].

Tooltips are provided by [Tippy.js][tippy].

PDF support is thanks to [jsPDF][jsPDF].

## Development

Install [npm][npm] and then install the dependencies:

```
npm install
```

For local development on the lacrosse version, run:

```
npm run start
```

To create a lacrosse production build, run:

```
npm run build
```

## Images

The background images should be 800x400 SVGs for Ice Hockey and 800x500 for
Soccer, and preferably optimized with [SVGO][svgo]
([here's a handy tool][svgo-online] to do this online).

## Text Icons

These icons were created with font "Roboto Black". The font size varies.
It's easier to create them in a larger canvas (e.g. 64x64) and larger font
size, then convert the text item to outlines, center in the canvas, and then
scale everything down when finished.

[React]: https://reactjs.org/
[CRA]: https://create-react-app.dev/
[craco]: https://github.com/gsoft-inc/craco
[styled-components]: https://styled-components.com/
[paper]: http://paperjs.org/
[tippy]: https://atomiks.github.io/tippyjs/
[jsPDF]: https://github.com/MrRio/jsPDF
[npm]: https://www.npmjs.com/
[svgo]: https://github.com/svg/svgo
[svgo-online]: https://jakearchibald.github.io/svgomg/
