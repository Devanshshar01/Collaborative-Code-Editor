// Theme configurations for the collaborative code editor
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { oneDark } from '@codemirror/theme-one-dark';

export const editorThemes = {
    'vscode-dark': {
        name: 'VS Code Dark',
        codemirror: vscodeDark,
        colors: {
            primary: '#007ACC',
            background: '#1E1E1E',
            surface: '#252526',
            text: '#D4D4D4'
        }
    },
    'one-dark': {
        name: 'One Dark Pro',
        codemirror: oneDark,
        colors: {
            primary: '#61AFEF',
            background: '#282C34',
            surface: '#21252B',
            text: '#ABB2BF'
        }
    },
    'github-dark': {
        name: 'GitHub Dark',
        codemirror: vscodeDark, // Can be customized
        colors: {
            primary: '#58A6FF',
            background: '#0D1117',
            surface: '#161B22',
            text: '#C9D1D9'
        }
    },
    'dracula': {
        name: 'Dracula',
        codemirror: vscodeDark, // Can be customized
        colors: {
            primary: '#BD93F9',
            background: '#282A36',
            surface: '#21222C',
            text: '#F8F8F2'
        }
    },
    'monokai': {
        name: 'Monokai Pro',
        codemirror: vscodeDark, // Can be customized
        colors: {
            primary: '#A9DC76',
            background: '#2D2A2E',
            surface: '#221F22',
            text: '#FCFCFA'
        }
    },
    'nord': {
        name: 'Nord',
        codemirror: vscodeDark, // Can be customized
        colors: {
            primary: '#88C0D0',
            background: '#2E3440',
            surface: '#3B4252',
            text: '#ECEFF4'
        }
    },
    'tokyo-night': {
        name: 'Tokyo Night',
        codemirror: vscodeDark, // Can be customized
        colors: {
            primary: '#7AA2F7',
            background: '#1A1B26',
            surface: '#24283B',
            text: '#C0CAF5'
        }
    },
    'synthwave': {
        name: 'Synthwave 84',
        codemirror: vscodeDark, // Can be customized
        colors: {
            primary: '#FF7EDB',
            background: '#262335',
            surface: '#2B2042',
            text: '#F8F8F2'
        }
    },
    'light': {
        name: 'Light',
        codemirror: [], // Default light theme
        colors: {
            primary: '#0078D4',
            background: '#FFFFFF',
            surface: '#F3F3F3',
            text: '#000000'
        }
    }
};

export const getThemeColors = (themeName) => {
    return editorThemes[themeName]?.colors || editorThemes['vscode-dark'].colors;
};

export const getThemeCodemirror = (themeName) => {
    return editorThemes[themeName]?.codemirror || vscodeDark;
};

export const themesList = Object.entries(editorThemes).map(([id, theme]) => ({
    id,
    name: theme.name,
    colors: theme.colors
}));
