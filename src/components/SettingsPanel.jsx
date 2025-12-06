/**
 * Settings Panel Component
 * VS Code-style comprehensive settings dialog
 */

import React, { useState, useEffect } from 'react';
import { X, Search, Monitor, Edit3, Keyboard, Palette, Code, Video, Shield, Settings2, ChevronRight, Check, RotateCcw } from 'lucide-react';
import clsx from 'clsx';

// Default settings
const defaultSettings = {
  // Appearance
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'JetBrains Mono',
  lineHeight: 1.5,
  cursorStyle: 'line',
  cursorBlinking: 'blink',
  
  // Editor
  tabSize: 2,
  insertSpaces: true,
  wordWrap: 'off',
  autoSave: 'off',
  autoSaveDelay: 1000,
  formatOnSave: false,
  formatOnPaste: false,
  trimTrailingWhitespace: false,
  insertFinalNewline: false,
  minimap: true,
  lineNumbers: 'on',
  renderWhitespace: 'selection',
  bracketPairColorization: true,
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  autoIndent: 'full',
  
  // Keybindings
  keybindingPreset: 'default',
  
  // Whiteboard
  gridSize: 10,
  snapToGrid: true,
  showRulers: true,
  showGuides: true,
  
  // Video/Audio
  defaultCamera: '',
  defaultMicrophone: '',
  defaultSpeaker: '',
  videoQuality: 'auto',
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
  notificationSounds: true,
  
  // Privacy
  allowRecording: true,
  allowTranscription: true,
  
  // Advanced
  telemetry: true,
  debugLogging: false,
};

// Settings categories
const categories = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'editor', label: 'Editor', icon: Edit3 },
  { id: 'keybindings', label: 'Keyboard', icon: Keyboard },
  { id: 'whiteboard', label: 'Whiteboard', icon: Monitor },
  { id: 'video', label: 'Video & Audio', icon: Video },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'advanced', label: 'Advanced', icon: Settings2 },
];

// Font families
const fontFamilies = [
  'JetBrains Mono',
  'Fira Code',
  'Consolas',
  'Monaco',
  'Menlo',
  'Source Code Pro',
  'Ubuntu Mono',
  'Roboto Mono',
];

// Themes
const themes = [
  { id: 'dark', label: 'Dark+ (Default Dark)', preview: '#1e1e1e' },
  { id: 'light', label: 'Light+ (Default Light)', preview: '#ffffff' },
  { id: 'high-contrast', label: 'High Contrast', preview: '#000000' },
  { id: 'solarized-dark', label: 'Solarized Dark', preview: '#002b36' },
  { id: 'dracula', label: 'Dracula', preview: '#282a36' },
  { id: 'one-dark', label: 'One Dark Pro', preview: '#282c34' },
];

