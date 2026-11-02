# Navigator-


It is an AI-powered Chrome Extension and Python backend designed to help technically illiterate users navigate complex websites. By typing a simple natural language goal (e.g., "Change my password" or "Check my recent orders"), the extension uses Google's Gemini AI to analyze the current webpage and visually guide the user, step-by-step, to their destination.

 Features

Natural Language Processing: Users state their goal in plain English; no technical jargon required.

Visual Step-by-Step Guidance: Uses Driver.js to spotlight the exact button, link, or input field the user needs to interact with.

Smart DOM Analysis: Automatically scrapes interactive elements on the screen and feeds them to an LLM to logically deduce the correct path.

Multi-Page State Persistence: Remembers the user's goal across page reloads and dynamic URL changes to handle complex, multi-step workflows.

Dynamic DOM Handling: Automatically waits for dropdowns, modals, and React/Vue state changes to render before providing the next step.

 Architecture

The project is split into two completely decoupled components:

Frontend (/nav-extension): A vanilla JavaScript Chrome Extension. It injects a floating UI, scrapes interactive DOM elements (buttons, links, inputs), tracks the user's goal via chrome.storage, and drives the visual tutorial.

Backend (/backend): A FastAPI Python server. It receives the DOM context and the user's goal, prompts the Gemini 3.8 Flash model to find the correct CSS selector, and returns the strictly formatted JSON instructions to the frontend.

📋 Prerequisites

Python 3.8+ installed on your machine.

Google Chrome browser.

A Google Gemini API Key (Get one from Google AI Studio).

 Installation & Setup

You will need to run the Python server and load the Chrome extension simultaneously.

Part 1: Backend Setup (Python)

Open a terminal and navigate to your backend folder.

(Optional but recommended) Create and activate a virtual environment:

python3 -m venv venv
source venv/bin/activate  # On Mac/Linux
venv\Scripts\activate     # On Windows


Install the required dependencies:

pip install fastapi uvicorn pydantic google-genai python-dotenv


Create a .env file in the backend folder and add your Gemini API key:

GEMINI_API_KEY="your_actual_api_key_here"


Start the server:

python3 -m uvicorn server:app --reload


The server must remain running in the terminal while you use the extension.

Part 2: Frontend Setup (Chrome Extension)

Ensure your nav-extension folder contains the following files:

manifest.json

content.js

style.css

driver.js.iife.js (Downloaded from Driver.js CDN)

driver.css (Downloaded from Driver.js CDN)

Open Google Chrome and navigate to chrome://extensions/.

Toggle Developer mode (top right corner) to ON.

Click the Load unpacked button (top left corner).

Select your nav-extension folder. The "NavGuide Interactive Helper" should now appear in your extensions list.

 Usage

Navigate to any standard website (e.g., amazon.com, wikipedia.org). Note: Extensions do not run on Chrome Web Store pages or empty new tabs.

You will see a blue floating ❓ icon in the bottom right corner of the screen.

Click the icon to open the chat panel.

Type your objective (e.g., "Where do I log in?").

Click Guide Me.

The AI will highlight the first step. Click the highlighted element on the actual website to proceed. The extension will automatically wait for the next page or menu to load and then provide the subsequent step.
<img width="2664" height="1498" alt="image" src="https://github.com/user-attachments/assets/59283c77-4463-4215-a8db-da9ee033412c" />

Manual Rescan: If the website takes too long to load or the AI gets stuck, open the ❓ menu and click the yellow Scan New Screen button to force the AI to re-evaluate the current page.

Troubleshooting

Error: Could not connect to the Python server.
Ensure your Uvicorn server is running in the terminal and listening on http://127.0.0.1:8000. If it is running on a different port, update the fetch() URL in content.js.

Error: 404 NOT_FOUND or Model deprecated.
Google frequently updates Gemini models. If gemini-3.8-flash is deprecated, open server.py, find the generate_content block, and update the model parameter to the latest available flash model (e.g., gemini-1.5-flash).

The arrows aren't showing up on a new page.
Ensure the page has fully loaded. If it's a dynamic web app (like React), click the ❓ button and use the manual "Scan New Screen" override.

