const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const app = express();

// Middleware
app.use(cors());
app.use(express.static('public'));

// API endpoint to fetch video info
app.get('/api/video-info', async (req, res) => {
    try {
        const url = req.query.url;
        
        if (!url) {
            return res.status(400).send('YouTube URL is required');
        }

        // Validate YouTube URL
        if (!ytdl.validateURL(url)) {
            return res.status(400).send('Invalid YouTube URL');
        }

        // Get video info
        const videoInfo = await ytdl.getInfo(url);
        
        // Extract video details
        const videoDetails = {
            title: videoInfo.videoDetails.title,
            thumbnail: videoInfo.videoDetails.thumbnails[videoInfo.videoDetails.thumbnails.length - 1].url,
            duration: formatDuration(parseInt(videoInfo.videoDetails.lengthSeconds)),
            views: parseInt(videoInfo.videoDetails.viewCount).toLocaleString() + ' views',
            uploadDate: new Date(videoInfo.videoDetails.uploadDate).toLocaleDateString(),
            description: videoInfo.videoDetails.description || 'No description available',
            videoFormats: [],
            audioFormats: []
        };

        // Process formats
        videoInfo.formats.forEach(format => {
            const formatInfo = {
                url: format.url,
                quality: format.qualityLabel || format.audioQuality || 'Unknown',
                mimeType: format.mimeType,
                fps: format.fps,
                size: format.contentLength ? formatBytes(format.contentLength) : 'N/A'
            };

            if (format.hasVideo && format.hasAudio) {
                // Video with audio
                videoDetails.videoFormats.push(formatInfo);
            } else if (format.hasAudio && !format.hasVideo) {
                // Audio only
                videoDetails.audioFormats.push(formatInfo);
            }
        });

        // Sort video formats by quality (highest first)
        videoDetails.videoFormats.sort((a, b) => {
            const aQuality = parseInt(a.quality.split('p')[0]) || 0;
            const bQuality = parseInt(b.quality.split('p')[0]) || 0;
            return bQuality - aQuality;
        });

        // Sort audio formats by quality (highest first)
        videoDetails.audioFormats.sort((a, b) => {
            const aQuality = a.quality.includes('high') ? 2 : a.quality.includes('medium') ? 1 : 0;
            const bQuality = b.quality.includes('high') ? 2 : b.quality.includes('medium') ? 1 : 0;
            return bQuality - aQuality;
        });

        res.json(videoDetails);
    } catch (error) {
        console.error('Error fetching video info:', error);
        res.status(500).send('Failed to fetch video information');
    }
});

// Helper function to format duration
function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    return [
        h > 0 ? h + 'h' : '',
        m > 0 ? m + 'm' : '',
        s > 0 ? s + 's' : ''
    ].filter(B