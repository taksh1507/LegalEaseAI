# LegalEaseAI Setup Instructions

## Prerequisites

Before running the LegalEaseAI application, ensure you have:

1. **Node.js** (version 16 or higher)
   
   ### Option 1: Official Website (Recommended)
   - Visit: https://nodejs.org/
   - Download the LTS version (Long Term Support)
   - Run the installer and follow the setup wizard
   - This will install both Node.js and npm
   
   ### Option 2: Windows Package Manager (winget)
   ```powershell
   winget install OpenJS.NodeJS
   ```
   
   ### Option 3: Chocolatey (if installed)
   ```powershell
   choco install nodejs
   ```
   
   ### Option 4: Scoop (if installed)
   ```powershell
   scoop install nodejs
   ```

2. **Verify Installation**
   ```bash
   node --version    # Should show v16.0.0 or higher
   npm --version     # Should show 8.0.0 or higher
   ```

## Installation Steps

1. **Open Terminal/Command Prompt**
   - Navigate to the project directory: `cd c:\Users\admin\Desktop\LegalEaseAI`

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **View Application**
   - Open browser and go to: `http://localhost:3000`

## Features to Test

### 1. Upload Section
- Try both file upload and text input methods
- Test drag-and-drop functionality
- Verify loading states during processing

### 2. Document Analysis
- Upload a sample legal document or paste legal text
- Review the generated summary with key points
- Expand clauses in the accordion to see detailed explanations
- Check risk flags in the sidebar

### 3. AI Chat Assistant
- Click the chat bubble in bottom-right corner
- Ask questions about the document
- Test suggested questions
- Verify chat history and timestamps

### 4. Dark/Light Mode
- Toggle theme using the sun/moon icon in navigation
- Verify all components adapt to theme changes
- Check that preference is saved between sessions

### 5. Responsive Design
- Test on different screen sizes
- Verify mobile navigation menu
- Check that layouts stack properly on small screens

### 6. Navigation
- Test all navigation menu items (Home, Upload, FAQ, Contact)
- Verify smooth transitions between sections
- Check that active states are highlighted

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   - Kill other processes using port 3000
   - Or use a different port: `npm start -- --port 3001`

2. **Build errors**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

3. **Styling issues**
   - Ensure Tailwind CSS is properly configured
   - Check that all imports are correct in index.css

### Performance Tips

- The app includes mock data for demonstration
- Processing delays are simulated (2 seconds)
- In production, replace mock data with actual API calls

## Next Steps

This is a complete frontend implementation. To make it production-ready:

1. **Backend Integration**
   - Connect to actual document processing API
   - Implement real AI analysis services
   - Add user authentication

2. **File Processing**
   - Add actual PDF/DOCX parsing
   - Implement document storage
   - Add progress tracking for large files

3. **Enhanced AI Features**
   - Connect to OpenAI or similar services
   - Implement contextual chat responses
   - Add document comparison features

4. **Security & Privacy**
   - Add encryption for uploaded documents
   - Implement secure file storage
   - Add privacy controls

Enjoy testing LegalEaseAI! 🚀