// Setting input components
const SettingToggle = ({ value, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5">
    <div>
      <div className="text-sm font-medium text-white">{label}</div>
      {description && <div className="text-xs text-gray-400 mt-0.5">{description}</div>}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={clsx(
        'relative w-11 h-6 rounded-full transition-colors',
        value ? 'bg-blue-500' : 'bg-gray-600'
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform',
          value && 'translate-x-5'
        )}
      />
    </button>
  </div>
);

const SettingSelect = ({ value, onChange, label, description, options }) => (
  <div className="py-3 border-b border-white/5">
    <div className="text-sm font-medium text-white mb-1">{label}</div>
    {description && <div className="text-xs text-gray-400 mb-2">{description}</div>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-700 text-white text-sm rounded-md px-3 py-2 border border-white/10 focus:border-blue-500 focus:outline-none"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const SettingSlider = ({ value, onChange, label, description, min, max, step = 1, unit = '' }) => (
  <div className="py-3 border-b border-white/5">
    <div className="flex justify-between items-center mb-1">
      <div className="text-sm font-medium text-white">{label}</div>
      <div className="text-sm text-gray-400">{value}{unit}</div>
    </div>
    {description && <div className="text-xs text-gray-400 mb-2">{description}</div>}
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
    />
  </div>
);

const SettingInput = ({ value, onChange, label, description, type = 'text', placeholder }) => (
  <div className="py-3 border-b border-white/5">
    <div className="text-sm font-medium text-white mb-1">{label}</div>
    {description && <div className="text-xs text-gray-400 mb-2">{description}</div>}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      placeholder={placeholder}
      className="w-full bg-gray-700 text-white text-sm rounded-md px-3 py-2 border border-white/10 focus:border-blue-500 focus:outline-none"
    />
  </div>
);

// Settings panel content for each category
const AppearanceSettings = ({ settings, updateSetting }) => (
  <div>
    <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
    
    <div className="mb-6">
      <div className="text-sm font-medium text-white mb-3">Color Theme</div>
      <div className="grid grid-cols-2 gap-2">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => updateSetting('theme', theme.id)}
            className={clsx(
              'flex items-center gap-3 p-3 rounded-lg border transition-colors',
              settings.theme === theme.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/10 hover:border-white/20'
            )}
          >
            <div
              className="w-8 h-8 rounded border border-white/20"
              style={{ backgroundColor: theme.preview }}
            />
            <span className="text-sm text-white">{theme.label}</span>
            {settings.theme === theme.id && (
              <Check className="w-4 h-4 text-blue-500 ml-auto" />
            )}
          </button>
        ))}
      </div>
    </div>

    <SettingSelect
      label="Font Family"
      value={settings.fontFamily}
      onChange={(v) => updateSetting('fontFamily', v)}
      options={fontFamilies.map((f) => ({ value: f, label: f }))}
    />

    <SettingSlider
      label="Font Size"
      value={settings.fontSize}
      onChange={(v) => updateSetting('fontSize', v)}
      min={8}
      max={32}
      unit="px"
    />

    <SettingSlider
      label="Line Height"
      value={settings.lineHeight}
      onChange={(v) => updateSetting('lineHeight', v)}
      min={1}
      max={3}
      step={0.1}
    />

    <SettingSelect
      label="Cursor Style"
      value={settings.cursorStyle}
      onChange={(v) => updateSetting('cursorStyle', v)}
      options={[
        { value: 'line', label: 'Line' },
        { value: 'block', label: 'Block' },
        { value: 'underline', label: 'Underline' },
      ]}
    />

    <SettingSelect
      label="Cursor Blinking"
      value={settings.cursorBlinking}
      onChange={(v) => updateSetting('cursorBlinking', v)}
      options={[
        { value: 'blink', label: 'Blink' },
        { value: 'smooth', label: 'Smooth' },
        { value: 'phase', label: 'Phase' },
        { value: 'expand', label: 'Expand' },
        { value: 'solid', label: 'Solid' },
      ]}
    />
  </div>
);

