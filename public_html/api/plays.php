<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Add CORS headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Function to log messages
function logMessage($message) {
    error_log($message);  // This will log to PHP's error log
}

logMessage('Script started');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        logMessage('Received POST request');
        
        // Get POST data
        $rawData = file_get_contents('php://input');
        logMessage('Raw data length: ' . strlen($rawData));
        
        $data = json_decode($rawData, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON: ' . json_last_error_msg());
        }
        logMessage('JSON decoded successfully');
        
        // Validate data
        if (!isset($data['urlPath'])) {
            throw new Exception('urlPath is required');
        }
        if (!isset($data['imageData'])) {
            throw new Exception('imageData is required');
        }
        
        // Create plays directory
        $playsDir = dirname(__DIR__) . '/plays';
        logMessage('Using plays directory: ' . $playsDir);
        
        if (!file_exists($playsDir)) {
            if (!mkdir($playsDir, 0755, true)) {
                throw new Exception('Failed to create plays directory: ' . $playsDir);
            }
        }
        
        $urlPath = $data['urlPath'];
        $pngPath = "$playsDir/$urlPath.png";
        $htmlPath = "$playsDir/$urlPath.html";
        
        logMessage('Saving files to: ' . $pngPath);
        
        // Save PNG
        $pngData = str_replace('data:image/png;base64,', '', $data['imageData']);
        $pngData = base64_decode($pngData);
        if ($pngData === false) {
            throw new Exception('Failed to decode base64 image data');
        }
        
        if (file_put_contents($pngPath, $pngData) === false) {
            throw new Exception('Failed to save PNG file');
        }
        logMessage('PNG file saved successfully');
        
        // Save HTML
        $htmlContent = "<!DOCTYPE html>
        <html lang='en'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>$data[title]</title>
            <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'>
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
            <div class='container'>
                " . ($data['title'] ? "<h1>$data[title]</h1>" : "") . "
                <div id='playContent'>
                    " . ($data['description'] ? "<div class='play-description'>$data[description]</div>" : "") . "
                    <img class='play-image' src='$urlPath.png' alt='Flag Football Play'>
                    <div class='button-container'>
                        <a href='$urlPath.png' download class='download-button'>
                            <i class='fas fa-download'></i> Download PNG
                        </a>
                    </div>
                </div>
                <a href='/' class='back-link'>Create Your Own Play</a>
            </div>
        </body>
        </html>";
        
        if (file_put_contents($htmlPath, $htmlContent) === false) {
            throw new Exception('Failed to save HTML file');
        }
        logMessage('HTML file saved successfully');
        
        echo json_encode([
            'success' => true,
            'playId' => $urlPath,
            'url' => "/plays/$urlPath.html",
            'debug' => [
                'pngPath' => $pngPath,
                'htmlPath' => $htmlPath
            ]
        ]);
        
    } else {
        throw new Exception('Method not allowed: ' . $_SERVER['REQUEST_METHOD']);
    }
} catch (Exception $e) {
    logMessage('Error occurred: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'debug' => [
            'method' => $_SERVER['REQUEST_METHOD'],
            'contentType' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
            'requestSize' => $_SERVER['CONTENT_LENGTH'] ?? 'not set'
        ]
    ]);
}

logMessage('Script finished');
?>