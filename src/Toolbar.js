import { useRef, useMemo, useCallback, useState, useEffect } from "react"
import Tippy from "@tippyjs/react"
import styled from "styled-components"

const textTool = {
  name: "Text",
  tool: "text",
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.94726562,12.28125 L3.43945312,10.6875 L6.2578125,10.6875 L6.75585938,12.28125 L8.96484375,12.28125 L5.8125,3.75 L3.87890625,3.75 L0.75,12.28125 L2.94726562,12.28125 Z M5.765625,9.09960938 L3.93164062,9.09960938 L4.84570312,6.140625 L5.765625,9.09960938 Z M11.3554688,12.3984375 C12.0078125,12.3984375 12.515625,12.1699219 12.8789062,11.7128906 C12.9335938,11.9628906 12.9960938,12.1523438 13.0664062,12.28125 L13.0664062,12.28125 L15.0410156,12.28125 L15.0410156,12.1816406 C14.8691406,11.8730469 14.7792969,11.4277344 14.7714844,10.8457031 L14.7714844,10.8457031 L14.7714844,8.0390625 C14.7597656,7.3515625 14.5195312,6.81054688 14.0507812,6.41601562 C13.5820312,6.02148438 12.9433594,5.82421875 12.1347656,5.82421875 C11.3261719,5.82421875 10.6611328,6.015625 10.1396484,6.3984375 C9.61816406,6.78125 9.35742188,7.27929688 9.35742188,7.89257812 L9.35742188,7.89257812 L11.3320312,7.89257812 C11.3320312,7.43164062 11.5664062,7.20117188 12.0351562,7.20117188 C12.5390625,7.20117188 12.7910156,7.4921875 12.7910156,8.07421875 L12.7910156,8.07421875 L12.7910156,8.40820312 L12.1816406,8.40820312 C11.2128906,8.40820312 10.4746094,8.58398438 9.96679688,8.93554688 C9.45898438,9.28710938 9.20507812,9.80664062 9.20507812,10.4941406 C9.20507812,11.0410156 9.4140625,11.4951172 9.83203125,11.8564453 C10.25,12.2177734 10.7578125,12.3984375 11.3554688,12.3984375 Z M11.8300781,10.9921875 C11.6425781,10.9921875 11.4882812,10.9365234 11.3671875,10.8251953 C11.2460938,10.7138672 11.1855469,10.5683594 11.1855469,10.3886719 C11.1855469,9.77148438 11.5292969,9.46289062 12.2167969,9.46289062 L12.2167969,9.46289062 L12.7910156,9.46289062 L12.7910156,10.4765625 C12.7207031,10.609375 12.6044922,10.7285156 12.4423828,10.8339844 C12.2802734,10.9394531 12.0761719,10.9921875 11.8300781,10.9921875 Z"/>
    </svg>
  `,
}

const rectangleOverlayTool = {
  name: "Rectangle overlay",
  tool: "shape",
  props: {shape: "rectangle", background: true, opacity: .4},
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5 0.5L0.5 0.5 0.5 15.5 15.5 15.5z"/>
      <path d="M15 1L15 15 1 15 1 1z"/>
      <path data-paper-data='{"skipFill":true}' fill="white" d="M14.5 1.5L14.5 14.5 1.5 14.5 1.5 1.5z"/>
      <path d="M15 .646L15.354 1 1 15.354.646 15zM15 3.646L15.354 4 4 15.354 3.646 15zM15 6.646L15.354 7 7 15.354 6.646 15zM15 9.646L15.354 10 10 15.354 9.646 15zM15 12.646L15.354 13 13 15.354 12.646 15zM12 .646L12.354 1 1 12.354.646 12zM9 .646L9.354 1 1 9.354.646 9zM6 .646L6.354 1 1 6.354.646 6zM3 .646L3.354 1 1 3.354.646 3z"/>
    </svg>
  `,
}

