/**
 * Converts various cloud storage links to direct download links.
 * Currently supports: Google Drive
 * 
 * @param {string} url - The original URL
 * @return {string} - The direct download URL
 */
export const getDirectUrl = (url) => {
    if (!url) return "";

    // Handle Google Drive
    // Pattern 1: https://drive.google.com/file/d/FILE_ID/view...
    // Pattern 2: https://drive.google.com/open?id=FILE_ID...
    // Target: https://drive.google.com/uc?export=download&id=FILE_ID

    // Handle Google Drive / Docs
    // Pattern 1: https://drive.google.com/file/d/FILE_ID/view...
    // Pattern 2: https://drive.google.com/open?id=FILE_ID...
    // Pattern 3: https://docs.google.com/document/d/FILE_ID/edit...
    // Target: https://drive.google.com/uc?export=download&id=FILE_ID

    if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
        let fileId = null;

        // Try identifying ID from /d/FILE_ID path
        const matchFileId = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (matchFileId && matchFileId[1]) {
            fileId = matchFileId[1];
        }
        // Try identifying ID from id= query param
        else if (url.includes('id=')) {
            const matchIdParam = url.match(/id=([a-zA-Z0-9_-]+)/);
            if (matchIdParam && matchIdParam[1]) {
                fileId = matchIdParam[1];
            }
        }

        if (fileId) {
            // Prefer the export endpoint which handles both Native Docs and stored .docx better
            return `https://docs.google.com/document/d/${fileId}/export?format=docx`;
        }
    }

    // Handle Dropbox (replace dl=0 with dl=1)
    if (url.includes('dropbox.com') && url.includes('dl=0')) {
        return url.replace('dl=0', 'dl=1');
    }

    return url;
};
