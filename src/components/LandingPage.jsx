import React, { useState } from 'react';
import GridMotion from './GridMotion/GridMotion';
import { Code2, ArrowRight, CheckCircle, Users, Zap, Shield, Globe, Monitor, Cpu } from 'lucide-react';
import Button from './ui/Button';
import Card, { CardBody } from './ui/Card';
import Badge from './ui/Badge';
import RoomCreation from './RoomCreation';

const LandingPage = ({ onEnter }) => {
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

    const items = [
        'React', 'Vite', 'Tailwind', 'Node.js', 'Socket.io', 'Yjs', 'WebRTC',
        'Collaborate', 'Real-time', 'Code', 'Share', 'Build', 'Deploy', 'Scale',
        'JavaScript', 'TypeScript', 'HTML', 'CSS', 'MongoDB', 'Express', 'Docker',
        'Git', 'GitHub', 'VS Code', 'Atom', 'Sublime', 'Vim', 'Emacs'
    ];

    const features = [
        {
            icon: <Globe className="w-6 h-6 text-primary" />,
            title: 'Real-time Collaboration',
            description: 'Code together with your team in real-time with low latency synchronization.'
        },
        {
            icon: <Monitor className="w-6 h-6 text-secondary" />,
            title: 'Video Conferencing',
            description: 'Built-in high quality video and audio calls to discuss code while you write it.'
        },
        {
            icon: <Cpu className="w-6 h-6 text-accent" />,
            title: 'Integrated AI',
            description: 'Get intelligent code suggestions, explanations and refactoring from our AI assistant.'
        }
    ];

    const stats = [
        { label: 'Active Users', value: '10k+' },
        { label: 'Rooms Created', value: '50k+' },
        { label: 'Lines of Code', value: '1M+' },
    ];

    return (
        <div className="relative w-full min-h-screen overflow-x-hidden bg-background">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <GridMotion items={items} gradientColor="var(--color-primary)" />
            </div>

            {/* Navbar */}
            <nav className="relative z-20 container mx-auto px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Code2 className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-text-primary">DevSync</span>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">Features</a>
                    <a href="#about" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">About</a>
                    <a href="#pricing" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">Pricing</a>
                    <Button variant="ghost" onClick={onEnter}>Sign In</Button>
                    <Button onClick={() => setIsRoomModalOpen(true)}>Get Started</Button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 container mx-auto px-6 pt-20 pb-32">
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto animate-fade-in">
                    <Badge variant="outlined" color="primary" className="mb-6">
                        <span className="flex items-center gap-2">
                            <Zap className="w-3 h-3" /> v2.0 is now live
                        </span>
                    </Badge>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
                        Code together, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">now.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-text-secondary max-w-2xl mb-12 leading-relaxed">
                        The most advanced collaborative coding environment. Real-time sync, video chat, whiteboard, and AI assistance - all in one active tab.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <Button size="lg" onClick={() => setIsRoomModalOpen(true)}>
                            Start Coding Now
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <Button size="lg" variant="secondary" onClick={onEnter}>
                            Join Existing Room
                        </Button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="grid grid-cols-3 gap-12 mt-20 border-t border-white/10 pt-10">
                        {stats.map((stat, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <span className="text-2xl font-bold text-text-primary">{stat.value}</span>
                                <span className="text-sm text-text-secondary uppercase tracking-wider font-medium">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Features Grid */}
                <div id="features" className="mt-32">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Everything you need to ship faster</h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">Powerful features built for modern development teams.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <Card key={index} hoverable className="glass-panel border-none bg-surface/50">
                                <CardBody className="text-center">
                                    <div className="mb-6 inline-flex p-3 rounded-2xl bg-surface shadow-inner">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                    <p className="text-text-secondary leading-relaxed">
                                        {feature.description}
                                    </p>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>

            <RoomCreation
                isOpen={isRoomModalOpen}
                onClose={() => setIsRoomModalOpen(false)}
            />
        </div>
    );
};

export default LandingPage;
