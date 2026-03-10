import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import OpenAI from 'openai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import mammoth from 'mammoth';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let pdf: any;
let officeParser: any;

try {
  pdf = require('pdf-parse');
  officeParser = require('officeparser');
} catch (e) {
  console.error('Failed to load document parsers:', e);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Initializing database...');
// Database Setup
let db: Database.Database;
try {
  db = new Database('knowledge_base.db');
  db.pragma('journal_mode = WAL');
} catch (e) {
  console.error('Failed to initialize database:', e);
  process.exit(1);
}

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    title TEXT,
    summary TEXT,
    image_url TEXT,
    category_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed or Update settings
const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
insert.run('openai_api_key', "sk-sxWGh4hWeExbe8sqZEkgBi4E9l8E53oaAaoYEzjxbzR5IOgk");
insert.run('openai_base_url', "https://chatapi.littlewheat.com/v1");
insert.run('openai_model', "gpt-4o-mini");

// OpenAI Setup
let openai: OpenAI;

function initializeOpenAI() {
  try {
    const apiKey = (db.prepare("SELECT value FROM settings WHERE key = 'openai_api_key'").get() as any)?.value;
    let baseURL = (db.prepare("SELECT value FROM settings WHERE key = 'openai_base_url'").get() as any)?.value;
    
    // Clean baseURL: trim whitespace and remove trailing slash if present
    if (baseURL) {
      baseURL = baseURL.trim();
      while (baseURL.endsWith('/')) {
        baseURL = baseURL.slice(0, -1);
      }
    }

    console.log(`Initializing OpenAI with Base URL: '${baseURL}'`);

    openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
      defaultHeaders: { 'Content-Type': 'application/json' }
    });
    console.log('OpenAI client re-initialized');
  } catch (e) {
    console.error('Failed to initialize OpenAI client:', e);
  }
}

// Initial load
initializeOpenAI();