const rectangleBorderTool = {
  name: "Rectangle border",
  tool: "shape",
  props: {shape: "rectangle", bordered: true},
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5,0.5 L15.5,15.5 L0.5,15.5 L0.5,0.5 L15.5,0.5 Z M14.5,1.5 L1.5,1.5 L1.5,14.5 L14.5,14.5 L14.5,1.5 Z"/>
    </svg>
  `,
}

const circleOverlayTool = {
  name: "Circle overlay",
  tool: "shape",
  props: {shape: "circle", background: true, opacity: .4},
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M8,0.5 C12.1421356,0.5 15.5,3.85786438 15.5,8 C15.5,12.1421356 12.1421356,15.5 8,15.5 C3.85786438,15.5 0.5,12.1421356 0.5,8 C0.5,3.85786438 3.85786438,0.5 8,0.5 Z"/>
      <path data-paper-data='{"skipFill":true}' fill="white" d="M8,1.5 C4.41014913,1.5 1.5,4.41014913 1.5,8 C1.5,11.5898509 4.41014913,14.5 8,14.5 C11.5898509,14.5 14.5,11.5898509 14.5,8 C14.5,4.41014913 11.5898509,1.5 8,1.5 Z"/>
      <path d="M12.75 2.896L13.104 3.25 3.25 13.104 2.896 12.75zM14 4.646L14.354 5 5 14.354 4.646 14zM14.75 6.896L15.104 7.25 7.25 15.104 6.896 14.75zM11 1.646L11.354 2 2 11.354 1.646 11zM8.75.896L9.104 1.25 1.25 9.104.896 8.75z"/>
    </svg>
  `,
}

const circleBorderTool = {
  name: "Circle border",
  tool: "shape",
  props: {shape: "circle", bordered: true},
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M8,0.5 C12.1421356,0.5 15.5,3.85786438 15.5,8 C15.5,12.1421356 12.1421356,15.5 8,15.5 C3.85786438,15.5 0.5,12.1421356 0.5,8 C0.5,3.85786438 3.85786438,0.5 8,0.5 Z M8,1.5 C4.41014913,1.5 1.5,4.41014913 1.5,8 C1.5,11.5898509 4.41014913,14.5 8,14.5 C11.5898509,14.5 14.5,11.5898509 14.5,8 C14.5,4.41014913 11.5898509,1.5 8,1.5 Z"/>
    </svg>
  `,
}

const triangleOverlayTool = {
  name: "Triangle overlay",
  tool: "shape",
  props: {shape: "triangle", background: true, opacity: .4},
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.368 15.5 8 .764.632 15.5z"/>
      <path data-paper-data='{"skipFill":true}' fill="white" d="M9.785 6.569 10.549 8.097 4.146 14.5 2.25 14.5 2.646 13.708zM10.784 8.569 11.549 10.097 7.146 14.5 4.854 14.5zM11.784 10.569 12.549 12.097 10.146 14.5 7.854 14.5zM12.784 12.569 13.549 14.097 13.146 14.5 10.854 14.5zM8.785 4.569 9.549 6.097 3.354 12.292 5.646 7.708zM8 3 8.549 4.097 6.354 6.292z"/>
    </svg>
  `,
}

const triangleBorderTool = {
  name: "Triangle border",
  tool: "shape",
  props: {shape: "triangle", bordered: true},
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.368034,15.5 L8,0.763932023 L0.631966011,15.5 L15.368034,15.5 Z M8,3 L13.75,14.5 L2.25,14.5 L8,3 Z" />
    </svg>
  `,
}

const lineTool = {
  name: "Line (straight)",
  tool: "path",
  props: {type: "straight"},
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5918495 -0.352955256L16.3001505 0.352955256 0.354150514 16.3529553 -0.354150514 15.6470447z"></path>
    </svg>
  `,
}

