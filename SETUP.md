# Cold Email Generator - Backend Setup

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# OpenAI API Key (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: For future integrations
# HUNTER_API_KEY=your_hunter_api_key_here
# APOLLO_API_KEY=your_apollo_api_key_here
```

## API Endpoints

### Campaign Management
- `POST /api/campaigns/create` - Create a new campaign
- `GET /api/campaigns/[id]` - Get campaign details
- `PUT /api/campaigns/[id]` - Update campaign
- `POST /api/campaigns/generate` - Generate complete campaign (templates + targets)

### Email Generation
- `POST /api/emails/generate` - Generate email templates for a campaign

### Target Discovery
- `POST /api/targets/find` - Find target prospects for a campaign

### Export
- `POST /api/export/csv` - Export campaign data as CSV
- `POST /api/export/pdf` - Export campaign data as PDF

## Usage Example

```javascript
// Create and generate a complete campaign
const response = await fetch('/api/campaigns/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    businessName: 'TechStart Solutions',
    businessDescription: 'We help small businesses automate their customer service with AI chatbots',
    targetAudience: 'Small business owners',
    emailCount: 'medium'
  })
});

const result = await response.json();
console.log(result.campaign);
```

## Features

- ✅ AI-powered email generation using OpenAI GPT-3.5
- ✅ Target discovery with mock data (easily replaceable with real APIs)
- ✅ Export to CSV and PDF
- ✅ In-memory database (perfect for hackathon demo)
- ✅ No authentication required
- ✅ Session-based storage
- ✅ Free to run (only OpenAI API costs)

## Next Steps

1. Get OpenAI API key from https://platform.openai.com/api-keys
2. Add the key to your `.env.local` file
3. Run the development server: `npm run dev`
4. Test the API endpoints
5. Integrate with the frontend form
