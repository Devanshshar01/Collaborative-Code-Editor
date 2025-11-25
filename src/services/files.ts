import fs from 'fs/promises';
import path from 'path';
import { Request, Response } from 'express';

const ROOT_DIR = process.cwd(); // Restrict to current working directory

export class FileService {

    // Helper to ensure path is safe
    private getSafePath(reqPath: string): string | null {
        const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
        const fullPath = path.join(ROOT_DIR, safePath);

        // Prevent traversing above root
        if (!fullPath.startsWith(ROOT_DIR)) {
            return null;
        }
        return fullPath;
    }

    async listFiles(req: Request, res: Response) {
        try {
            const dirPath = req.query.path ? String(req.query.path) : '';
            const fullPath = this.getSafePath(dirPath);

            if (!fullPath) {
                return res.status(403).json({ error: 'Invalid path' });
            }

            const items = await fs.readdir(fullPath, { withFileTypes: true });

            const files = await Promise.all(items.map(async (item) => {
                const itemPath = path.join(dirPath, item.name);
                return {
                    name: item.name,
                    path: itemPath.replace(/\\/g, '/'), // Normalize to forward slashes
                    type: item.isDirectory() ? 'folder' : 'file',
                    children: item.isDirectory() ? [] : undefined // Children loaded lazily or could be recursive
                };
            }));

            // Sort folders first
            files.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'folder' ? -1 : 1;
            });

            res.json(files);
        } catch (error) {
            res.status(500).json({ error: 'Failed to list files' });
        }
    }

    async readFile(req: Request, res: Response) {
        try {
            const filePath = req.query.path ? String(req.query.path) : '';
            const fullPath = this.getSafePath(filePath);

            if (!fullPath) {
                return res.status(403).json({ error: 'Invalid path' });
            }

            const content = await fs.readFile(fullPath, 'utf-8');
            res.json({ content });
        } catch (error) {
            res.status(500).json({ error: 'Failed to read file' });
        }
    }

    async saveFile(req: Request, res: Response) {
        try {
            const { path: filePath, content } = req.body;
            const fullPath = this.getSafePath(filePath);

            if (!fullPath) {
                return res.status(403).json({ error: 'Invalid path' });
            }

            await fs.writeFile(fullPath, content);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to save file' });
        }
    }

    async createFile(req: Request, res: Response) {
        try {
            const { path: filePath, type } = req.body;
            const fullPath = this.getSafePath(filePath);

            if (!fullPath) {
                return res.status(403).json({ error: 'Invalid path' });
            }

            if (type === 'folder') {
                await fs.mkdir(fullPath, { recursive: true });
            } else {
                await fs.writeFile(fullPath, '');
            }
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to create item' });
        }
    }

    async deleteFile(req: Request, res: Response) {
        try {
            const filePath = req.query.path ? String(req.query.path) : '';
            const fullPath = this.getSafePath(filePath);

            if (!fullPath) {
                return res.status(403).json({ error: 'Invalid path' });
            }

            const stats = await fs.stat(fullPath);
            if (stats.isDirectory()) {
                await fs.rm(fullPath, { recursive: true, force: true });
            } else {
                await fs.unlink(fullPath);
            }
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete item' });
        }
    }

    async renameFile(req: Request, res: Response) {
        try {
            const { oldPath, newPath } = req.body;
            const fullOldPath = this.getSafePath(oldPath);
            const fullNewPath = this.getSafePath(newPath);

            if (!fullOldPath || !fullNewPath) {
                return res.status(403).json({ error: 'Invalid path' });
            }

            await fs.rename(fullOldPath, fullNewPath);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to rename item' });
        }
    }
}
