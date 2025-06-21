const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const app = express();

// Middleware
app.use(cors());
app.use(express.static('public')); // Serve static files from 'public' folder

// API endpoint to fetch video info
app.get('/api/info', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'YouTube URL is required' });

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');

    // Send response
    res.json({
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails.pop().url,
      formats: formats.map(format => ({
        url: format.url,
        quality: format.qualityLabel || 'Unknown',
        type: format.mimeType.split(';')[0],
        size: format.contentLength ? (format.contentLength / 1024 / 1024).toFixed(2) + 'MB' : 'Unknown'
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));