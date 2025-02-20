import React, { useRef, useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Canvas from './paper.js';
import VariantSwitcher from './VariantSwitcher';
import Toolbar from './Toolbar';
import { createPortal } from 'react-dom';
import ReactDOM from 'react-dom';

// Add this at the top of your file, before the App component
console.log = (function(old_function) {
  return function(...args) {
    old_function.apply(this, args);
    
    // Store logs in localStorage
    const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
    logs.push(args.join(' '));
    localStorage.setItem('debug_logs', JSON.stringify(logs));
  };
})(console.log);

// Add this to detect unload events
window.onbeforeunload = function(e) {
  console.log('Before unload detected');
  console.log('Unload event:', e);
  return null;
};

// Add this ShareModal component outside the App component
const showGlobalModal = (url) => {
  const modalContainer = document.createElement('div');
  modalContainer.id = 'global-modal';
  document.body.appendChild(modalContainer);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      const copyButton = document.getElementById('copyButton');
      if (copyButton) {
        copyButton.textContent = '✓';
        setTimeout(() => {
          copyButton.textContent = 'Copy';
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  ReactDOM.render(
    <Modal>
      <ModalContent>
        <h3>Share Your Play</h3>
        <p>Copy this link to share your play:</p>
        <ShareUrlContainer>
          <ShareUrl>{url}</ShareUrl>
          <CopyButton 
            id="copyButton"
            onClick={handleCopyUrl}
            type="button"
          >
            Copy
          </CopyButton>
        </ShareUrlContainer>
      </ModalContent>
    </Modal>,
    modalContainer
  );
};

// Add this at the top of your file, before the App component
const preventFormSubmissions = () => {
  // Prevent all form submissions
  document.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);  // Use capture phase

  // Find and disable the specific form
  const form = document.getElementById('form');
  if (form) {
    form.onsubmit = null;
    form.action = 'javascript:void(0);';
    form.method = 'GET';  // Change to GET to prevent POST behavior
  }
};

// Add these styled components at the bottom of the file
const ShareUrl = styled.div`
  flex: 1;
  word-break: break-all;
  margin-right: 8px;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  color: #2196F3;
  
  &:hover {
    color: #1976D2;
  }
`;

const ShareButton = styled.span`
  display: inline-block;
  cursor: pointer;
  user-select: none;
  padding: 6px 12px;
  margin: 8px 4px 0;
  background-color: #2196F3;
  border: 1px solid #2196F3;
  color: white;
  border-radius: 4px;
  font-family: inherit;
  font-size: inherit;
  line-height: 1.5;
  text-align: center;
  text-decoration: none;

  &:hover {
    background-color: #1976D2;
    border-color: #1976D2;
  }
`;

// Rename the styled component to CanvasContainer
const CanvasContainer = styled.div`
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
`;

// Add this Modal component
const Modal = ({ children }) => {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
};

// Add a function to generate a random URL string
const generateRandomString = () => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Define the App component
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
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingPage, setIsCreatingPage] = useState(false);

  // Add this useRef to store the canvas instance
  const paperInstance = useRef(null);

  console.log('App component rendering');

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

  // Update the initialization useEffect to only run once
  useEffect(() => {
    console.log('Paper.js initialization effect running');
    
    if (!initialized) {
      function initialize() {
        console.log('Initializing paper.js');
        var newPaper = new Canvas();
        setPaper(newPaper);
        newPaper.init(canvasRef.current, mode.strokeWidth, setCanvasJSON);
        setInitialized(true);
      }
      
      if (document.readyState === "complete") {
        console.log('Document ready, initializing immediately');
        initialize();
      } else {
        console.log('Document not ready, waiting for load event');
        window.addEventListener('load', initialize, { once: true }); // Will only run once
      }
    }
  }, [initialized, mode.strokeWidth]); // Keep these dependencies

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

  // Add this useEffect to check for stored logs
  useEffect(() => {
    // Check for stored logs after reload
    const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
    if (logs.length > 0) {
      console.log('Previous logs before reload:', logs);
      localStorage.removeItem('debug_logs');
    }
  }, []);

  // Add this useEffect to cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup function
      if (showShareModal) {
        setShowShareModal(false);
      }
      if (isSharing) {
        setIsSharing(false);
      }
    };
  }, []);

  // Add this useEffect to prevent reinitialization during sharing
  useEffect(() => {
    if (isModalOpen) {
      // Prevent any reinitialization
      window.onbeforeunload = null;
      window.onunload = null;
      window.onload = null;
    }
  }, [isModalOpen]);

  // Add this useEffect to prevent form submissions when component mounts
  useEffect(() => {
    preventFormSubmissions();
    
    // Also prevent form submissions on the window level
    window.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);
    
    return () => {
      window.removeEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, true);
    };
  }, []);

  // Update handleShareClick to include .html extension
  const handleShareClick = () => {
    const urlPath = generateRandomString();
    // Use environment variable or default to localhost
    const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:3001';
    const previewUrl = `${baseUrl}/plays/${urlPath}.html`;
    setShareUrl(previewUrl);
    setIsModalOpen(true);
  };

  // Update handleCreatePage to handle the page creation
  const handleCreatePage = async () => {
    try {
      setIsCreatingPage(true);
      setErrorMessage('');

      const playData = {
        title,
        description,
        imageData: canvasRef.current.toDataURL('image/png'),
        canvasJSON,
        urlPath: shareUrl.split('/plays/')[1].replace('.html', '') // Remove .html when sending to server
      };
      
      console.log('Sending request...');
      const response = await fetch('http://localhost:3001/api/plays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playData)
      });

      console.log('Got response');
      const result = await response.json();
      console.log('Parsed result:', result);
      
      if (result.success) {
        // Save the complete state before reload
        localStorage.setItem('lastDrawing', JSON.stringify({
          title,
          description,
          canvasJSON,
          imageData: canvasRef.current.toDataURL('image/png')
        }));
        
        // Wait for the page to be created
        await navigator.clipboard.writeText(shareUrl);
        
        setIsModalOpen(false);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setErrorMessage('Failed to create page. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Failed to create page. Please try again.');
    } finally {
      setIsCreatingPage(false);
    }
  };

  // Add this useEffect to restore the drawing after reload
  useEffect(() => {
    if (initialized) {
      const savedDrawing = localStorage.getItem('lastDrawing');
      if (savedDrawing) {
        const data = JSON.parse(savedDrawing);
        setTitle(data.title);
        setDescription(data.description);
        if (data.canvasJSON && paper.importJSON) {
          paper.importJSON(JSON.stringify(data.canvasJSON));
        }
        localStorage.removeItem('lastDrawing'); // Clean up after restore
      }
    }
  }, [initialized]); // Only run when paper.js is initialized

  return (
    <>
      <VariantSwitcher
        mode={mode}
        activeVariant={activeVariant}
        onVariantChange={variant => setActiveVariant(variant)}
      />
      <CanvasContainer ratio={mode.ratio} className="drill-maker__canvas">
        <canvas ref={canvasRef} keepalive="true" resize="true" onMouseEnter={() => { paper.setActive && paper.setActive() }}></canvas>
      </CanvasContainer>
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
        <Form className="drill-maker__form" id="form">
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
                <i className="fas fa-download"></i> PNG
              </button>
              <button onClick={handleDownloadPDF} type="button" className={buttonClass}>
                <i className="fas fa-file-pdf"></i> PDF
              </button>
              <button 
                onClick={handleShareClick}
                type="button"
                className={buttonClass}
                style={{ 
                  backgroundColor: '#00cc44',
                  borderColor: '#00cc44',
                  color: 'white'
                }}
              >
                <i className="fas fa-share-alt"></i> Share Play
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
      {isModalOpen && (
        <Modal>
          <ModalContent>
            <h3>Share Your Play</h3>
            <p>Your play will be available at:</p>
            <ShareUrlContainer>
              <ShareUrl>{shareUrl}</ShareUrl>
            </ShareUrlContainer>
            {errorMessage && (
              <ErrorMessage>{errorMessage}</ErrorMessage>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
              <button 
                onClick={handleCreatePage}
                disabled={isCreatingPage}
                type="button"
                className={buttonClass}
                style={{ 
                  backgroundColor: '#00cc44',
                  borderColor: '#00cc44',
                  color: 'white'
                }}
              >
                {isCreatingPage ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Create Page and Copy URL
                  </>
                )}
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                type="button"
                className={buttonClass}
                style={{ 
                  backgroundColor: '#ffffff',
                  borderColor: '#cccccc',
                  color: '#333333'
                }}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </>
  )
}

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

  button, 
  a,
  .drill-maker__actions button,
  .drill-maker__actions label {
    background-color: #2196F3;
    border-color: #2196F3;
    color: white;
  }

  button:hover, 
  a:hover,
  .drill-maker__actions button:hover,
  .drill-maker__actions label:hover {
    background-color: #1976D2;
    border-color: #1976D2;
  }

  /* Specific button colors */
  button[title="Erase"] {
    background-color: #ff4444 !important;
    border-color: #ff4444 !important;
  }

  button[title="Erase"]:hover {
    background-color: #cc0000 !important;
    border-color: #cc0000 !important;
  }

  button:has(i.fa-share-alt) {
    background-color: #00cc44 !important;
    border-color: #00cc44 !important;
  }

  button:has(i.fa-share-alt):hover {
    background-color: #009933 !important;
    border-color: #009933 !important;
  }
`

const ImportInput = styled.input`
  visibility: hidden;
  width: 0;
  height: 0;
`

const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`

const ShareUrlContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 15px 0;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #ddd;
`

const ErrorMessage = styled.div`
  color: #f44336;
  margin: 10px 0;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
`;

// Export the App component
export default App;