const EditorSettings = ({ settings, updateSetting }) => (
  <div>
    <h3 className="text-lg font-semibold text-white mb-4">Editor</h3>

    <SettingSlider
      label="Tab Size"
      value={settings.tabSize}
      onChange={(v) => updateSetting('tabSize', v)}
      min={1}
      max={8}
      description="The number of spaces a tab is equal to"
    />

    <SettingToggle
      label="Insert Spaces"
      value={settings.insertSpaces}
      onChange={(v) => updateSetting('insertSpaces', v)}
      description="Insert spaces when pressing Tab"
    />

    <SettingSelect
      label="Word Wrap"
      value={settings.wordWrap}
      onChange={(v) => updateSetting('wordWrap', v)}
      options={[
        { value: 'off', label: 'Off' },
        { value: 'on', label: 'On' },
        { value: 'wordWrapColumn', label: 'Word Wrap Column' },
        { value: 'bounded', label: 'Bounded' },
      ]}
    />

    <SettingSelect
      label="Auto Save"
      value={settings.autoSave}
      onChange={(v) => updateSetting('autoSave', v)}
      options={[
        { value: 'off', label: 'Off' },
        { value: 'afterDelay', label: 'After Delay' },
        { value: 'onFocusChange', label: 'On Focus Change' },
        { value: 'onWindowChange', label: 'On Window Change' },
      ]}
    />

    {settings.autoSave === 'afterDelay' && (
      <SettingSlider
        label="Auto Save Delay"
        value={settings.autoSaveDelay}
        onChange={(v) => updateSetting('autoSaveDelay', v)}
        min={100}
        max={5000}
        step={100}
        unit="ms"
      />
    )}

    <SettingToggle
      label="Format On Save"
      value={settings.formatOnSave}
      onChange={(v) => updateSetting('formatOnSave', v)}
      description="Format a file on save"
    />

    <SettingToggle
      label="Format On Paste"
      value={settings.formatOnPaste}
      onChange={(v) => updateSetting('formatOnPaste', v)}
      description="Format pasted content"
    />

    <SettingToggle
      label="Trim Trailing Whitespace"
      value={settings.trimTrailingWhitespace}
      onChange={(v) => updateSetting('trimTrailingWhitespace', v)}
      description="Remove trailing whitespace on save"
    />

    <SettingToggle
      label="Insert Final Newline"
      value={settings.insertFinalNewline}
      onChange={(v) => updateSetting('insertFinalNewline', v)}
      description="Insert a final newline at end of file"
    />

    <SettingToggle
      label="Minimap"
      value={settings.minimap}
      onChange={(v) => updateSetting('minimap', v)}
      description="Show code minimap"
    />

    <SettingSelect
      label="Line Numbers"
      value={settings.lineNumbers}
      onChange={(v) => updateSetting('lineNumbers', v)}
      options={[
        { value: 'on', label: 'On' },
        { value: 'off', label: 'Off' },
        { value: 'relative', label: 'Relative' },
        { value: 'interval', label: 'Interval' },
      ]}
    />

    <SettingSelect
      label="Render Whitespace"
      value={settings.renderWhitespace}
      onChange={(v) => updateSetting('renderWhitespace', v)}
      options={[
        { value: 'none', label: 'None' },
        { value: 'selection', label: 'Selection' },
        { value: 'trailing', label: 'Trailing' },
        { value: 'boundary', label: 'Boundary' },
        { value: 'all', label: 'All' },
      ]}
    />

    <SettingToggle
      label="Bracket Pair Colorization"
      value={settings.bracketPairColorization}
      onChange={(v) => updateSetting('bracketPairColorization', v)}
      description="Enable bracket pair colorization"
    />

    <SettingSelect
      label="Auto Closing Brackets"
      value={settings.autoClosingBrackets}
      onChange={(v) => updateSetting('autoClosingBrackets', v)}
      options={[
        { value: 'always', label: 'Always' },
        { value: 'languageDefined', label: 'Language Defined' },
        { value: 'beforeWhitespace', label: 'Before Whitespace' },
        { value: 'never', label: 'Never' },
      ]}
    />
  </div>
);