const lineFreeHandTool = {
  name: "Line (free hand)",
  tool: "path",
  props: {},
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.5789571,0.184368353 L15.5475652,0.432961032 L15.4232689,0.917265089 C14.1196565,5.99661643 11.581764,8.66505525 7.84051752,8.78114421 L7.58356819,8.78510262 C4.30771165,8.78510262 2.24486101,10.8049175 1.33809121,14.9922091 L1.27225024,15.3103223 L1.17530685,15.8008343 L0.194282937,15.6069475 L0.291226325,15.1164355 C1.22499744,10.3917616 3.58728143,7.89980027 7.32086164,7.78896973 L7.58356819,7.78510262 C10.8647337,7.78510262 13.1149455,5.57263452 14.3649794,1.0069487 L14.4546608,0.668672411 L14.5789571,0.184368353 Z"></path>
    </svg>
  `,
}

const dashedLine = {
  name: "Dashed line (straight)",
  tool: "path",
  props: {type: "dashed-straight"},
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 9.293L6.707 10 1 15.707.293 15zM15 .293L15.707 1 10 6.707 9.293 6z"/>
    </svg>
  `,
}

const dashedFreeHandLine = {
  name: "Dashed line (free hand)",
  tool: "path",
  props: {type: "dashed"},
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.58257621,9.9110239 L3.29109316,10.6180776 C2.39865532,11.6392939 1.74942591,13.0927432 1.33809121,14.9922091 L1.27225024,15.3103223 L1.17530685,15.8008343 L0.194282937,15.6069475 L0.291226325,15.1164355 C0.734758506,12.8722614 1.50058568,11.1318225 2.58257621,9.9110239 Z M9.98447944,7.3124699 L10.7380126,8.06695547 C9.86984874,8.50900657 8.90378042,8.74815171 7.84051752,8.78114421 L7.58356819,8.78510262 C7.42860355,8.78510262 7.27635333,8.7896225 7.12681152,8.7986779 L6.22527306,7.89635379 C6.57627074,7.83607798 6.94148695,7.80023139 7.32086164,7.78896973 L7.58356819,7.78510262 C8.45667833,7.78510262 9.25678879,7.62844237 9.98447944,7.3124699 Z M14.5789571,0.184368353 L15.5475652,0.432961032 L15.4232689,0.917265089 C14.9736805,2.66902629 14.3772849,4.13403002 13.6353509,5.30647445 L12.9108881,4.58261234 C13.4925689,3.61465752 13.9769592,2.42417285 14.3649794,1.0069487 L14.4546608,0.668672411 L14.5789571,0.184368353 Z"/>
    </svg>
  `,
}

const paintTool = {
  name: "Change color",
  tool: "paint",
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.213 1.018a.572.572 0 0 1 .756.05.57.57 0 0 1 .057.746C15.085 3.082 12.044 7.107 9.6 9.55c-.71.71-1.42 1.243-1.952 1.596-.508.339-1.167.234-1.599-.197-.416-.416-.53-1.047-.212-1.543.346-.542.887-1.273 1.642-1.977 2.521-2.35 6.476-5.44 7.734-6.411z"/>
      <path d="M7 12a2 2 0 0 1-2 2c-1 0-2 0-3.5-.5s.5-1 1-1.5 1.395-2 2.5-2a2 2 0 0 1 2 2z"/>
    </svg>
  `,
}

