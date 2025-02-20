const express = require('express');
const cors = require('cors');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Create plays directory if it doesn't exist
const playsDirectory = path.join(__dirname, 'public', 'plays');
fsPromises.mkdir(playsDirectory, { recursive: true }).catch(console.error);

// Save play endpoint
app.post('/api/plays', async (req, res) => {
  try {
    const { title, description, imageData, urlPath } = req.body;
    
    // Use the provided urlPath or generate a random one if not provided
    const playId = urlPath || Math.random().toString(36).substring(2, 10);
    
    // Save PNG file
    const pngData = imageData.replace(/^data:image\/png;base64,/, '');
    const pngPath = path.join(playsDirectory, `${playId}.png`);
    await fsPromises.writeFile(pngPath, pngData, 'base64');

    // Create PDF
    const pdfPath = path.join(playsDirectory, `${playId}.pdf`);
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);
    
    if (title) doc.fontSize(24).text(title, { align: 'center' });
    if (description) doc.fontSize(12).text(description, { align: 'center' });
    
    doc.image(Buffer.from(pngData, 'base64'), {
      fit: [500, 500],
      align: 'center',
      valign: 'center'
    });
    
    doc.end();
    await new Promise(resolve => writeStream.on('finish', resolve));

    // Create HTML with download buttons
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'Flag Football Play'}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #FFA500;
            text-align: center;
            margin-bottom: 20px;
        }
        .play-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .play-description {
            margin-bottom: 20px;
            color: #666;
        }
        .play-image {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
        }
        .button-container {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
        }
        .download-button {
            background-color: #2196F3;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            font-size: 16px;
        }
        .download-button:hover {
            background-color: #1976D2;
        }
        .download-button i {
            margin-right: 8px;
        }
        .back-link {
            display: block;
            text-align: center;
            margin-top: 20px;
            color: #2196F3;
            text-decoration: none;
        }
        .back-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        ${title ? `<h1>${title}</h1>` : ''}
        <div id="playContent">
            ${description ? `<div class="play-description">${description}</div>` : ''}
            <img class="play-image" src="${playId}.png" alt="Flag Football Play">
            <div class="button-container">
                <a href="${playId}.png" download class="download-button">
                    <i class="fas fa-download"></i> Download PNG
                </a>
                <a href="${playId}.pdf" download class="download-button">
                    <i class="fas fa-file-pdf"></i> Download PDF
                </a>
            </div>
        </div>
        <a href="/" class="back-link">Create Your Own Play</a>
    </div>
</body>
</html>`;

    // Save HTML file
    const filePath = path.join(playsDirectory, `${playId}.html`);
    await fsPromises.writeFile(filePath, htmlContent);

    res.json({ 
      success: true, 
      playId,
      url: `/plays/${playId}.html`
    });
  } catch (error) {
    console.error('Error saving play:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 