const KeybindingsSettings = ({ settings, updateSetting }) => (
  <div>
    <h3 className="text-lg font-semibold text-white mb-4">Keyboard Shortcuts</h3>

    <SettingSelect
      label="Keybinding Preset"
      value={settings.keybindingPreset}
      onChange={(v) => updateSetting('keybindingPreset', v)}
      options={[
        { value: 'default', label: 'Default (VS Code)' },
        { value: 'vim', label: 'Vim' },
        { value: 'emacs', label: 'Emacs' },
        { value: 'sublime', label: 'Sublime Text' },
      ]}
    />

    <div className="mt-6">
      <div className="text-sm font-medium text-white mb-3">Common Shortcuts</div>
      <div className="space-y-2 text-sm">
        {[
          { action: 'Save', shortcut: 'Ctrl+S' },
          { action: 'Undo', shortcut: 'Ctrl+Z' },
          { action: 'Redo', shortcut: 'Ctrl+Y' },
          { action: 'Find', shortcut: 'Ctrl+F' },
          { action: 'Replace', shortcut: 'Ctrl+H' },
          { action: 'Command Palette', shortcut: 'Ctrl+Shift+P' },
          { action: 'Quick Open', shortcut: 'Ctrl+P' },
          { action: 'Go to Line', shortcut: 'Ctrl+G' },
          { action: 'Toggle Comment', shortcut: 'Ctrl+/' },
          { action: 'Format Document', shortcut: 'Shift+Alt+F' },
          { action: 'Go to Definition', shortcut: 'F12' },
          { action: 'Find References', shortcut: 'Shift+F12' },
          { action: 'Rename Symbol', shortcut: 'F2' },
        ].map(({ action, shortcut }) => (
          <div key={action} className="flex justify-between items-center py-2 px-3 bg-gray-800/50 rounded">
            <span className="text-gray-300">{action}</span>
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">{shortcut}</kbd>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const WhiteboardSettings = ({ settings, updateSetting }) => (
  <div>
    <h3 className="text-lg font-semibold text-white mb-4">Whiteboard</h3>

    <SettingSlider
      label="Grid Size"
      value={settings.gridSize}
      onChange={(v) => updateSetting('gridSize', v)}
      min={5}
      max={50}
      unit="px"
      description="Size of the grid cells"
    />

    <SettingToggle
      label="Snap to Grid"
      value={settings.snapToGrid}
      onChange={(v) => updateSetting('snapToGrid', v)}
      description="Snap objects to grid when moving"
    />

    <SettingToggle
      label="Show Rulers"
      value={settings.showRulers}
      onChange={(v) => updateSetting('showRulers', v)}
      description="Show rulers on canvas edges"
    />

    <SettingToggle
      label="Show Guides"
      value={settings.showGuides}
      onChange={(v) => updateSetting('showGuides', v)}
      description="Show alignment guides when moving objects"
    />
  </div>
);

const VideoSettings = ({ settings, updateSetting }) => {
  const [devices, setDevices] = useState({ audio: [], video: [], speakers: [] });

  useEffect(() => {
    // Get available devices
    navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
      const audio = [];
      const video = [];
      const speakers = [];

      deviceInfos.forEach((device) => {
        if (device.kind === 'audioinput') {
          audio.push({ value: device.deviceId, label: device.label || `Microphone ${audio.length + 1}` });
        } else if (device.kind === 'videoinput') {
          video.push({ value: device.deviceId, label: device.label || `Camera ${video.length + 1}` });
        } else if (device.kind === 'audiooutput') {
          speakers.push({ value: device.deviceId, label: device.label || `Speaker ${speakers.length + 1}` });
        }
      });

      setDevices({ audio, video, speakers });
    }).catch(() => {
      // Permission denied or error
    });
  }, []);

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Video & Audio</h3>

      <SettingSelect
        label="Camera"
        value={settings.defaultCamera}
        onChange={(v) => updateSetting('defaultCamera', v)}
        options={[{ value: '', label: 'Default' }, ...devices.video]}
      />

      <SettingSelect
        label="Microphone"
        value={settings.defaultMicrophone}
        onChange={(v) => updateSetting('defaultMicrophone', v)}
        options={[{ value: '', label: 'Default' }, ...devices.audio]}
      />

      <SettingSelect
        label="Speaker"
        value={settings.defaultSpeaker}
        onChange={(v) => updateSetting('defaultSpeaker', v)}
        options={[{ value: '', label: 'Default' }, ...devices.speakers]}
      />

      <SettingSelect
        label="Video Quality"
        value={settings.videoQuality}
        onChange={(v) => updateSetting('videoQuality', v)}
        options={[
          { value: 'auto', label: 'Auto' },
          { value: '1080p', label: '1080p (HD)' },
          { value: '720p', label: '720p' },
          { value: '480p', label: '480p' },
          { value: '360p', label: '360p (Low)' },
        ]}
      />

      <SettingToggle
        label="Noise Suppression"
        value={settings.noiseSuppression}
        onChange={(v) => updateSetting('noiseSuppression', v)}
        description="Reduce background noise"
      />

      <SettingToggle
        label="Echo Cancellation"
        value={settings.echoCancellation}
        onChange={(v) => updateSetting('echoCancellation', v)}
        description="Reduce echo during calls"
      />

      <SettingToggle
        label="Auto Gain Control"
        value={settings.autoGainControl}
        onChange={(v) => updateSetting('autoGainControl', v)}
        description="Automatically adjust microphone volume"
      />

      <SettingToggle
        label="Notification Sounds"
        value={settings.notificationSounds}
        onChange={(v) => updateSetting('notificationSounds', v)}
        description="Play sounds for notifications"
      />
    </div>
  );
};

