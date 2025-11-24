import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import clsx from 'clsx';
import { themesList } from '../utils/themes';

const ThemeSelector = ({ currentTheme, onThemeChange, isOpen, onClose }) => {
    const [hoveredTheme, setHoveredTheme] = useState(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-4xl mx-4 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 bg-gradient-to-r from-purple-600/10 to-pink-600/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
                            <Palette className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">Choose Your Theme</h2>
                            <p className="text-xs text-text-secondary">Select a theme to customize your editor's appearance</p>
                        </div>
                    </div>
                </div>

                {/* Theme Grid */}
                <div className="p-6 max-h-[600px] overflow-y-auto scrollbar-thin">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {themesList.map((theme) => {
                            const isSelected = currentTheme === theme.id;
                            const isHovered = hoveredTheme === theme.id;

                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => {
                                        onThemeChange(theme.id);
                                        onClose();
                                    }}
                                    onMouseEnter={() => setHoveredTheme(theme.id)}
                                    onMouseLeave={() => setHoveredTheme(null)}
                                    className={clsx(
                                        "relative group text-left rounded-xl overflow-hidden transition-all duration-300 border-2",
                                        isSelected
                                            ? "border-primary shadow-lg shadow-primary/30 scale-105"
                                            : "border-white/10 hover:border-primary/50 hover:scale-102"
                                    )}
                                >
                                    {/* Theme Preview */}
                                    <div
                                        className="h-32 p-4 relative overflow-hidden"
                                        style={{
                                            background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 100%)`
                                        }}
                                    >
                                        {/* Simulated Code Preview */}
                                        <div className="space-y-2 font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <span style={{ color: theme.colors.primary }}>function</span>
                                                <span style={{ color: theme.colors.text }}>hello() {'{}'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 pl-4">
                                                <span style={{ color: theme.colors.primary }}>const</span>
                                                <span style={{ color: theme.colors.text }}>name = </span>
                                                <span style={{ color: '#CE9178' }}>"World"</span>
                                            </div>
                                            <div className="flex items-center gap-2 pl-4">
                                                <span style={{ color: theme.colors.primary }}>return</span>
                                                <span style={{ color: theme.colors.text }}>name</span>
                                            </div>
                                        </div>

                                        {/* Selection Indicator */}
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                                                <Check className="w-5 h-5 text-white" />
                                            </div>
                                        )}

                                        {/* Hover Effect */}
                                        {isHovered && !isSelected && (
                                            <div className="absolute inset-0 bg-primary/10 backdrop-blur-[1px]" />
                                        )}

                                        {/* Color Palette */}
                                        <div className="absolute bottom-2 left-2 flex gap-1">
                                            <div
                                                className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                                                style={{ backgroundColor: theme.colors.primary }}
                                                title="Primary"
                                            />
                                            <div
                                                className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                                                style={{ backgroundColor: theme.colors.background }}
                                                title="Background"
                                            />
                                            <div
                                                className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                                                style={{ backgroundColor: theme.colors.surface }}
                                                title="Surface"
                                            />
                                        </div>
                                    </div>

                                    {/* Theme Info */}
                                    <div className="p-4 bg-surface-light border-t border-white/5">
                                        <h3 className="font-bold text-sm text-text-primary mb-1 flex items-center gap-2">
                                            {theme.name}
                                            {isSelected && (
                                                <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                    Active
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-xs text-text-muted">
                                            {isHovered ? 'Click to apply' : 'Hover to preview'}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/5 bg-surface-light/30 flex items-center justify-between">
                    <div className="text-xs text-text-muted">
                        {themesList.length} themes available
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-text-primary rounded-lg text-sm font-medium transition-all border border-white/10"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThemeSelector;
