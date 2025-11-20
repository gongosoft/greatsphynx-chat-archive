import fs from 'fs/promises';
import path from 'path';

const MAX_FILENAME_LENGTH = 255;
const htmlPath = 'index.html';

function truncateSegment(segment, isLast) {
    if (!isLast) {
        return segment.length > MAX_FILENAME_LENGTH
            ? segment.slice(0, MAX_FILENAME_LENGTH)
            : segment;
    }
    const ext = path.extname(segment);
    const base = path.basename(segment, ext);
    if (segment.length > MAX_FILENAME_LENGTH) {
        const allowed = MAX_FILENAME_LENGTH - ext.length;
        return base.slice(0, allowed) + ext;
    }
    return segment;
}

const hrefRegex = /href=(["'])(.*?)\1/g;

async function encodeHrefs(filePath) {
    let html = await fs.readFile(filePath, 'utf8');
    html = html.replace(hrefRegex, (match, quote, url) => {
        if (url.startsWith('/') && !url.startsWith('//') && !url.match(/^https?:/)) {
            const segments = url.split('/');
            const encodedSegments = segments.map((seg, i) => {
                if (!seg) return '';
                const encoded = encodeURIComponent(seg);
                return truncateSegment(encoded, i === segments.length - 1);
            });
            let encodedUrl = encodedSegments.join('/');
            return `href=${quote}${encodedUrl}${quote}`;
        }
        return match;
    });
    await fs.writeFile(filePath, html, 'utf8');
    console.log(`Updated hrefs in ${filePath}`);
}

encodeHrefs(htmlPath).catch(err => {
    console.error('Error updating hrefs:', err);
    process.exit(1);
});