const PrivacySettings = ({ settings, updateSetting }) => (
  <div>
    <h3 className="text-lg font-semibold text-white mb-4">Privacy</h3>

    <SettingToggle
      label="Allow Recording"
      value={settings.allowRecording}
      onChange={(v) => updateSetting('allowRecording', v)}
      description="Allow call recording by meeting host"
    />

    <SettingToggle
      label="Allow Transcription"
      value={settings.allowTranscription}
      onChange={(v) => updateSetting('allowTranscription', v)}
      description="Allow automatic transcription of your voice"
    />
  </div>
);

const AdvancedSettings = ({ settings, updateSetting, onReset }) => (
  <div>
    <h3 className="text-lg font-semibold text-white mb-4">Advanced</h3>

    <SettingToggle
      label="Telemetry"
      value={settings.telemetry}
      onChange={(v) => updateSetting('telemetry', v)}
      description="Send usage statistics to improve the app"
    />

    <SettingToggle
      label="Debug Logging"
      value={settings.debugLogging}
      onChange={(v) => updateSetting('debugLogging', v)}
      description="Enable detailed logging for debugging"
    />

    <div className="mt-6 pt-4 border-t border-white/10">
      <button
        onClick={onReset}
        className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Reset All Settings to Default
      </button>
    </div>

    <div className="mt-6 pt-4 border-t border-white/10">
      <button
        onClick={() => localStorage.clear()}
        className="flex items-center gap-2 px-4 py-2 text-sm text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition-colors"
      >
        Clear Local Storage Cache
      </button>
    </div>
  </div>
);

// Main Settings Panel Component
const SettingsPanel = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('app-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });
  const [activeCategory, setActiveCategory] = useState('appearance');
  const [searchQuery, setSearchQuery] = useState('');

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('app-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setSettings(defaultSettings);
    }
  };

  if (!isOpen) return null;

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'appearance':
        return <AppearanceSettings settings={settings} updateSetting={updateSetting} />;
      case 'editor':
        return <EditorSettings settings={settings} updateSetting={updateSetting} />;
      case 'keybindings':
        return <KeybindingsSettings settings={settings} updateSetting={updateSetting} />;
      case 'whiteboard':
        return <WhiteboardSettings settings={settings} updateSetting={updateSetting} />;
      case 'video':
        return <VideoSettings settings={settings} updateSetting={updateSetting} />;
      case 'privacy':
        return <PrivacySettings settings={settings} updateSetting={updateSetting} />;
      case 'advanced':
        return <AdvancedSettings settings={settings} updateSetting={updateSetting} onReset={resetSettings} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[900px] max-w-[95vw] h-[700px] max-h-[90vh] bg-gray-900 rounded-xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-white/10 focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-56 border-r border-white/10 p-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    activeCategory === category.id
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.label}</span>
                  {activeCategory === category.id && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderCategoryContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export { SettingsPanel, defaultSettings };
export default SettingsPanel;
