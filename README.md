# LegalEaseAI

A responsive, professional frontend web application that allows users to upload complex legal documents and receive AI-generated summaries, clause explanations, chatbot interaction, and risk flags.

<!-- Deployment update: Fixed Vercel configuration -->

## Features

- 📄 **Document Upload**: Support for PDF and DOCX files or direct text input
- 🤖 **AI Analysis**: Comprehensive document summaries and clause-by-clause explanations
- ⚠️ **Risk Assessment**: Automated detection and flagging of potentially problematic clauses
- 💬 **AI Chat Assistant**: Interactive chatbot to answer questions about your document
- 🌙 **Dark/Light Mode**: Toggle between light and dark themes
- 📱 **Mobile Responsive**: Fully optimized for mobile and tablet devices
- 🔒 **Privacy Focused**: Clear disclaimers and privacy considerations

## Tech Stack

- **Frontend**: React.js 18
- **Styling**: Tailwind CSS 3.3
- **Icons**: Heroicons
- **Animations**: Framer Motion
- **Fonts**: Inter (Google Fonts)

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Open Application**
   - Navigate to `http://localhost:3000`
   - The app will automatically reload when you make changes

## Project Structure

```
src/
├── components/
│   ├── Navbar.js           # Navigation with theme toggle
│   ├── UploadSection.js    # File upload and text input
│   ├── ResultsSection.js   # Main results container
│   ├── SummaryCard.js      # Document summary display
│   ├── ClauseAccordion.js  # Clause-by-clause analysis
│   ├── RedFlagSidebar.js   # Risk flags and warnings
│   ├── ChatWidget.js       # AI chat assistant
│   └── Footer.js           # Footer with legal disclaimer
├── data/
│   └── mockData.js         # Sample data for testing
├── App.js                  # Main application component
├── index.js               # React entry point
└── index.css              # Global styles and Tailwind imports
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (irreversible)

## Component Overview

### Core Components

- **App.js**: Main application with state management for theme, document processing, and navigation
- **Navbar**: Responsive navigation with brand, menu items, and dark mode toggle
- **UploadSection**: Drag-and-drop file upload with text input alternative
- **ResultsSection**: Container for analysis results with summary, clauses, and risk flags
- **ChatWidget**: Floating chat interface with AI assistant functionality

### UI Features

- **Theme Support**: Persistent dark/light mode with system preference detection
- **Responsive Design**: Mobile-first approach with breakpoint-based layouts
- **Loading States**: Visual feedback during document processing
- **Error Handling**: User-friendly error messages and validation
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Customization

### Colors and Theming

The application uses a custom color palette defined in `tailwind.config.js`:
- **Primary**: Blue tones for main actions and branding
- **Accent**: Gray tones for text and UI elements
- **Success/Warning/Danger**: Semantic colors for status indicators

### Mock Data

Sample legal document data is provided in `src/data/mockData.js` including:
- Document summaries with key points
- Clause-by-clause analysis with risk levels
- Red flag warnings and recommendations
- Chat conversation examples

## Legal Considerations

⚠️ **Important**: This application provides AI-powered analysis for educational purposes only. It does not constitute legal advice and should not replace consultation with qualified legal professionals.

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for demonstration purposes. See LICENSE file for details.

---

Built with ❤️ for legal clarity and accessibility.