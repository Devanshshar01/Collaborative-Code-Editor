import React, { useState } from 'react';
import { Users, Lock, Globe, Code, FileText } from 'lucide-react';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';
import { useToast } from '../hooks/useToast';

const LANGUAGES = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'html', label: 'HTML/CSS' },
];

const RoomCreation = ({ isOpen, onClose }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        language: 'javascript',
        privacy: 'public',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Room name is required');
            return;
        }

        setIsLoading(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Generate room ID
            const roomId = `room-${Math.random().toString(36).substr(2, 9)}`;
            const roomUrl = `${window.location.origin}?room=${roomId}`;

            toast.success('Room created successfully!');
            onClose();

            // Navigate to room (in this app structure it seems to simply reload/update URL)
            window.location.href = roomUrl;

        } catch (error) {
            toast.error('Failed to create room. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Room"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    label="Room Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Daily Standup, Project Alpha"
                    leftIcon={<Users size={18} />}
                    maxLength={50}
                    showCount
                    required
                />

                <Input
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="What is this room for?"
                    leftIcon={<FileText size={18} />}
                    maxLength={100}
                    showCount
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary block">
                        Language
                    </label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
                            <Code size={18} />
                        </div>
                        <select
                            name="language"
                            value={formData.language}
                            onChange={handleChange}
                            className="w-full bg-background-secondary border border-border rounded-md pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang.value} value={lang.value}>
                                    {lang.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary block">
                        Privacy
                    </label>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, privacy: 'public' }))}
                            className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${formData.privacy === 'public'
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-surface border-border hover:border-text-secondary'
                                }`}
                        >
                            <Globe size={18} />
                            Public
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, privacy: 'private' }))}
                            className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${formData.privacy === 'private'
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-surface border-border hover:border-text-secondary'
                                }`}
                        >
                            <Lock size={18} />
                            Private
                        </button>
                    </div>
                </div>

                {formData.privacy === 'private' && (
                    <Input
                        label="Password (Optional)"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Secure your room"
                        leftIcon={<Lock size={18} />}
                    />
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        isLoading={isLoading}
                    >
                        Create Room
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default RoomCreation;
