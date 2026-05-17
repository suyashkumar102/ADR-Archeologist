# ADR Archaeologist

> Recovers the architectural decisions your team never wrote down.

A Next.js web application that generates Architecture Decision Records (ADRs) by analyzing Git repositories using IBM Bob IDE, Groq AI, and full repository context.

## Features

- 🏛️ **Archaeology Discovery**: Finds rejected alternatives in code comments and commit history
- 🎯 **Smart Analysis**: 4-stage pipeline (Decision Detection → Context Inference → Alternatives Archaeology → ADR Generation)
- ⚡ **Real-time Progress**: Server-Sent Events (SSE) for live pipeline updates
- 📦 **Export Options**: Download as ZIP or create GitHub Pull Request
- 🎨 **Beautiful UI**: Dark theme with Tailwind CSS and smooth animations
- 🚀 **Instant Demo**: Try with django/django (no backend required)

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Express.js, Groq AI (Llama 3.3 70B)
- **Deployment**: Vercel (frontend) + Render (backend)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/adr-archaeologist.git
cd adr-archaeologist

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

For production, set this to your Render backend URL.

## Usage

### Try the Demo

1. Click "Try with django/django →" on the home page
2. See pre-generated ADRs instantly (no backend required)
3. Explore archaeology discoveries in the middleware ADR

### Analyze Your Repository

1. Paste a GitHub repository URL
2. Optionally filter by subdirectory or focus areas
3. Click "Generate ADRs"
4. Watch the real-time pipeline progress
5. Download results as ZIP or create a PR

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page
│   ├── results/           # Results page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── ADRCard.tsx       # ADR display card
│   ├── PipelineProgress.tsx
│   └── DownloadButtons.tsx
├── lib/                   # Core logic
│   ├── api.ts            # Backend API client
│   └── types/            # TypeScript types
├── scripts/              # Utilities
│   └── demo-fixture.ts   # Demo data
└── .bob/                 # Bob IDE configuration
    ├── modes/            # Custom mode
    ├── skills/           # ADR generation skill
    └── commands/         # /adr command
```

## Bob IDE Integration

This project includes custom Bob IDE configuration:

- **Mode**: `adr-archaeologist` - Specialized for ADR analysis
- **Skill**: `adr-generate` - 4-stage ADR generation pipeline
- **Command**: `/adr generate` - Generate ADRs for current repository

## Deployment

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Set environment variable: `NEXT_PUBLIC_BACKEND_URL`
3. Deploy (automatic on push)

### Backend (Render)

See `ADR-Archeologist/` directory for backend deployment instructions.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [IBM Bob IDE](https://www.ibm.com/products/watsonx-code-assistant)
- Powered by [Groq](https://groq.com/) (Llama 3.3 70B)
- Inspired by the [MADR](https://adr.github.io/madr/) format

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

---

Made with ❤️ using IBM Bob IDE