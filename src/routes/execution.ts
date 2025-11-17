import {Router, Request, Response} from 'express';
import {codeExecutor} from '../services/code-executor';
import {ExecutionRequest, Language} from '../types/execution';

const router = Router();

/**
 * POST /api/execute
 * Execute code in a secure Docker container
 */
router.post('/execute', async (req: Request, res: Response) => {
    try {
        const {code, language, input} = req.body;

        // Validate request body
        if (!code) {
            return res.status(400).json({
                error: 'Code is required'
            });
        }

        if (!language) {
            return res.status(400).json({
                error: 'Language is required'
            });
        }

        // Validate language enum
        if (!Object.values(Language).includes(language as Language)) {
            return res.status(400).json({
                error: `Invalid language. Supported languages: ${Object.values(Language).join(', ')}`
            });
        }

        const request: ExecutionRequest = {
            code: code.toString(),
            language: language as Language,
            input: input ? input.toString() : undefined
        };

        // Execute code
        const result = await codeExecutor.execute(request);

        // Return result
        return res.status(200).json(result);

    } catch (error) {
        console.error('Execution error:', error);

        return res.status(500).json({
            stdout: '',
            stderr: '',
            executionTime: 0,
            exitCode: -1,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * GET /api/execute/languages
 * Get list of supported languages
 */
router.get('/languages', (req: Request, res: Response) => {
    res.json({
        languages: Object.values(Language)
    });
});

/**
 * GET /api/execute/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        service: 'code-execution',
        timestamp: new Date().toISOString()
    });
});

export default router;
