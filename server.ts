import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Initialize Gemini AI client server-side
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      apiVersion: 'v1beta',
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Space location & tag suggestion endpoint
  app.post('/api/suggest-space', async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: '장소명을 입력해주세요.' });
      }

      const prompt = `사용자가 제공한 장소명: "${name}".
Google 검색(googleSearch)을 수행하여 다음 2가지를 정확하게 찾아내세요:
1. 해당 장소의 실제 세부 주소(국내 도로명 주소 또는 지번 주소, 해외일 경우 영문 주소).
2. 이 공간의 성격, 건축 양식, 인테리어 분위기를 대표하는 한국어 추천 해시태그 4~5개 (단어 앞의 '#'은 제외하고 단어만 배열에 넣을 것).

반드시 다른 부연설명이나 마크다운 서식 없이 오직 유효한 JSON 문자열 하나만 응답하세요:
{
  "location": "서울특별시 성동구 연무장길 12",
  "tags": ["바우하우스", "성수동카페", "미니멀리즘", "콘크리트인테리어"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = response.text || '';
      const cleaned = rawText
        .replace(/```(?:json)?/gi, '')
        .replace(/```/g, '')
        .trim();

      let parsed: { location?: string; tags?: string[] } = {};
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Fallback regex parsing
        const locMatch = rawText.match(/"location"\s*:\s*"([^"]+)"/);
        const tagsMatch = rawText.match(/"tags"\s*:\s*\[(.*?)\]/s);
        let tags: string[] = [];
        if (tagsMatch) {
          tags = tagsMatch[1]
            .split(',')
            .map((t) => t.replace(/["'#\s]/g, ''))
            .filter(Boolean);
        }
        parsed = {
          location: locMatch ? locMatch[1] : `${name} (상세 주소 확인 필요)`,
          tags: tags.length > 0 ? tags : ['공간기록', '아카이브', '미니멀'],
        };
      }

      const location = (parsed.location || '').trim();
      const tags = (parsed.tags || [])
        .map((t) => t.replace(/^#/, '').trim())
        .filter(Boolean);

      return res.json({
        location,
        tags: tags.length > 0 ? tags : ['공간', '아카이브', '디자인'],
      });
    } catch (error: any) {
      console.error('Error querying Gemini:', error);
      return res.status(500).json({
        error: error?.message || '장소 정보를 검색하는 데 실패했습니다.',
        fallback: {
          location: '',
          tags: ['건축', '미니멀', '공간기록', '감성'],
        },
      });
    }
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Development: Vite middlewares
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to bootstrap server:', err);
});