const moveTool = {
  name: "Move",
  tool: "move",
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" d="M6.5 8a.5.5 0 0 0-.5-.5H1.5a.5.5 0 0 0 0 1H6a.5.5 0 0 0 .5-.5z"/>
      <path fill-rule="evenodd" d="M3.854 5.646a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0 0 .708l2 2a.5.5 0 0 0 .708-.708L2.207 8l1.647-1.646a.5.5 0 0 0 0-.708zM9.5 8a.5.5 0 0 1 .5-.5h4.5a.5.5 0 0 1 0 1H10a.5.5 0 0 1-.5-.5z"/>
      <path fill-rule="evenodd" d="M12.146 5.646a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L13.793 8l-1.647-1.646a.5.5 0 0 1 0-.708zM8 9.5a.5.5 0 0 0-.5.5v4.5a.5.5 0 0 0 1 0V10a.5.5 0 0 0-.5-.5z"/>
      <path fill-rule="evenodd" d="M5.646 12.146a.5.5 0 0 0 0 .708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L8 13.793l-1.646-1.647a.5.5 0 0 0-.708 0zM8 6.5a.5.5 0 0 1-.5-.5V1.5a.5.5 0 0 1 1 0V6a.5.5 0 0 1-.5.5z"/>
      <path fill-rule="evenodd" d="M5.646 3.854a.5.5 0 0 1 0-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8 2.207 6.354 3.854a.5.5 0 0 1-.708 0z"/>
    </svg>
  `,
}

const rotateTool = {
  name: "Rotate",
  tool: "rotate",
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" d="M2.854 7.146a.5.5 0 0 0-.708 0l-2 2a.5.5 0 1 0 .708.708L2.5 8.207l1.646 1.647a.5.5 0 0 0 .708-.708l-2-2zm13-1a.5.5 0 0 0-.708 0L13.5 7.793l-1.646-1.647a.5.5 0 0 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0 0-.708z"/>
      <path fill-rule="evenodd" d="M8 3a4.995 4.995 0 0 0-4.192 2.273.5.5 0 0 1-.837-.546A6 6 0 0 1 14 8a.5.5 0 0 1-1.001 0 5 5 0 0 0-5-5zM2.5 7.5A.5.5 0 0 1 3 8a5 5 0 0 0 9.192 2.727.5.5 0 1 1 .837.546A6 6 0 0 1 2 8a.5.5 0 0 1 .501-.5z"/>
    </svg>
  `,
}

const scaleTool = {
  name: "Scale",
  tool: "scale",
  props: {},
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344 0a.5.5 0 0 1 .707 0l4.096 4.096V11.5a.5.5 0 1 1 1 0v3.975a.5.5 0 0 1-.5.5H11.5a.5.5 0 0 1 0-1h2.768l-4.096-4.096a.5.5 0 0 1 0-.707zm0-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707zm-4.344 0a.5.5 0 0 1-.707 0L1.025 1.732V4.5a.5.5 0 0 1-1 0V.525a.5.5 0 0 1 .5-.5H4.5a.5.5 0 0 1 0 1H1.732l4.096 4.096a.5.5 0 0 1 0 .707z"/>
    </svg>
  `,
}
const copyTool = {
  name: "Copy",
  tool: "copy",
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 448 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M433.9 65.9l-51.9-51.9A48 48 0 0 0 348.1 0H176c-26.5 0-48 21.5-48 48v48H48c-26.5 0-48 21.5-48 48v320c0 26.5 21.5 48 48 48h224c26.5 0 48-21.5 48-48v-48h80c26.5 0 48-21.5 48-48V99.9a48 48 0 0 0 -14.1-33.9zM352 32.5a15.9 15.9 0 0 1 7.4 4.2l51.9 51.9A15.9 15.9 0 0 1 415.5 96H352V32.5zM288 464c0 8.8-7.2 16-16 16H48c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16h80v240c0 26.5 21.5 48 48 48h112v48zm128-96c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V48c0-8.8 7.2-16 16-16h144v72c0 13.2 10.8 24 24 24h72v240z"/>
    </svg>
  `,
}
const pasteTool = {
  name: "Paste",
  tool: "paste",
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 448 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path xmlns="http://www.w3.org/2000/svg" d="M336 64h-88.6c.4-2.6 .6-5.3 .6-8 0-30.9-25.1-56-56-56s-56 25.1-56 56c0 2.7 .2 5.4 .6 8H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48zM192 32c13.3 0 24 10.7 24 24s-10.7 24-24 24-24-10.7-24-24 10.7-24 24-24zm160 432c0 8.8-7.2 16-16 16H48c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16h48v20c0 6.6 5.4 12 12 12h168c6.6 0 12-5.4 12-12V96h48c8.8 0 16 7.2 16 16z"/>
    </svg>
  `,
}

const lineWidthTool = {
  name: "Line width",
  tool: "scale",
  props: {strokeOnly: true},
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 3.5A.5.5 0 0 1 .5 3h15a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H.5a.5.5 0 0 1-.5-.5v-2zm0 5A.5.5 0 0 1 .5 8h15a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H.5a.5.5 0 0 1-.5-.5v-1zm0 4a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5z"/>
    </svg>
  `
}

