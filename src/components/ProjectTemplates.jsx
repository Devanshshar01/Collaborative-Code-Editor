import React, { useState } from 'react';
import { Layout, Code, Globe, Smartphone, Database, Cpu, Zap, X as XIcon, Download, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const ProjectTemplates = ({ isOpen, onClose, onSelectTemplate }) => {
    const [selectedCategory, setSelectedCategory] = useState('all');

    const templates = [
        {
            id: 'react-app',
            name: 'React Application',
            description: 'Modern React app with hooks and components',
            category: 'frontend',
            icon: Layout,
            color: '#61DAFB',
            files: {
                'src/App.jsx': `import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header>
        <h1>Welcome to React</h1>
        <button onClick={() => setCount(count + 1)}>
          Count: {count}
        </button>
      </header>
    </div>
  );
}

export default App;`,
                'src/App.css': `.App {
  text-align: center;
  padding: 20px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background: #61DAFB;
  border: none;
  border-radius: 5px;
  color: white;
}`
            }
        },
        {
            id: 'node-api',
            name: 'Node.js REST API',
            description: 'Express.js REST API with middleware',
            category: 'backend',
            icon: Database,
            color: '#68A063',
            files: {
                'server.js': `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Node.js!' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
                'package.json': `{
  "name": "node-api",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}`
            }
        },
        {
            id: 'python-flask',
            name: 'Python Flask API',
            description: 'Flask REST API with routes',
            category: 'backend',
            icon: Cpu,
            color: '#3776AB',
            files: {
                'app.py': `from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify(message='Hello from Flask!')

@app.route('/api/data')
def get_data():
    return jsonify(data=[1, 2, 3, 4, 5])

if __name__ == '__main__':
    app.run(debug=True)`,
                'requirements.txt': `Flask==2.3.0
python-dotenv==1.0.0`
            }
        },
        {
            id: 'html-css-js',
            name: 'HTML/CSS/JS Website',
            description: 'Simple static website starter',
            category: 'frontend',
            icon: Globe,
            color: '#E34F26',
            files: {
                'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>Welcome to My Website</h1>
        <nav>
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
        </nav>
    </header>
    
    <main>
        <section id="home">
            <h2>Home Section</h2>
            <p>This is a simple website template.</p>
        </section>
    </main>
    
    <script src="script.js"></script>
</body>
</html>`,
                'styles.css': `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
}

header {
    background: #35424a;
    color: #ffffff;
    padding: 1rem;
    text-align: center;
}

nav a {
    color: #ffffff;
    text-decoration: none;
    padding: 0 1rem;
}`,
                'script.js': `console.log('Website loaded successfully!');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready');
});`
            }
        },
        {
            id: 'python-data',
            name: 'Python Data Science',
            description: 'Data analysis with pandas and numpy',
            category: 'datascience',
            icon: Zap,
            color: '#FFD43B',
            files: {
                'analysis.py': `import pandas as pd
import numpy as np

# Sample data
data = {
    'Name': ['Alice', 'Bob', 'Charlie'],
    'Age': [25, 30, 35],
    'Score': [85, 90, 95]
}

df = pd.DataFrame(data)
print(df)

# Basic statistics
print("\\nMean score:", df['Score'].mean())
print("Max age:", df['Age'].max())`,
                'requirements.txt': `pandas==2.0.0
numpy==1.24.0
matplotlib==3.7.0`
            }
        },
        {
            id: 'typescript',
            name: 'TypeScript Project',
            description: 'TypeScript with types and interfaces',
            category: 'frontend',
            icon: Code,
            color: '#3178C6',
            files: {
                'src/index.ts': `interface User {
  id: number;
  name: string;
  email: string;
}

class UserManager {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  getUser(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getAllUsers(): User[] {
    return this.users;
  }
}

const manager = new UserManager();
manager.addUser({ id: 1, name: 'John', email: 'john@example.com' });
console.log(manager.getAllUsers());`,
                'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}`
            }
        }
    ];

    const categories = [
        { id: 'all', label: 'All Templates', icon: Layout },
        { id: 'frontend', label: 'Frontend', icon: Globe },
        { id: 'backend', label: 'Backend', icon: Database },
        { id: 'datascience', label: 'Data Science', icon: Zap }
    ];

    const filteredTemplates = selectedCategory === 'all'
        ? templates
        : templates.filter(t => t.category === selectedCategory);

    const handleSelectTemplate = (template) => {
        onSelectTemplate?.(template);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-5xl mx-4 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 bg-gradient-to-r from-blue-600/10 to-purple-600/10 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <Layout className="w-6 h-6 text-primary" />
                                Project Templates
                            </h2>
                            <p className="text-sm text-text-secondary mt-1">
                                Start with a pre-configured project template
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-secondary hover:text-white"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar - Categories */}
                    <div className="w-48 border-r border-white/5 bg-surface-light/30 p-4 shrink-0 overflow-y-auto">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Categories</h3>
                        <div className="space-y-1">
                            {categories.map(category => {
                                const Icon = category.icon;
                                const count = category.id === 'all'
                                    ? templates.length
                                    : templates.filter(t => t.category === category.id).length;

                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={clsx(
                                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                            selectedCategory === category.id
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="flex-1 text-left">{category.label}</span>
                                        <span className="text-xs opacity-60">{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Content - Templates Grid */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredTemplates.map(template => {
                                const Icon = template.icon;
                                const fileCount = Object.keys(template.files).length;

                                return (
                                    <button
                                        key={template.id}
                                        onClick={() => handleSelectTemplate(template)}
                                        className="group relative text-left p-5 rounded-xl border border-white/10 hover:border-primary/50 bg-surface-light/30 hover:bg-surface-light/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02]"
                                    >
                                        {/* Icon */}
                                        <div className="flex items-start gap-4">
                                            <div
                                                className="p-3 rounded-xl shadow-lg shrink-0"
                                                style={{ backgroundColor: `${template.color}20`, borderColor: `${template.color}40` }}
                                            >
                                                <Icon className="w-6 h-6" style={{ color: template.color }} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-bold text-text-primary mb-1 flex items-center gap-2">
                                                    {template.name}
                                                    <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                                </h3>
                                                <p className="text-sm text-text-secondary mb-3">{template.description}</p>

                                                <div className="flex items-center gap-3 text-xs text-text-muted">
                                                    <span className="flex items-center gap-1">
                                                        <Download className="w-3 h-3" />
                                                        {fileCount} {fileCount === 1 ? 'file' : 'files'}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-white/5 rounded-full capitalize">
                                                        {template.category}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hover Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    </button>
                                );
                            })}
                        </div>

                        {filteredTemplates.length === 0 && (
                            <div className="text-center py-12 text-text-muted">
                                <Layout className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No templates found in this category</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectTemplates;
