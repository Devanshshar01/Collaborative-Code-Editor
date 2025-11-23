const express = require('express');
const cors = require('cors');
const { VM } = require('vm2');
const { spawn } = require('child_process');
const bodyParser = require('body-parser');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// Health check
app.get('/api/execute/health', (req, res) => {
    res.json({ status: 'ok', service: 'simple-code-execution' });
});

// Execute code
app.post('/api/execute', async (req, res) => {
    const { code, language } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    console.log(`Executing ${language} code...`);

    try {
        if (language === 'javascript') {
            executeJavaScript(code, res);
        } else if (language === 'python') {
            executePython(code, res);
        } else if (language === 'java') {
            res.status(400).json({
                stdout: '',
                stderr: 'Java execution requires Docker (not available in this simple mode).',
                exitCode: 1
            });
        } else {
            res.status(400).json({ error: `Unsupported language: ${language}` });
        }
    } catch (error) {
        console.error('Execution error:', error);
        res.status(500).json({ error: error.message });
    }
});

function executeJavaScript(code, res) {
    const vm = new VM({
        timeout: 1000,
        sandbox: {}
    });

    const logs = [];

    // Mock console.log
    vm.freeze({
        log: (...args) => {
            logs.push(args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
        }
    }, 'console');

    try {
        // Wrap code to capture console.log
        // We replace console.log with our sandboxed console.log
        const wrappedCode = `
            const originalLog = console.log;
            console.log = (...args) => originalLog(...args);
            ${code}
        `;

        // Actually, vm2 has better ways, but let's keep it simple.
        // The vm.freeze above puts 'console' in the global scope.

        const result = vm.run(code);

        res.json({
            stdout: logs.join('\n') || (result !== undefined ? String(result) : 'Code executed successfully'),
            stderr: '',
            exitCode: 0
        });
    } catch (error) {
        res.json({
            stdout: logs.join('\n'),
            stderr: error.message,
            exitCode: 1
        });
    }
}

function executePython(code, res) {
    const pythonProcess = spawn('python', ['-c', code]);

    let stdout = '';
    let stderr = '';

    const timeout = setTimeout(() => {
        pythonProcess.kill();
        res.json({
            stdout,
            stderr: stderr + '\nExecution timed out',
            exitCode: 124
        });
    }, 5000);

    pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
        clearTimeout(timeout);
        res.json({
            stdout,
            stderr,
            exitCode: code
        });
    });

    pythonProcess.on('error', (err) => {
        clearTimeout(timeout);
        res.json({
            stdout: '',
            stderr: 'Failed to start Python. Is it installed?\n' + err.message,
            exitCode: 1
        });
    });
}

app.listen(PORT, () => {
    console.log(`Simple execution server running on port ${PORT}`);
});