const undoTool = {
  name: "Undo",
  tool: "undo",
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" d="M7.854 4.646a.5.5 0 0 1 0 .708L5.207 8l2.647 2.646a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 0 1 .708 0z"/>
      <path fill-rule="evenodd" d="M4.5 8a.5.5 0 0 1 .5-.5h6.5a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z"/>
    </svg>
  `,
}

const redoTool = {
  name: "Redo",
  tool: "redo",
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" d="M8.146 4.646a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.793 8 8.146 5.354a.5.5 0 0 1 0-.708z"/>
      <path fill-rule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5H11a.5.5 0 0 1 0 1H4.5A.5.5 0 0 1 4 8z"/>
    </svg>
  `,
}

const eraseTool = {
  name: "Erase",
  tool: "erase",
  icon: `
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
      <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
    </svg>
  `,
}

function Toolbar({
  toolbars,
  activeTool,
  onToolChange,
  colors,
  activeToolColor,
  onToolColorChange,
  onUndo,
  onRedo,
}) {
  const toolbarRef = useRef()

  // Maps keyboard shortcuts to tools.
  const keyboardShortcuts = useMemo(() => ({
    t: () => onToolChange(textTool),
    o: () => {
      if (activeTool.tool === "shape" && activeTool.props.shape === "rectangle") {
        onToolChange(circleOverlayTool)
      }
      else {
        onToolChange(rectangleOverlayTool)
      }
    },
    l: () => onToolChange(lineTool),
    p: () => {
      onToolChange(paintTool)
      if (activeTool.tool === "paint") {
        const index = colors.findIndex(color => color.color === activeToolColor) + 1
        onToolColorChange(colors[index >= colors.length ? 0 : index].color)
      }
    },
    m: () => onToolChange(moveTool),
    r: () => onToolChange(rotateTool),
    s: () => onToolChange(scaleTool),
    w: () => onToolChange(lineWidthTool),
    z: onUndo,
    y: onRedo,
    e: () => onToolChange(eraseTool),
    c: () => onToolChange(copyTool),
    v: () => onToolChange(pasteTool),
  }), [
    activeTool,
    onToolChange,
    colors,
    activeToolColor,
    onToolColorChange,
    onUndo,
    onRedo,
  ])

  // Triggers keyboard shortcuts on keystrokes within toolbar.
  const triggerKeyboardShortcut = useCallback(event => {
    if (event.key in keyboardShortcuts) {
      keyboardShortcuts[event.key]()
    }
  }, [keyboardShortcuts])

  // Triggers keyboard shortcuts on keystrokes within page, IF target element
  // is body, thus ignoring key strokes on input fields and other things that
  // might have focus.
  const bodyTriggerKeyboardShortcut = useCallback(event => {
    if (event.target.nodeName === "BODY") {
      triggerKeyboardShortcut(event)
    }
  }, [triggerKeyboardShortcut])

  // Sets up keyboard shortcut event listeners.
  useEffect(() => {
    const ref = toolbarRef.current
    ref.addEventListener("keyup", triggerKeyboardShortcut)
    document.body.addEventListener("keyup", bodyTriggerKeyboardShortcut)

    return () => {
      ref.removeEventListener("keyup", triggerKeyboardShortcut)
      document.body.removeEventListener("keyup", bodyTriggerKeyboardShortcut)
    }
  }, [triggerKeyboardShortcut, bodyTriggerKeyboardShortcut])

  return (
    <ToolbarContainer ref={toolbarRef} className="drill-maker__toolbar">
      {toolbars.map((tools, index) => (
        <ToolGroup
          key={index}
          tools={tools}
          activeTool={activeTool}
          activeToolColor={activeToolColor}
          onToolChange={onToolChange}
          onToolColorChange={onToolColorChange}
        />
      ))}
      <ToolGroup
        tools={[textTool]}
        activeTool={activeTool}
        activeToolColor={activeToolColor}
        onToolChange={onToolChange}
        onToolColorChange={onToolColorChange}
      />
      <ToolGroup
        tools={[
          rectangleOverlayTool, rectangleBorderTool,
          circleOverlayTool, circleBorderTool,
          triangleOverlayTool, triangleBorderTool,
          lineTool, lineFreeHandTool,
          dashedLine, dashedFreeHandLine,
        ]}
        activeTool={activeTool}
        activeToolColor={activeToolColor}
        onToolChange={onToolChange}
        onToolColorChange={onToolColorChange}
      />
      <PaintToolGroup
        tool={paintTool}
        isActive={activeTool.tool === "paint"}
        colors={colors}
        activeToolColor={activeToolColor}
        onToolChange={onToolChange}
        onToolColorChange={onToolColorChange}
      />
      <ToolGroup
        tools={[moveTool, rotateTool, scaleTool, lineWidthTool]}
        activeTool={activeTool}
        activeToolColor={activeToolColor}
        onToolChange={onToolChange}
        onToolColorChange={onToolColorChange}
      />
      <ToolbarGroup className="drill-maker__toolbar-group">
        <ToolGroup
          tools={[undoTool]}
          onToolChange={onUndo}
        />
        <ToolGroup
          tools={[redoTool]}
          onToolChange={onRedo}
        />
        <ToolGroup
          tools={[eraseTool]}
          activeTool={activeTool}
          onToolChange={onToolChange}
        />
      </ToolbarGroup>
    </ToolbarContainer>
  )
}

