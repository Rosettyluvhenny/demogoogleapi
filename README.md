# Demo Google API Backend

Minimal REST backend using Node 18, TypeScript, Express and Zod. The service generates and scores coding tests from CVs using Google Gemini or a mock provider.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Endpoints

- `POST /test/create`
- `POST /test/submit`
- `GET /health`

## Example

```bash
# Create test
curl -s -X POST http://localhost:3000/test/create \
  -H "content-type: application/json" \
  -d '{"cvText":"3y Java/Spring, REST, SQL, Docker", "jdText":"Backend Java Spring, SQL, REST", "level":"junior", "numMcq":7}'

# Submit test
curl -s -X POST http://localhost:3000/test/submit \
  -H "content-type: application/json" \
  -d '{"testId":"<id-trả-về-từ-create>", "answers": { "mcq":[0,1,2,3,1,2,0], "open":"I would design ..."}}'
```

Provide `GEMINI_API_KEY` (or set `LLM_PROVIDER=gemini`) to use the real Gemini API. Without a key the mock provider is used for offline testing.
