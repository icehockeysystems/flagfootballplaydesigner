import { useRef, useState, useEffect, useCallback } from "react"
import styled from "styled-components"
import { jsPDF } from "jspdf"
import 'jspdf-autotable'
import { useBeforeunload } from "react-beforeunload"
import Paper from "./paper.js"
import VariantSwitcher from "./VariantSwitcher"
import Toolbar from "./Toolbar"

function App({
  mode,
  showForm,
  showDownloadButtons,
  showExportImportButtons,
  formInputClass,
  buttonClass,
  onChange,
  defaultData,
  defaultLogo,
  promptBeforeUnload,
}) {
  const canvasRef = useRef()
  const importDataRef = useRef()
  const importLogoRef = useRef()
  const [initialized, setInitialized] = useState(canvasRef.current)
  const [activeVariant, setActiveVariant] = useState()
  const [activeTool, setActiveTool] = useState(mode.toolbars[0][0])
  const [activeToolColor, setActiveToolColor] = useState("black")
  const [canvasJSON, setCanvasJSON] = useState()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [changed, setChanged] = useState(false)
  const [showEraseButton, setShowEraseButton] = useState(false)
  const [logo, setLogo] = useState(defaultLogo)
  const touchDevice = "ontouchstart" in window
  const [paper, setPaper] = useState({})

  // Exports title, description, and canvas data as JSON.
  const exportData = useCallback(() => {
    return {
      title: title,
      description: description,
      canvas: canvasJSON,
    }
  }, [title, description, canvasJSON])

  // Imports title, description, and canvas data from JSON.
  const importData = useCallback((json, _canvas) => {
    const imported = JSON.parse(json)
    const _paper = _canvas || paper

    setTitle(imported.title)
    setDescription(imported.description)

    if (_paper.importJSON) {
      _paper.importJSON(JSON.stringify(imported.canvas))
    }
  }, [])

  // Find and set active variant.
  const findAndSetActiveVariant = useCallback((_canvas, _build) => {
    const _paper = _canvas || paper
    const _mode = _build || mode

    let variant = _paper.findActiveVariant(_mode.variants);
    if (variant) {
      setActiveVariant(variant)
    }
  }, [])

  // Downloads PNG.
  function handleDownloadImage() {
    let link = document.createElement("a")
    link.download = (title || "Drill") + ".png"
    link.href = canvasRef.current.toDataURL("image/png")
    link.click()
    setChanged(false)
  }

  // Downloads PDF. Letter document is 8.5"x11", 72ppi (points per inch).
  function handleDownloadPDF() {
    const paperWidth = 8.5
    const paperHeight = 11
    const margin = .75
    const contentWidth = paperWidth - margin - margin
    const ppi = 72
    const logoHeight = 1
    const titleFontSize = 24
    const subheadingFontSize = 16
    const descriptionFontSize = 10
    const footerFontSize = 10
    const underlineHeight = 2 / ppi
    let workingY = .5

    const doc = new jsPDF({
      orientation: "p",
      unit: "in",
      format: "letter",
      compress: true
    })

    try {
      // Logo.
      if (mode.pdf.logo) {
        doc.addImage(mode.pdf.logo, "JPEG", paperWidth - margin - logoHeight, workingY, logoHeight, logoHeight)
        workingY += logoHeight + .25
      }

      // Title section.
      if (title) {
        doc.setFontSize(titleFontSize)
        doc.text(doc.splitTextToSize(title, contentWidth), margin, workingY, {
          baseline: "top",
        })
        workingY += (titleFontSize / ppi) + (5 / ppi)

        doc.setLineWidth(underlineHeight)
        doc.setDrawColor(37, 62, 86)
        doc.line(margin, workingY, paperWidth - margin, workingY)
        workingY += underlineHeight + .25
      }

      // Canvas image - create a white background version
      const imageHeight = contentWidth * mode.ratio
      const canvas = canvasRef.current
      
      // Create a temporary canvas with white background
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext('2d')
      
      // Fill with white background
      tempCtx.fillStyle = '#FFFFFF'
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
      
      // Draw the original canvas content on top
      tempCtx.drawImage(canvas, 0, 0)
      
      // Convert to JPEG with white background
      const imgData = tempCanvas.toDataURL('image/jpeg', 1.0).split(',')[1]
      
      doc.addImage({
        imageData: imgData,
        format: 'JPEG',
        x: margin,
        y: workingY,
        width: contentWidth,
        height: imageHeight
      })
      
      // Clean up
      tempCanvas.remove()
      
      workingY += imageHeight + .25

      // Description and footer sections remain the same
      if (description) {
        doc.setFontSize(subheadingFontSize)
        doc.text("Description", margin, workingY, {
          baseline: "top",
        })
        workingY += (subheadingFontSize / ppi) + (5 / ppi)

        doc.setLineWidth(underlineHeight)
        doc.setDrawColor(37, 62, 86)
        doc.line(margin, workingY, paperWidth - margin, workingY)
        workingY += underlineHeight + .25

        doc.setFontSize(descriptionFontSize)
        doc.text(doc.splitTextToSize(description, contentWidth), margin, workingY, {
          baseline: "top",
          lineHeightFactor: 1.4,
        })
      }

      doc.setFontSize(footerFontSize)
      doc.text(mode.pdf.footer, paperWidth / 2, paperHeight - margin, {
        baseline: "bottom",
        align: "center",
      })

      doc.save((title || "Drill") + ".pdf")
      setChanged(false)
    } catch (error) {
      console.error('PDF Generation Error:', error)
      alert('There was an error generating the PDF. Please try again.')
    }
  }

  // Downloads JSON.
  function handleExport() {
    let link = document.createElement("a")
    link.download = (title || "Drill") + ".json"
    link.href = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData()))
    link.click()
    setChanged(false)
  }

  // Imports JSON data and empties file input for next import.
  function handleImportData() {
    let reader = new FileReader()
    reader.onload = event => importData(event.target.result)
    reader.readAsText(importDataRef.current.files[0])
    importDataRef.current.value = null
  }

  // Imports logo image and empties file input for next import.
  function handleImportLogo() {
    let reader = new FileReader()
    reader.onload = event => setLogo(event.target.result)
    reader.readAsDataURL(importLogoRef.current.files[0])
    importLogoRef.current.value = null
  }

  // Erases drawing.
  function handleErase() {
    if (window.confirm("Are you sure you want to erase this drawing? This cannot be undone.")) {
      paper.erase()
    }
  }

  // Initializes paper.js. Do this after page finishes loading to ensure that
  // the responsive canvas is the correct size.
  useEffect(() => {
    function initialize() {
      var newPaper = new Paper();
      setPaper(newPaper);
      newPaper.init(canvasRef.current, mode.strokeWidth, setCanvasJSON)
      setInitialized(true)
    }
    if (document.readyState === "complete") {
      initialize()
    }
    else {
      window.addEventListener('load', initialize)
    }
  }, [mode.strokeWidth])

  // Activates tool.
  useEffect(() => {
    if (initialized) {
      paper.activateTool(activeTool.tool, activeTool.props || {}, activeToolColor, activeTool.icon)
    }
  }, [initialized, activeTool, activeToolColor, paper])

  // Tracks whether or not the canvas is changed. Executes onChange prop after
  // stuff changes. If everything is in its initial state, then send null
  // values.
  useEffect(() => {
    const _changed = initialized && (title || description || !paper.isEmpty())
    if (onChange) {
      if (_changed) {
        onChange(exportData(), canvasRef.current.toDataURL("image/png"), canvasRef.current)
      }
      else {
        onChange(null, null, canvasRef.current)
      }
    }
    setChanged(_changed)
  }, [initialized, onChange, title, description, exportData])

  // Imports default data.
  useEffect(() => {
    if (initialized) {
      if (defaultData) {
        importData(defaultData, paper)
      }
      findAndSetActiveVariant(paper, mode)
    }
  }, [initialized, defaultData, importData])

  // Changes background image.
  useEffect(() => {
    if (initialized && activeVariant) {
      paper.setBackground(activeVariant.background, activeVariant.logo, mode.logo, logo, activeVariant.name)
    }
  }, [initialized, activeVariant, mode, logo, paper])

  // Tracks whether or not to show the erase button.
  useEffect(() => {
    setShowEraseButton(initialized && !paper.isEmpty())
  }, [initialized, exportData])

  // Prompt user before leaving if component's state is changed.
  useBeforeunload(event => {
    if (changed && promptBeforeUnload) {
      return "Are you sure you want to leave this page? You may lose unsaved changes."
    }
  })

  return (
    <>
      <VariantSwitcher
        mode={mode}
        activeVariant={activeVariant}
        onVariantChange={variant => setActiveVariant(variant)}
      />
      <Canvas ratio={mode.ratio} className="drill-maker__canvas">
        <canvas ref={canvasRef} keepalive="true" resize="true" onMouseEnter={() => { paper.setActive && paper.setActive() }}></canvas>
      </Canvas>
      {touchDevice &&
        <ActiveToolDescription className="drill-maker__active-tool-description">
          {activeTool.name}
        </ActiveToolDescription>
      }
      <Toolbar
        toolbars={mode.toolbars}
        activeTool={activeTool}
        onToolChange={tool => setActiveTool(tool)}
        colors={mode.colors}
        activeToolColor={activeToolColor}
        onToolColorChange={color => setActiveToolColor(color)}
        onUndo={() => { paper.undo() }}
        onRedo={() => { paper.redo() }}
      />
      {showForm &&
        <Form className="drill-maker__form">
          <input
            type="text"
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="Play Name"
            className={formInputClass}
          />
          <textarea
            value={description}
            onChange={event => setDescription(event.target.value)}
            placeholder="Play Description"
            className={formInputClass}
            rows="4"
          ></textarea>
        </Form>
      }
      {(showDownloadButtons || showEraseButton) &&
        <Actions className="drill-maker__actions">
          {showDownloadButtons &&
            <>
              <button onClick={handleDownloadImage} type="button" className={buttonClass}>
                Download PNG
              </button>
              <button onClick={handleDownloadPDF} type="button" className={buttonClass}>
                Download PDF
              </button>
            </>
          }
          {showEraseButton &&
            <button onClick={handleErase} type="button" className={buttonClass}>
              Erase Drawing
            </button>
          }
        </Actions>
      }
    </>
  )
}

const Canvas = styled.div`
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  overflow: hidden;
  margin-bottom: 16px;

  &:before {
    display: block;
    content: "";
    padding-top: ${props => props.ratio * 100}%;
  }

  canvas {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
`

const Form = styled.div`
  margin-top: 16px;

  input, textarea {
    margin-bottom: 16px;
  }
`

const ActiveToolDescription = styled.div`
  text-align: center;
  font-family: Roboto, Arial, sans-serif;
  font-size: 16px;
  line-height: 20px;
  margin-bottom: 8px;
`

const Actions = styled.div`
  margin-top: 12px;
  text-align: center;

  button, label {
    margin: 8px 4px 0;
  }
`

const ImportInput = styled.input`
  visibility: hidden;
  width: 0;
  height: 0;
`

export default App