function ToolGroup({tools, activeTool, onToolChange, onToolColorChange}) {
  const [lastTool, setLastTool] = useState(tools[0])
  const [open, setOpen] = useState(false)
  const touchDevice = "ontouchstart" in window

  // Responds to tool changes.
  useEffect(() => {
    // If active tool in tools, set last tool and change color.
    if (activeTool && tools.filter(tool => tool.name === activeTool.name).length) {
      setLastTool(activeTool)
      if (onToolColorChange) {
        onToolColorChange(activeTool.color || "black")
      }
    }

    // Otherwise, close the dropdown.
    else {
      setOpen(false)
    }
  }, [tools, activeTool, onToolColorChange])

  // When a tool is clicked, toggle the dropdown and activate the tool.
  function handleClick(tool) {
    setOpen(!open)
    onToolChange(tool)
  }

  return (
    <ToolGroupContainer
      className={"drill-maker__tool-group" + (open ? " drill-maker__tool-group--open" : "")}
      onMouseLeave={() => setOpen(false)}
    >
      <ToolTippy content={lastTool.name} placement="right-start" offset={[-10, 10]} disabled={touchDevice}>
        <Tool
          className={"drill-maker__tool drill-maker__tool--last" + (activeTool && lastTool.name === activeTool.name ? " drill-maker__tool--active" : "")}
          toolColor={lastTool.color || "black"}
          open={open}
          active={activeTool && lastTool.name === activeTool.name}
          onClick={() => handleClick(lastTool)}
          onMouseEnter={() => setOpen(true)}
          type="button"
          dangerouslySetInnerHTML={{__html: lastTool.icon}}
        />
      </ToolTippy>
      {open && tools.length > 1 &&
        <ToolGroupDropdown className="drill-maker__tool-group-dropdown">
          {tools.map(tool => (
            <ToolTippy key={tool.name} content={tool.name} placement="auto" disabled={touchDevice}>
              <Tool
                key={tool.name}
                className="drill-maker__tool"
                toolColor={tool.color || "black"}
                open={open}
                onClick={() => handleClick(tool)}
                type="button"
                dangerouslySetInnerHTML={{__html: tool.icon}}
              />
            </ToolTippy>
          ))}
        </ToolGroupDropdown>
      }
    </ToolGroupContainer>
  )
}

