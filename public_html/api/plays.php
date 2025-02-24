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
            <title>" . htmlspecialchars($data['title'] ?: 'Play') . "</title>
            <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    margin: 0;
                    padding: 0;
                    line-height: 1.6;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                header {
                    background-color: #2196F3;
                    color: white;
                    padding: 1rem;
                    text-align: center;
                }
                header h1 {
                    margin: 0;
                    font-size: 2.5rem;
                    font-weight: bold;
                }
                header h2 {
                    font-size:1rem;
                }
                header h2 a {color: #eeeeee;}
                main {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    width: 100%;
                    box-sizing: border-box;
                    flex: 1;
                }
                footer {
                    background-color: #333;
                    color: white;
                    text-align: center;
                    padding: 1rem;
                    margin-top: auto;
                }
                footer a {
                    color: white;
                    text-decoration: none;
                    margin: 0 10px;
                }
                footer a:hover {
                    text-decoration: underline;
                }
                .button-container {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    justify-content: center;
                }
                .button {
                    padding: 10px 20px;
                    border-radius: 4px;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                    display: inline-flex;
                    align-items: center;
                    text-decoration: none;
                }
                .button i {
                    margin-right: 8px;
                }
                .share-button {
                    background-color: #00cc44;
                    color: white;
                }
                .share-button:hover {
                    background-color: #00b33c;
                }
                .new-button {
                    background-color: #2196F3;
                    color: white;
                }
                .new-button:hover {
                    background-color: #1976D2;
                }
                img {
                    max-width: 100%;
                    height: auto;
                    margin-bottom: 20px;
                    border-radius: 4px;
                }
                .description {
                    background-color: #f9f9f9;
                    padding: 20px;
                    border-radius: 4px;
                    margin-top: 20px;
                }
            </style>
            <script>
                function copyToClipboard() {
                    navigator.clipboard.writeText(window.location.href)
                        .then(() => {
                            const button = document.querySelector('.share-button');
                            const originalText = button.innerHTML;
                            button.innerHTML = '<i class=\"fas fa-check\"></i> URL Copied!';
                            setTimeout(() => {
                                button.innerHTML = originalText;
                            }, 2000);
                        })
                        .catch(err => {
                            console.error('Failed to copy URL:', err);
                        });
                }
            </script>
        </head>
        <body>
            <header>
                <h1>" . htmlspecialchars($data['title'] ?: 'Play') . "</h1>
                <h2>Brought to you by <a href='https://flagfootballplaydesigner.com'>FlagFootballPlayDesigner.com</a></h2>
            </header>
            
            <main>
                <div class='button-container'>
                    <button onclick='copyToClipboard()' class='button share-button'>
                        <i class='fas fa-share-alt'></i> Share Play
                    </button>
                    <a href='/' class='button new-button'>
                        <i class='fas fa-plus'></i> Create New Play
                    </a>
                </div>
                <img src='" . htmlspecialchars($urlPath) . ".png' alt='" . htmlspecialchars($data['title'] ?: 'Play') . "' />
                " . ($data['description'] ? "<div class='description'>" . $data['description'] . "</div>" : "") . "
            </main>

            <footer>
                <p>
                    <a href='/'>Home</a> | 
                    <a href='/contact.html'>Contact</a>
                </p>
                <p>Brought to you by <a href='https://flagfootballplaydesigner.com'>FlagFootballPlayDesigner.com</a></p>
            </footer>
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