// Multer Setup
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
const upload = multer({ dest: 'uploads/' });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Settings API
  app.get('/api/settings', (req, res) => {
    try {
      const settings = db.prepare('SELECT * FROM settings').all();
      const settingsMap: Record<string, string> = {};
      settings.forEach((s: any) => {
        settingsMap[s.key] = s.value;
      });
      // Mask API key for security
      if (settingsMap.openai_api_key) {
        settingsMap.openai_api_key = settingsMap.openai_api_key.substring(0, 3) + '...' + settingsMap.openai_api_key.substring(settingsMap.openai_api_key.length - 4);
      }
      res.json(settingsMap);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/settings', (req, res) => {
    const { openai_api_key, openai_base_url, openai_model } = req.body;
    
    try {
      const update = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      
      db.transaction(() => {
        if (openai_api_key !== undefined && !openai_api_key.includes('...')) {
          update.run('openai_api_key', openai_api_key);
        }
        if (openai_base_url !== undefined) update.run('openai_base_url', openai_base_url);
        if (openai_model !== undefined) update.run('openai_model', openai_model);
      })();
      
      // Re-initialize OpenAI client
      initializeOpenAI();
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      res.status(500).json({ error: 'Failed to update settings', details: error.message });
    }
  });

  // Helper: Process content with LLM
  async function processWithLLM(title: string, content: string, description: string = '', language: string = 'en') {
    // Get existing categories for context
    const existingCategories = db.prepare('SELECT name FROM categories').all() as { name: string }[];
    const categoryList = existingCategories.map(c => c.name).join(', ');
    
    // Get model from settings
    const model = (db.prepare("SELECT value FROM settings WHERE key = 'openai_model'").get() as any)?.value || "gpt-4o-mini";

    const systemPrompt = language === 'zh' 
      ? `你是一个智能助手，负责为知识库总结内容。
         分析提供的文本并：
         1. 创建一个简明的摘要（最多3句话）。
         2. 对内容进行分类。使用现有的分类之一：[${categoryList}] 如果合适的话。
            如果不合适，建议一个新的、简短的、描述性的分类名称（例如“科技”、“健康”、“金融”）。
         
         仅返回一个有效的 JSON 对象，结构如下：
         {
           "summary": "摘要文本...",
           "category": "分类名称"
         }`
      : `You are an intelligent assistant that summarizes web content for a knowledge base. 
         Analyze the provided text and:
         1. Create a concise summary (max 3 sentences).
         2. Categorize the content. Use one of the existing categories: [${categoryList}] if it fits well. 
            If NOT, suggest a new, short, descriptive category name (e.g., "Tech", "Health", "Finance").
         
         Return ONLY a valid JSON object with this structure:
         {
           "summary": "The summary text...",
           "category": "Category Name"
         }`;

    try {
      console.log(`Sending request to OpenAI: Model=${model}, BaseURL=${openai.baseURL}`);
      const completion = await openai.chat.completions.create({
        model: model,
        temperature: 0.1,
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Title: ${title}\nDescription: ${description}\nContent: ${content.substring(0, 15000)}`
          }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      // Fallback if AI fails
      return {
        summary: description || "Summary generation failed.",
        category: "Uncategorized"
      };
    }
  }

  // Helper: Save to DB
  function saveToDB(url: string, title: string, summary: string, imageUrl: string, categoryName: string) {
    // Ensure category exists
    db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').run(categoryName);
    const category = db.prepare('SELECT * FROM categories WHERE name = ?').get(categoryName) as { id: number };

    const insert = db.prepare(`
      INSERT INTO entries (url, title, summary, image_url, category_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    return insert.run(url, title, summary, imageUrl, category.id);
  }

  // API Routes

  // Get all categories
  app.get('/api/categories', (req, res) => {
    try {
      const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Create a category manually
  app.post('/api/categories', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    try {
      const info = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').run(name);
      const category = db.prepare('SELECT * FROM categories WHERE name = ?').get(name);
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create category' });
    }
  });

  // Get all entries
  app.get('/api/entries', (req, res) => {
    try {
      const { q } = req.query;
      let query = `
        SELECT e.*, c.name as category_name 
        FROM entries e 
        LEFT JOIN categories c ON e.category_id = c.id 
      `;
      
      const params: any[] = [];
      
      if (q) {
        query += `
          WHERE e.title LIKE ? 
          OR e.summary LIKE ? 
          OR c.name LIKE ?
        `;
        const searchPattern = `%${q}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }
      
      query += ` ORDER BY e.created_at DESC`;
      
      const entries = db.prepare(query).all(...params);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch entries' });
    }
  });

  // Update entry category
  app.put('/api/entries/:id', (req, res) => {
    const { id } = req.params;
    const { category_name } = req.body;
    
    if (!category_name) return res.status(400).json({ error: 'Category name is required' });

    try {
      // Ensure category exists
      db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').run(category_name);
      const category = db.prepare('SELECT * FROM categories WHERE name = ?').get(category_name) as { id: number };

      const result = db.prepare('UPDATE entries SET category_id = ? WHERE id = ?').run(category.id, id);
      
      if (result.changes === 0) return res.status(404).json({ error: 'Entry not found' });
      
      res.json({ success: true, category_name });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update entry' });
    }
  });

  // Delete entry
  app.delete('/api/entries/:id', (req, res) => {
    const { id } = req.params;
    try {
      const result = db.prepare('DELETE FROM entries WHERE id = ?').run(id);
      if (result.changes === 0) return res.status(404).json({ error: 'Entry not found' });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete entry' });
    }
  });

  // Delete category
  app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    try {
      // First, unlink any entries associated with this category
      db.prepare('UPDATE entries SET category_id = NULL WHERE category_id = ?').run(id);
      
      // Then delete the category
      const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
      
      if (result.changes === 0) return res.status(404).json({ error: 'Category not found' });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  // Process URL
  app.post('/api/process', async (req, res) => {
    const { url, language = 'en' } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
      console.log(`Fetching URL: ${url}`);
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      const title = $('title').text().trim() || url;
      const description = $('meta[name="description"]').attr('content') || '';
      const ogImage = $('meta[property="og:image"]').attr('content') || '';
      
      $('script, style, nav, footer, header').remove();
      const textContent = $('body').text().replace(/\s+/g, ' ').trim();

      const result = await processWithLLM(title, textContent, description, language);
      const summary = result.summary || description || "No summary available.";
      const categoryName = result.category || "General";

      const info = saveToDB(url, title, summary, ogImage, categoryName);
      
      res.json({
        id: info.lastInsertRowid,
        url,
        title,
        summary,
        image_url: ogImage,
        category_name: categoryName
      });

    } catch (error: any) {
      console.error('Error processing URL:', error.message);
      
      // Handle DNS errors gracefully
      if (error.code === 'ENOTFOUND') {
        return res.status(400).json({ error: 'Could not resolve website address. Please check the URL.' });
      }
      
      res.status(500).json({ error: error.message || 'Failed to process URL' });
    }
  });

  // Process File Upload
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const language = req.body.language || 'en';
    
    try {
      let textContent = '';
      
      if (mimeType === 'application/pdf') {
        if (!pdf) throw new Error('PDF parser not available');
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        textContent = data.text;
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // docx
        const result = await mammoth.extractRawText({ path: filePath });
        textContent = result.value;
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || // pptx
        mimeType === 'application/vnd.ms-powerpoint' || // ppt
        mimeType === 'application/msword' // doc
      ) {
        if (!officeParser) throw new Error('Office parser not available');
        // officeparser supports pptx, doc, etc.
        textContent = await officeParser.parseOfficeAsync(filePath);
      } else if (mimeType === 'text/plain') {
        textContent = fs.readFileSync(filePath, 'utf-8');
      } else {
        // Try officeparser as fallback for other formats
        if (!officeParser) throw new Error('Office parser not available');
        try {
          textContent = await officeParser.parseOfficeAsync(filePath);
        } catch (e) {
          throw new Error('Unsupported file type');
        }
      }

      const result = await processWithLLM(originalName, textContent, '', language);
      const summary = result.summary || "No summary available.";
      const categoryName = result.category || "Documents";

      // We store the original filename as the URL for now, or a fake path
      const fileUrl = `file://${originalName}`;
      
      const info = saveToDB(fileUrl, originalName, summary, '', categoryName);

      // Cleanup uploaded file
      fs.unlinkSync(filePath);

      res.json({
        id: info.lastInsertRowid,
        url: fileUrl,
        title: originalName,
        summary,
        image_url: '',
        category_name: categoryName
      });

    } catch (error: any) {
      console.error('Error processing file:', error);
      // Cleanup on error
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.status(500).json({ error: error.message || 'Failed to process file' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error('Vite middleware failed:', e);
    }
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
