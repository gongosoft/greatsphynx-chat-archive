import path from 'path';
import fs from 'fs/promises';

const MAX_FILENAME_LENGTH = 255;

function isEncoded(segment) {
    try {
        return decodeURIComponent(segment) !== segment;
    } catch {
        return false;
    }
}

function encodeSegment(segment) {
    if (isEncoded(segment)) return segment;
    const ext = path.extname(segment);
    let base = path.basename(segment, ext);
    let encoded = encodeURIComponent(base);
    if (encoded.length + ext.length > MAX_FILENAME_LENGTH) {
        encoded = encoded.slice(0, MAX_FILENAME_LENGTH - ext.length);
    }
    return encoded + ext;
}

async function sanitizeDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const oldPath = path.join(dir, entry.name);
        const encodedName = encodeSegment(entry.name);
        const newPath = path.join(dir, encodedName);

        if (entry.name !== encodedName) {
            await fs.rename(oldPath, newPath);
        }

        if (entry.isDirectory()) {
            await sanitizeDir(newPath);
        }
    }
}

sanitizeDir(path.resolve('dist')).catch(err => {
    console.error('Sanitization error:', err);
    process.exit(1);
});
