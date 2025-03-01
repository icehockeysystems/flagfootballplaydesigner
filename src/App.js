import React, { useRef, useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Canvas from './paper.js';
import VariantSwitcher from './VariantSwitcher';
import Toolbar from './Toolbar';
import { createPortal } from 'react-dom';
import ReactDOM from 'react-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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

// Add this near your other styled components
const QuillWrapper = styled.div`
  .ql-container {
    min-height: 120px;
    font-size: 16px;
    font-family: inherit;
  }
  
  .ql-toolbar {
    background-color: #f9f9f9;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }
  
  .ql-editor {
    min-height: 120px;
    background-color: white;
  }
`;

const InfoIcon = styled.span`
  color: #666;
  cursor: help;
  display: inline-flex;
  align-items: center;
  
  &:hover .tooltip {
    visibility: visible;
    opacity: 1;
  }
`

const Tooltip = styled.span`
  visibility: hidden;
  background-color: #333;
  color: white;
  text-align: center;
  padding: 8px 12px;
  border-radius: 4px;
  position: absolute;
  z-index: 1;
  font-size: 0.85em;
  font-style: normal;
  opacity: 0;
  transition: opacity 0.2s;
  white-space: nowrap;
  margin-left: 8px;
  
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 100%;
    margin-top: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent #333 transparent transparent;
  }
`

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
  const [backgroundImage, setBackgroundImage] = useState(null)
  const uploadImageRef = useRef()
  const [uploadError, setUploadError] = useState('')

  // Add this useRef to store the canvas instance
  const paperInstance = useRef(null);

  // Add this constant for max file size (2MB)
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

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
        doc.setFontSize(subheadingFontSize);
        doc.text("Description", margin, workingY, {
          baseline: "top",
        });
        workingY += (subheadingFontSize / ppi) + (5 / ppi);

        doc.setLineWidth(underlineHeight);
        doc.setDrawColor(37, 62, 86);
        doc.line(margin, workingY, paperWidth - margin, workingY);
        workingY += underlineHeight + .25;

        doc.setFontSize(descriptionFontSize);
        
        // Convert HTML to plain text for PDF
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = description;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';
        
        doc.text(doc.splitTextToSize(plainText, contentWidth), margin, workingY, {
          baseline: "top",
          lineHeightFactor: 1.4,
        });
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
    if (!initialized) {
      function initialize() {
        var newPaper = new Canvas();
        setPaper(newPaper);
        newPaper.init(canvasRef.current, mode.strokeWidth, setCanvasJSON);
        setInitialized(true);
      }
      
      if (document.readyState === "complete") {
        initialize();
      } else {
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

  // Update handleShareClick to include full domain
  const handleShareClick = () => {
    // Generate the random string once and use it consistently
    const urlPath = generateRandomString();
    const fullUrl = `${window.location.origin}/plays/${urlPath}.html`;
    setShareUrl(fullUrl);
    setIsModalOpen(true);
  };

  // Update handleCreatePage to handle the page creation
  const handleCreatePage = async () => {
    try {
      setIsCreatingPage(true);
      setErrorMessage('');

      // Use the urlPath from the shareUrl instead of generating a new one
      const urlPath = shareUrl.split('/plays/')[1].replace('.html', '');

      const playData = {
        title,
        description,
        imageData: canvasRef.current.toDataURL('image/png'),
        canvasJSON,
        urlPath: urlPath  // Use the same urlPath
      };
      
      // Save current drawing state before making the request
      localStorage.setItem('lastDrawing', JSON.stringify({
        title,
        description,
        canvasJSON
      }));
      
      const response = await fetch('/api/plays.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const fullUrl = `${window.location.origin}/plays/${result.playId}.html`;
        setShareUrl(fullUrl);
        await navigator.clipboard.writeText(fullUrl);
        setIsModalOpen(false);
        setTimeout(() => {
          window.location.href = '/?success=true';  // Add success parameter
        }, 500);
      } else {
        setErrorMessage(result.error || 'Failed to create page. Please try again.');
        // Remove saved drawing if there was an error
        localStorage.removeItem('lastDrawing');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Failed to create page. Please try again.');
      // Remove saved drawing if there was an error
      localStorage.removeItem('lastDrawing');
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

  // Update the upload handler
  const handleUploadBackground = (event) => {
    const file = event.target.files[0]
    setUploadError(''); // Clear any previous errors
    
    if (file) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setUploadError('File size exceeds 2MB limit');
        uploadImageRef.current.value = null;
        return;
      }

      // Check file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Please upload a PNG, JPEG, GIF, or WebP file');
        uploadImageRef.current.value = null;
        return;
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setBackgroundImage(e.target.result)
        if (paper.setCustomBackground) {
          paper.setCustomBackground(e.target.result)
        }
      }
      reader.onerror = () => {
        setUploadError('Error reading file');
      }
      reader.readAsDataURL(file)
    }
    uploadImageRef.current.value = null
  }

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
          <ImportInput
            ref={uploadImageRef}
            type="file"
            accept=".png,.jpg,.jpeg,.gif,.webp"
            onChange={handleUploadBackground}
          />
          <ButtonContainer>
            <UploadButton 
              onClick={() => uploadImageRef.current.click()}
              type="button"
            >
              <i className="fas fa-image"></i> Add Team Logo
            </UploadButton>
            <InfoIcon>
              <i className="fas fa-info-circle"></i>
              <Tooltip className="tooltip">Max 2MB, PNG/JPEG/GIF/WebP</Tooltip>
            </InfoIcon>
          </ButtonContainer>
          {uploadError && (
            <ErrorMessage style={{ marginBottom: '16px' }}>
              {uploadError}
            </ErrorMessage>
          )}
          <input
            type="text"
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="Play Name"
            className={formInputClass}
          />
          <QuillWrapper>
            <ReactQuill
              value={description}
              onChange={setDescription}
              placeholder="Play Description"
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  [{ 'color': [] }],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['clean']
                ]
              }}
            />
          </QuillWrapper>
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
                  color: 'white',
                  fontWeight: 'bold'
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
  margin-top: 8px;

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

  /* Update share button color to match upload button green */
  button:has(i.fa-share-alt) {
    background-color: #4CAF50 !important;
    border-color: #4CAF50 !important;
  }

  button:has(i.fa-share-alt):hover {
    background-color: #45a049 !important;
    border-color: #45a049 !important;
  }
`

const ImportInput = styled.input`
  visibility: hidden;
  width: 0;
  height: 0;
`

const UploadButton = styled.button`
  background-color: #4CAF50;
  border: 1px solid #4CAF50;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  line-height: 1.5;
  display: inline-flex;
  align-items: center;
  
  i {
    margin-right: 8px;
  }
`

const ButtonContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto 16px;
  justify-content: center;
  width: 100%;
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