function PaintToolGroup({tool, isActive, colors, activeToolColor, onToolChange, onToolColorChange}) {
  const [open, setOpen] = useState(false)
  const touchDevice = "ontouchstart" in window

  // If this tool isn't active, close the dropdown.
  useEffect(() => {
    if (!isActive) {
      setOpen(false)
    }
  }, [isActive])

  // When a tool is clicked, toggle the dropdown and activate the tool.
  function handleClick(color) {
    setOpen(!open)
    onToolChange(tool)
    onToolColorChange(color)
  }

  return (
    <ToolGroupContainer
      className={"drill-maker__tool-group" + (open ? " drill-maker__tool-group--open" : "")}
      onMouseLeave={() => setOpen(false)}
    >
      <ToolTippy content={tool.name} placement="right-start" offset={[-10, 10]} disabled={touchDevice}>
        <Tool
          className={"drill-maker__tool drill-maker__tool--last" + (isActive ? " drill-maker__tool--active" : "")}
          toolColor={isActive ? activeToolColor : "black"}
          open={open}
          active={isActive}
          onClick={() => handleClick(activeToolColor)}
          onMouseEnter={() => setOpen(true)}
          type="button"
          dangerouslySetInnerHTML={{__html: tool.icon}}
        />
      </ToolTippy>
      {open &&
        <ToolGroupDropdown className="drill-maker__tool-group-dropdown">
          {colors.map(color => (
            <ToolTippy key={color.name} content={color.name} placement="auto" disabled={touchDevice}>
              <Tool
                className="drill-maker__tool"
                backgroundColor={color.color}
                open={open}
                onClick={() => handleClick(color.color)}
                type="button"
              />
            </ToolTippy>
          ))}
        </ToolGroupDropdown>
      }
    </ToolGroupContainer>
  )
}

const ToolbarContainer = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
`

const ToolbarGroup = styled.div`
  display: flex;
  justify-content: center;
`

const ToolGroupContainer = styled.div`
  margin: 2px 1px;
  position: relative;
`

const ToolGroupDropdown = styled.div`
  display: flex;
  position: absolute;
  bottom: 100%;
  left: 0;
  flex-direction: column-reverse;
  z-index: 0;
  border-bottom: 1px solid #9EA3A7;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    bottom: -44px;
    left: 0;
    right: 0;
    z-index: -1;
    pointer-events: none;
    box-shadow: 0 8px 16px rgba(0, 0, 0, .2);
  }
`

const Tool = styled.button`
  cursor: pointer;
  background: ${props => props.backgroundColor || (props.open ? "#d3d9de" : (props.active ? "#e6e6e6" : "none"))};
  color: ${props => props.toolColor};
  padding: 8px;
  border: none;
  outline: none;
  margin: 0;
  font-size: 28px;
  width: 44px;
  height: 44px;
  display: flex;

  &:focus {
    outline: none;
  }

  &:hover {
    background-color: ${props => props.backgroundColor || "#c2cad0"} !important;
  }
`

const ToolTippy = styled(Tippy)`
  box-shadow: 0 1px 2px rgba(255, 255, 255, .75);
`

export default Toolbar
