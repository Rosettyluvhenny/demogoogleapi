# demogoogleapi

Simple Node.js script that sends a prompt to Google's Generative AI API and prints the text response.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
   If installation fails, ensure network access to npm registry.

2. Set your API key:
   ```bash
   export GOOGLE_API_KEY="your_key_here"
   ```

## Usage

Run with a prompt:
```bash
node index.js "Tell me a joke"
```
The model's reply will be printed as plain text.
