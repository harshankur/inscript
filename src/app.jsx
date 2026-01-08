import { Extension, Node } from '@tiptap/core';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TiptapImage from '@tiptap/extension-image';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { BubbleMenu, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import axios from 'axios';
import * as Diff from 'diff';
import {
    Activity,
    ALargeSmall,
    AlertCircle,
    AlertTriangle,
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
    Clock,
    Code,
    Cpu,
    Database,
    Edit3,
    Eye,
    FileText,
    Filter,
    GitCommit,
    Globe,
    Heading1,
    Heading2,
    Highlighter,
    Image as ImageIcon,
    Info,
    Italic,
    Layout,
    List,
    ListOrdered,
    Monitor,
    Palette,
    PanelLeftClose,
    PanelLeftOpen,
    Pin,
    Plus,
    Quote,
    Redo,
    Save,
    Settings,
    Share2,
    SortAsc,
    SortDesc,
    Strikethrough,
    Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon,
    Tag,
    Trash2,
    Underline as UnderlineIcon,
    Undo,
    UploadCloud,
    X,
    XCircle,
    Youtube as YoutubeIcon
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

const Youtube = Node.create({
    name: 'youtube',
    group: 'block',
    selectable: true,
    draggable: true,
    atom: true,

    addAttributes() {
        return {
            'data-youtube-video': {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-youtube-video]',
            },
            {
                tag: 'iframe[src*="youtube.com"]',
                getAttrs: node => {
                    const src = node.getAttribute('src');
                    if (!src) return false;
                    const match = src.match(/(?:embed\/|v=)([^&?/\s]+)/);
                    return match ? { 'data-youtube-video': match[1] } : false;
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        const id = HTMLAttributes['data-youtube-video'];
        return [
            'div',
            {
                'data-youtube-video': id,
                class: 'youtube-embed relative w-full aspect-video rounded-lg overflow-hidden my-4 bg-zinc-800',
            },
            [
                'iframe',
                {
                    src: `https://www.youtube.com/embed/${id}`,
                    title: 'YouTube video player',
                    frameborder: '0',
                    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
                    allowfullscreen: 'true',
                    class: 'absolute top-0 left-0 w-full h-full',
                },
            ],
        ];
    },

    addCommands() {
        return {
            setYoutubeVideo: options => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
        };
    },
});

const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() {
        return {
            types: ['textStyle'],
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize.replace('px', ''),
                        renderHTML: attributes => {
                            if (!attributes.fontSize) {
                                return {};
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}px`,
                            };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setFontSize: fontSize => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize })
                    .run();
            },
            unsetFontSize: () => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize: null })
                    .removeEmptyTextStyle()
                    .run();
            },
        };
    },
});


const MetadataModal = ({ isOpen, onClose, tags, categories, postTags, postCategories, onTagsChange, onCategoriesChange }) => {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState('tags'); // 'tags' | 'categories'
    const [search, setSearch] = useState('');

    const currentItems = activeTab === 'tags' ? tags : categories;
    const currentSelected = activeTab === 'tags' ? postTags : postCategories;
    const onChange = activeTab === 'tags' ? onTagsChange : onCategoriesChange;

    const filteredItems = currentItems.filter(item => item.toLowerCase().includes(search.toLowerCase()));

    const toggleItem = (item) => {
        if (currentSelected.includes(item)) {
            onChange(currentSelected.filter(i => i !== item));
        } else {
            onChange([...currentSelected, item]);
        }
    };

    const handleCreate = () => {
        if (!search) return;
        // Check if already exists (case insensitive)
        const existing = currentItems.find(i => i.toLowerCase() === search.toLowerCase());
        if (existing) {
            if (!currentSelected.includes(existing)) toggleItem(existing);
        } else {
            // New item
            toggleItem(search);
        }
        setSearch('');
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <h2 className="text-lg font-bold text-zinc-100">Metadata</h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 border-b border-zinc-800">
                    <button
                        onClick={() => { setActiveTab('tags'); setSearch(''); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'tags' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Tags ({postTags.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('categories'); setSearch(''); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'categories' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Categories ({postCategories.length})
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-zinc-800">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Search or create ${activeTab}...`}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                        autoFocus
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {search && filteredItems.length === 0 && (
                        <button
                            onClick={handleCreate}
                            className="w-full py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all font-bold flex items-center justify-center gap-2 mb-4"
                        >
                            <Plus size={16} />
                            Create "{search}"
                        </button>
                    )}

                    <div className="mb-2 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                        {search ? 'Matching Results' : 'Available Items'}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {filteredItems.map(item => (
                            <button
                                key={item}
                                onClick={() => toggleItem(item)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${currentSelected.includes(item)
                                    ? 'bg-emerald-500 text-black border-emerald-500'
                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
                                    }`}
                            >
                                {item}
                            </button>
                        ))}
                        {filteredItems.length === 0 && !search && (
                            <span className="text-zinc-500 text-sm italic">No items found.</span>
                        )}
                    </div>
                </div>

                {/* Footer (Selected Summary) */}
                <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 text-xs text-zinc-500">
                    Selected: {currentSelected.length > 0 ? currentSelected.join(', ') : 'None'}
                </div>
            </div>
        </div>
    );
};

const ImageSelectorModal = ({ isOpen, onClose, images, onSelect, onUpload }) => {
    if (!isOpen) return null;

    const [search, setSearch] = useState('');
    const filteredImages = images.filter(img => img.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col h-[80vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <h2 className="text-lg font-bold text-zinc-100">Media Library</h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-zinc-800 flex gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search images..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                            autoFocus
                        />
                        <div className="absolute left-3 top-2.5 text-zinc-500">
                            <Filter size={16} />
                        </div>
                    </div>
                    <label className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/20">
                        <Plus size={18} />
                        <span>Upload New</span>
                        <input type="file" className="hidden" onChange={onUpload} accept="image/*" />
                    </label>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 bg-zinc-950/30">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredImages.map((img) => (
                            <button
                                key={img.url}
                                onClick={() => onSelect(img.url)}
                                className="group relative aspect-square bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-emerald-500 transition-all hover:scale-[1.02]"
                            >
                                <img
                                    src={img.url}
                                    alt={img.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-xs text-white truncate font-medium">{img.name}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                    {filteredImages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
                            <ImageIcon size={48} className="opacity-20" />
                            <p>No images found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TOOLBAR_SIZES = {
    BUTTON: 38,
    DIVIDER: 12,
    CUSTOM: 48, // For selectors with text/extra icons
    GAP: 4
};

const ToolbarButton = ({ onClick, active, disabled, children, title, className = "", width = TOOLBAR_SIZES.BUTTON }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        style={{ width: `${width}px`, height: `${TOOLBAR_SIZES.BUTTON}px` }}
        className={`flex items-center justify-center rounded transition-colors shrink-0 ${active ? 'bg-zinc-800 text-white shadow-inner' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            } ${disabled ? 'opacity-20 cursor-not-allowed grayscale' : ''} ${className}`}
    >
        {children}
    </button>
);

const ColorSelector = ({ icon: Icon, title, activeColor, onChange, onRemove, presets, variant = 'text' }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <ToolbarButton
                onClick={() => setIsOpen(!isOpen)}
                active={!!activeColor}
                title={title}
            >
                <div className="relative flex items-center justify-center">
                    <Icon size={18} style={{ color: variant === 'text' ? activeColor : undefined }} />
                    {variant === 'highlight' && activeColor && (
                        <span className="absolute -bottom-1 left-0 right-0 h-1 rounded-sm" style={{ backgroundColor: activeColor }} />
                    )}
                </div>
            </ToolbarButton>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[70]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full right-0 md:left-1/2 md:-translate-x-1/2 mt-2 p-3 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-[80] min-w-[200px] animate-in slide-in-from-top-2 fade-in">
                        <div className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Presets</div>
                        <div className="grid grid-cols-5 gap-1.5 mb-3">
                            {presets.map(color => (
                                <button
                                    key={color}
                                    onClick={() => { onChange(color); setIsOpen(false); }}
                                    className={`w-6 h-6 rounded border ${activeColor === color ? 'border-white ring-1 ring-white' : 'border-zinc-700 hover:scale-110 active:scale-95'} transition-all`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>

                        <div className="h-px bg-zinc-800 my-2" />

                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white cursor-pointer px-1 py-1 rounded hover:bg-zinc-800 transition-colors">
                                <div className="w-5 h-5 rounded border border-zinc-600 bg-gradient-to-br from-red-500 via-green-500 to-blue-500 relative overflow-hidden flex items-center justify-center">
                                    <input
                                        type="color"
                                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                        value={activeColor || '#000000'}
                                        onChange={(e) => { onChange(e.target.value); }}
                                    />
                                </div>
                                <span>Custom Color...</span>
                            </label>

                            <button
                                onClick={() => { onRemove(); setIsOpen(false); }}
                                className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 px-1 py-1 rounded hover:bg-red-400/10 transition-colors"
                            >
                                <XCircle size={14} />
                                <span>{variant === 'text' ? 'Reset to Default' : 'No Highlight'}</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const FontSizeSelector = ({ editor }) => {
    const [isOpen, setIsOpen] = useState(false);
    const sizes = [12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72];
    const currentSize = editor?.getAttributes('textStyle')?.fontSize;

    return (
        <div className="relative">
            <ToolbarButton
                onClick={() => setIsOpen(!isOpen)}
                active={!!currentSize}
                title="Font Size"
                width={TOOLBAR_SIZES.CUSTOM}
            >
                <div className="flex items-center justify-center gap-0.5">
                    <ALargeSmall size={16} />
                    {currentSize && <span className="text-[10px] font-bold">{currentSize}</span>}
                </div>
            </ToolbarButton>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[70]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-[80] flex flex-col min-w-[80px] max-h-[200px] overflow-y-auto animate-in slide-in-from-top-2 fade-in">
                        {sizes.map(size => (
                            <button
                                key={size}
                                onClick={() => { editor.chain().focus().setFontSize(size).run(); setIsOpen(false); }}
                                className={`px-3 py-2 text-left hover:bg-zinc-800 transition-colors text-sm flex items-center justify-between ${currentSize == size ? 'text-white bg-zinc-800' : 'text-zinc-400'}`}
                            >
                                <span>{size}px</span>
                                {currentSize == size && <CheckCircle size={12} className="text-emerald-500" />}
                            </button>
                        ))}
                        <button
                            onClick={() => { editor.chain().focus().unsetFontSize().run(); setIsOpen(false); }}
                            className="px-3 py-2 text-left hover:bg-zinc-800 transition-colors text-xs text-red-400 border-t border-zinc-800 mt-1 flex items-center gap-2"
                        >
                            <XCircle size={12} />
                            Reset
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

const ResponsiveToolbar = ({ editor, onHistoryUndo, onHistoryRedo, canUndo, canRedo, showMetadataModal, hasMetadata, showMetadataActive, onShowMediaLibrary, onAddYoutube }) => {
    const containerRef = React.useRef(null);
    const [visibleCount, setVisibleCount] = React.useState(100);
    const [showMore, setShowMore] = React.useState(false);

    // Tools Configuration
    const tools = useMemo(() => [
        { id: 'undo', icon: Undo, action: onHistoryUndo, disabled: !canUndo, title: 'Undo' },
        { id: 'redo', icon: Redo, action: onHistoryRedo, disabled: !canRedo, title: 'Redo' },
        { type: 'divider' },
        { id: 'bold', icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor?.isActive('bold') },
        { id: 'italic', icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor?.isActive('italic') },
        { id: 'underline', icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: editor?.isActive('underline') },
        { id: 'strike', icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor?.isActive('strike') },
        { type: 'divider' },
        {
            id: 'fontSize', type: 'custom', render: () => (
                <FontSizeSelector editor={editor} />
            )
        },
        {
            id: 'highlight', type: 'custom', render: () => (
                <ColorSelector
                    icon={Highlighter}
                    title="Highlight Color"
                    activeColor={editor?.getAttributes('highlight').color}
                    onChange={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
                    onRemove={() => editor.chain().focus().unsetHighlight().run()}
                    presets={['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#e9d5ff', '#fed7aa', '#fecaca']} // Yellow, Green, Blue, Pink, Purple, Orange, Red (Tailwind 200 weights approx)
                    variant="highlight"
                />
            )
        },
        {
            id: 'color', type: 'custom', render: () => (
                <ColorSelector
                    icon={Palette}
                    title="Text Color"
                    activeColor={editor?.getAttributes('textStyle').color}
                    onChange={(color) => editor.chain().focus().setColor(color).run()}
                    onRemove={() => editor.chain().focus().unsetColor().run()}
                    presets={['#000000', '#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#71717a']} // Black, Blue, Red, Green, Amber, Purple, Zinc
                    variant="text"
                />
            )
        },
        { type: 'divider' },
        { id: 'h1', icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor?.isActive('heading', { level: 1 }) },
        { id: 'h2', icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive('heading', { level: 2 }) },
        { id: 'sub', icon: SubscriptIcon, action: () => editor.chain().focus().toggleSubscript().run(), active: editor?.isActive('subscript') },
        { id: 'sup', icon: SuperscriptIcon, action: () => editor.chain().focus().toggleSuperscript().run(), active: editor?.isActive('superscript') },
        { type: 'divider' },
        { id: 'bullet', icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor?.isActive('bulletList') },
        { id: 'ordered', icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor?.isActive('orderedList') },
        { type: 'divider' },
        { id: 'left', icon: AlignLeft, action: () => editor.chain().focus().setTextAlign('left').run(), active: editor?.isActive({ textAlign: 'left' }) },
        { id: 'center', icon: AlignCenter, action: () => editor.chain().focus().setTextAlign('center').run(), active: editor?.isActive({ textAlign: 'center' }) },
        { id: 'right', icon: AlignRight, action: () => editor.chain().focus().setTextAlign('right').run(), active: editor?.isActive({ textAlign: 'right' }) },
        { id: 'justify', icon: AlignJustify, action: () => editor.chain().focus().setTextAlign('justify').run(), active: editor?.isActive({ textAlign: 'justify' }) },
        { type: 'divider' },
        { id: 'code', icon: Code, action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor?.isActive('codeBlock') },
        { id: 'quote', icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor?.isActive('blockquote') },
        { type: 'divider' },
        { id: 'image', icon: ImageIcon, action: onShowMediaLibrary, title: 'Insert Image' },
        { id: 'youtube', icon: YoutubeIcon, action: onAddYoutube, title: 'Embed YouTube Video' },
        {
            id: 'tags', type: 'custom', render: () => (
                <ToolbarButton onClick={showMetadataModal} active={showMetadataActive} title="Manage Tags & Categories" width={TOOLBAR_SIZES.CUSTOM}>
                    <div className="relative flex items-center justify-center">
                        <Tag size={18} />
                        {hasMetadata && <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />}
                    </div>
                </ToolbarButton>
            )
        },
    ], [editor, onHistoryUndo, onHistoryRedo, canUndo, canRedo, showMetadataModal, hasMetadata, showMetadataActive, onShowMediaLibrary, onAddYoutube]);

    // Precise resize logic using source of truth widths
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.clientWidth - 50; // Reserve space for "More" button
                let currentTotal = 0;
                let count = 0;

                for (let i = 0; i < tools.length; i++) {
                    const tool = tools[i];
                    let toolWidth = 0;
                    if (tool.type === 'divider') toolWidth = TOOLBAR_SIZES.DIVIDER;
                    else if (tool.type === 'custom') {
                        // Special cases for custom tools if needed, or default to CUSTOM
                        toolWidth = TOOLBAR_SIZES.CUSTOM;
                    } else {
                        toolWidth = TOOLBAR_SIZES.BUTTON;
                    }

                    if (currentTotal + toolWidth + TOOLBAR_SIZES.GAP > containerWidth) {
                        break;
                    }
                    currentTotal += toolWidth + TOOLBAR_SIZES.GAP;
                    count++;
                }

                setVisibleCount(Math.max(2, count));
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        const observer = new ResizeObserver(handleResize);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
        }
    }, []);

    const visibleTools = tools.slice(0, visibleCount);
    // Be careful not to split dividers weirdly. but for now strict slicing is ok.
    const overflowTools = tools.slice(visibleCount);

    const renderTool = (tool, idx) => {
        if (tool.type === 'divider') return <div key={idx} style={{ width: `${TOOLBAR_SIZES.DIVIDER}px` }} className="h-6 flex items-center justify-center shrink-0"><div className="w-px h-full bg-zinc-800" /></div>;
        if (tool.type === 'custom') return <React.Fragment key={tool.id}>{tool.render()}</React.Fragment>;

        const Icon = tool.icon;
        if (!Icon) return null;

        return (
            <ToolbarButton
                key={tool.id}
                onClick={tool.action}
                active={tool.active}
                disabled={tool.disabled}
                title={tool.title}
            >
                <Icon size={18} />
            </ToolbarButton>
        );
    };



    return (
        <div ref={containerRef} className="px-4 py-2 border-b border-zinc-800 flex items-center gap-1 bg-zinc-900/20 w-full relative">
            {visibleTools.map((t, i) => renderTool(t, i))}

            {overflowTools.length > 0 && (
                <div className="relative ml-auto">
                    <button
                        onClick={() => setShowMore(!showMore)}
                        style={{ width: `${TOOLBAR_SIZES.BUTTON}px`, height: `${TOOLBAR_SIZES.BUTTON}px` }}
                        className={`flex items-center justify-center rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0 ${showMore ? 'bg-zinc-800 text-white' : ''}`}
                        title="More tools"
                    >
                        <ChevronsRight size={18} />
                    </button>
                    {showMore && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
                            <div className="absolute right-0 top-full mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-2 z-[60] flex flex-col gap-1 min-w-[150px] animate-in slide-in-from-top-2 fade-in">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {overflowTools.map((t, i) => renderTool(t, i))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const SortDropdown = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative flex-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-1.5 px-3 text-xs text-left text-zinc-300 hover:border-zinc-500 transition-colors flex justify-between items-center"
            >
                <span>{selectedOption ? selectedOption.label : 'Sort by...'}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[70]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-[80] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs transition-colors ${value === opt.value
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const MultiSelect = ({ options, selected, onChange, placeholder, label }) => {
    return (
        <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">{label}</label>
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-1 max-h-32 overflow-y-auto custom-scrollbar">
                {options.length > 0 ? options.map(opt => (
                    <button
                        key={opt}
                        onClick={() => {
                            if (selected.includes(opt)) {
                                onChange(selected.filter(s => s !== opt));
                            } else {
                                onChange([...selected, opt]);
                            }
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-all flex items-center justify-between group ${selected.includes(opt)
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
                            }`}
                    >
                        <span>{opt}</span>
                        {selected.includes(opt) && <CheckCircle size={12} />}
                    </button>
                )) : <div className="p-2 text-[10px] text-zinc-600 italic">No {label.toLowerCase()} available</div>}
            </div>
        </div>
    );
};

const CalendarRangePicker = ({ label, range, onChange }) => {
    const [viewDate, setViewDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('days'); // 'days', 'months', 'years', 'decades'

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const handleDateClick = (dateStr) => {
        const d = dateStr;
        if (!range.start || (range.start && range.end)) {
            onChange({ start: d, end: null });
        } else {
            const start = new Date(range.start);
            const end = new Date(d);
            if (end < start) {
                onChange({ start: d, end: range.start });
            } else {
                onChange({ start: range.start, end: d });
            }
        }
    };

    const handleHeaderClick = () => {
        if (viewMode === 'days') setViewMode('months');
        else if (viewMode === 'months') setViewMode('years');
        else if (viewMode === 'years') setViewMode('decades');
    };

    const handlePrevClick = () => {
        if (viewMode === 'days') setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
        else if (viewMode === 'months') setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
        else if (viewMode === 'years') setViewDate(new Date(viewDate.getFullYear() - 10, viewDate.getMonth(), 1));
        else if (viewMode === 'decades') setViewDate(new Date(viewDate.getFullYear() - 100, viewDate.getMonth(), 1));
    };

    const handleNextClick = () => {
        if (viewMode === 'days') setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
        else if (viewMode === 'months') setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));
        else if (viewMode === 'years') setViewDate(new Date(viewDate.getFullYear() + 10, viewDate.getMonth(), 1));
        else if (viewMode === 'decades') setViewDate(new Date(viewDate.getFullYear() + 100, viewDate.getMonth(), 1));
    };

    const handleTodayClick = () => {
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        setViewDate(new Date());
        setViewMode('days');
        onChange({ start: today, end: today });
    };

    const renderHeader = () => {
        const year = viewDate.getFullYear();
        if (viewMode === 'days') return viewDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (viewMode === 'months') return `${year}`;
        if (viewMode === 'years') {
            const startYear = Math.floor(year / 10) * 10;
            return `${startYear} - ${startYear + 9}`;
        }
        if (viewMode === 'decades') {
            const startYear = Math.floor(year / 100) * 100;
            return `${startYear} - ${startYear + 99}`;
        }
    };

    const renderGrid = () => {
        const year = viewDate.getFullYear();

        if (viewMode === 'days') {
            const month = viewDate.getMonth();
            const numDays = daysInMonth(year, month);
            const startOffset = firstDayOfMonth(year, month);
            const days = [];
            for (let i = 0; i < startOffset; i++) days.push(null);
            for (let i = 1; i <= numDays; i++) {
                const d = new Date(year, month, i);
                const yearStr = d.getFullYear();
                const monthStr = String(d.getMonth() + 1).padStart(2, '0');
                const dayStr = String(d.getDate()).padStart(2, '0');
                days.push(`${yearStr}-${monthStr}-${dayStr}`);
            }

            return (
                <div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <span key={d} className="text-[9px] text-zinc-600 font-bold">{d}</span>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((d, i) => {
                            const isSelected = d && (d === range.start || d === range.end);
                            const isInRange = d && range.start && range.end && d > range.start && d < range.end;
                            const now = new Date();
                            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                            const isToday = d === todayStr;
                            return (
                                <button
                                    key={i}
                                    disabled={!d}
                                    onClick={() => handleDateClick(d)}
                                    className={`aspect-square rounded text-[10px] flex items-center justify-center transition-all ${!d ? 'invisible' : ''} ${isSelected
                                        ? 'bg-emerald-500 text-zinc-950 font-bold'
                                        : isInRange
                                            ? 'bg-emerald-500/20 text-emerald-500'
                                            : isToday
                                                ? 'bg-zinc-700 text-white font-bold ring-1 ring-zinc-500'
                                                : 'text-zinc-400 hover:bg-zinc-700'
                                        }`}
                                >
                                    {d ? new Date(d).getDate() : ''}
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
        }

        if (viewMode === 'months') {
            const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
            return (
                <div className="grid grid-cols-3 gap-2">
                    {months.map((m, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setViewDate(m);
                                setViewMode('days');
                            }}
                            className="p-2 text-[10px] rounded text-zinc-400 hover:bg-zinc-700 hover:text-white"
                        >
                            {m.toLocaleString('default', { month: 'short' })}
                        </button>
                    ))}
                </div>
            )
        }

        if (viewMode === 'years') {
            const startYear = Math.floor(year / 10) * 10;
            const years = Array.from({ length: 10 }, (_, i) => startYear + i);
            return (
                <div className="grid grid-cols-3 gap-2">
                    {years.map((y) => (
                        <button
                            key={y}
                            onClick={() => {
                                setViewDate(new Date(y, 0, 1));
                                setViewMode('months');
                            }}
                            className={`p-2 text-[10px] rounded hover:bg-zinc-700 hover:text-white ${y === new Date().getFullYear() ? 'text-emerald-500 font-bold' : 'text-zinc-400'}`}
                        >
                            {y}
                        </button>
                    ))}
                </div>
            );
        }

        if (viewMode === 'decades') {
            const startYear = Math.floor(year / 100) * 100;
            const decades = Array.from({ length: 10 }, (_, i) => startYear + i * 10);
            return (
                <div className="grid grid-cols-3 gap-2">
                    {decades.map((d) => (
                        <button
                            key={d}
                            onClick={() => {
                                setViewDate(new Date(d, 0, 1));
                                setViewMode('years');
                            }}
                            className="p-2 text-[10px] rounded text-zinc-400 hover:bg-zinc-700 hover:text-white"
                        >
                            {d}-{d + 9}
                        </button>
                    ))}
                </div>
            )
        }
    }

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500">{label}</label>
                <button
                    onClick={handleTodayClick}
                    className="text-[9px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10"
                >
                    Today
                </button>
            </div>
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
                <div className="flex justify-between items-center mb-3">
                    <button onClick={handlePrevClick} className="p-1 hover:bg-zinc-700 rounded text-zinc-400"><ChevronLeft size={14} /></button>
                    <button onClick={handleHeaderClick} className="text-[11px] font-bold text-zinc-300 hover:text-white hover:underline transition-all">
                        {renderHeader()}
                    </button>
                    <button onClick={handleNextClick} className="p-1 hover:bg-zinc-700 rounded text-zinc-400"><ChevronRight size={14} /></button>
                </div>
                {renderGrid()}
                {viewMode === 'days' && (range.start || range.end) && (
                    <div className="mt-3 flex items-center justify-between text-[9px] text-zinc-500 border-t border-zinc-700 pt-2">
                        <span>{range.start ? new Date(range.start).toLocaleDateString() : '...'} - {range.end ? new Date(range.end).toLocaleDateString() : '...'}</span>
                        <button onClick={() => onChange({ start: null, end: null })} className="text-red-400 hover:underline">Reset</button>
                    </div>
                )}
            </div>


        </div>
    );
};

const NewPostModal = ({ isOpen, onClose, onConfirm }) => {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (name.trim()) {
            onConfirm(name.trim());
            setName('');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-white">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 opacity-100">
                <div className="p-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                            <Plus size={20} />
                        </div>
                        <h3 className="text-lg font-bold">Create New Post</h3>
                    </div>
                    <p className="text-zinc-400 text-sm mb-4">Enter a filename for your new post.</p>
                    <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My New Post"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit();
                            if (e.key === 'Escape') onClose();
                        }}
                    />
                </div>
                <div className="px-6 py-4 bg-zinc-950/50 flex justify-end gap-3 border-t border-zinc-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className="px-6 py-2 rounded-lg text-sm font-bold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20 transition-all"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};

const YoutubeEmbedModal = ({ isOpen, onClose, onConfirm }) => {
    const [activeTab, setActiveTab] = useState('search'); // 'search' or 'link'
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [linkInput, setLinkInput] = useState('');
    const [previewId, setPreviewId] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            setLinkInput('');
            setPreviewId(null);
        }
    }, [isOpen]);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setSearching(true);
        try {
            const res = await axios.get(`/api/youtube/search?q=${encodeURIComponent(query)}`);
            setResults(res.data.items || []);
        } catch (err) {
            console.error('YouTube Search Failed:', err);
        } finally {
            setSearching(false);
        }
    };

    const extractId = (url) => {
        const match = url.match(/(?:embed\/|v=|vi\/|youtu\.be\/|shorts\/|\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : (url.length === 11 ? url : null);
    };

    useEffect(() => {
        const id = extractId(linkInput);
        setPreviewId(id);
    }, [linkInput]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-white">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                            <YoutubeIcon size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Embed YouTube Video</h3>
                            <p className="text-xs text-zinc-500">Search or paste a link to embed</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 pt-2 border-b border-zinc-800 gap-6">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'search' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Search YouTube
                    </button>
                    <button
                        onClick={() => setActiveTab('link')}
                        className={`py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'link' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Direct Link
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {activeTab === 'search' ? (
                        <div className="space-y-6">
                            <form onSubmit={handleSearch} className="relative">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search for videos..."
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-4 pr-12 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-inner"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={searching}
                                    className="absolute right-2 top-2 p-1.5 bg-emerald-500 text-zinc-950 rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                                >
                                    <Filter size={18} />
                                </button>
                            </form>

                            {searching ? (
                                <div className="grid grid-cols-2 gap-4 animate-pulse">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="space-y-2">
                                            <div className="aspect-video bg-zinc-800 rounded-lg" />
                                            <div className="h-4 bg-zinc-800 rounded w-3/4" />
                                        </div>
                                    ))}
                                </div>
                            ) : results.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {results.map((video) => (
                                        <button
                                            key={video.url}
                                            onClick={() => onConfirm(video.url.split('v=')[1] || video.url.split('/').pop())}
                                            className="group text-left space-y-2 hover:bg-zinc-800/50 p-2 rounded-xl transition-all"
                                        >
                                            <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-800">
                                                <img
                                                    src={video.thumbnail}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Plus size={32} className="text-white bg-emerald-500 rounded-full p-2" />
                                                </div>
                                                <span className="absolute bottom-2 right-2 bg-black/80 text-[10px] px-1.5 py-0.5 rounded font-mono">
                                                    {video.duration ? Math.floor(video.duration / 60) + ':' + (video.duration % 60).toString().padStart(2, '0') : ''}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-medium line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">{video.title}</h4>
                                                <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                                                    {video.uploaderName} • {video.views?.toLocaleString()} views
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : query && !searching ? (
                                <div className="text-center py-12 text-zinc-500 italic">No videos found. Try a different search.</div>
                            ) : (
                                <div className="text-center py-12 flex flex-col items-center gap-4 text-zinc-500">
                                    <YoutubeIcon size={48} className="opacity-10" />
                                    <p>Enter a topic or video name to find content</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Video URL or ID</label>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-inner"
                                    value={linkInput}
                                    onChange={(e) => setLinkInput(e.target.value)}
                                />
                            </div>

                            {previewId && (
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Live Preview</label>
                                    <div className="aspect-video rounded-xl overflow-hidden bg-black ring-1 ring-zinc-800 relative shadow-2xl">
                                        <iframe
                                            src={`https://www.youtube.com/embed/${previewId}?controls=0&modestbranding=1`}
                                            className="w-full h-full"
                                            title="Preview"
                                        />
                                        <div className="absolute inset-0 z-10 pointer-events-none border-2 border-emerald-500/30 rounded-xl" />
                                    </div>
                                    <p className="text-[10px] text-emerald-500 font-mono text-center">Detected ID: {previewId}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-zinc-950/50 border-t border-zinc-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">Cancel</button>
                    <button
                        onClick={() => previewId && onConfirm(previewId)}
                        disabled={!previewId}
                        className="px-6 py-2 bg-emerald-500 text-zinc-950 rounded-lg text-sm font-bold hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                        Insert Video
                    </button>
                </div>
            </div>
        </div>
    );
};

const SaveSplitButton = ({ onSave, onAction, isSaving, isDirty, deployStatus }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const options = [
        { label: 'Save & Publish', icon: Globe, steps: ['save', 'publish'], color: 'text-blue-400' },
        { label: 'Save, Publish & Commit', icon: GitCommit, steps: ['save', 'publish', 'commit'], color: 'text-purple-400' },
    ];

    if (import.meta.env.ALLOW_PUSH == 'true')
        options.push({ label: 'Save, Publish, Commit & Push', icon: UploadCloud, steps: ['save', 'publish', 'commit', 'push'], color: 'text-emerald-400' });

    const getStatusText = () => {
        if (deployStatus === 'publishing') return 'Publishing...';
        if (deployStatus === 'committing') return 'Committing...';
        if (deployStatus === 'pushing') return 'Pushing...';
        if (isSaving) return 'Saving...';
        return 'Save';
    };

    return (
        <div className="relative flex items-stretch h-10" ref={dropdownRef}>
            {/* Main Action Button */}
            <button
                type="button"
                onClick={onSave}
                disabled={isSaving || !!deployStatus || !isDirty}
                className={`flex items-center gap-2 pl-4 pr-3 rounded-l-lg font-bold transition-all justify-center text-sm border-r border-black/10 ${isDirty
                    ? 'bg-yellow-400 text-zinc-950 hover:bg-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.2)]'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                    }`}
                title={isSaving ? 'Saving...' : 'Save Changes'}
            >
                <Save size={18} />
                <span className="hidden md:inline">{getStatusText()}</span>
            </button>

            {/* Dropdown Toggle */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    if (!deployStatus) setIsOpen(!isOpen);
                }}
                disabled={!!deployStatus}
                className={`px-2 rounded-r-lg transition-all border-l border-white/10 ${isDirty
                    ? 'bg-yellow-400 text-zinc-950 hover:bg-yellow-300'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                    }`}
            >
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[200] overflow-hidden">
                    <div className="p-2 space-y-1">
                        {options.map((opt) => (
                            <button
                                key={opt.label}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAction(opt.steps);
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 text-left transition-colors group"
                            >
                                <div className={`p-1.5 rounded-md bg-zinc-800 group-hover:bg-zinc-700 ${opt.color}`}>
                                    <opt.icon size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-zinc-200">{opt.label}</span>
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">Workflow</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const WorkflowStatusModal = ({ isOpen, onClose, workflow, onCancelStep, onAbort, onConfirmCommit, currentTitle }) => {
    const [commitMsg, setCommitMsg] = useState(`Update ${currentTitle || 'blog content'}`);
    const [hoveredCancelIdx, setHoveredCancelIdx] = useState(null);
    const [isAborting, setIsAborting] = useState(false);
    const [dontShowPushWarning, setDontShowPushWarning] = useState(() => localStorage.getItem('inscript_hide_push_warning') === 'true');
    const [dontShowPushInfo, setDontShowPushInfo] = useState(() => localStorage.getItem('inscript_hide_push_info') === 'true');

    useEffect(() => {
        if (workflow?.currentIndex !== undefined) {
            if (workflow.steps[workflow.currentIndex] === 'commit') {
                setCommitMsg(`Update ${currentTitle || 'blog content'}`);
            }
            // Reset hover state if the step we were hovering becomes current or past
            setHoveredCancelIdx(prev => (prev !== null && prev <= workflow.currentIndex) ? null : prev);
        }
    }, [workflow?.currentIndex, currentTitle]);

    if (!isOpen || !workflow) return null;

    const { steps, currentIndex, status, error } = workflow;

    const stepInfo = {
        save: { label: 'Save', icon: Save },
        publish: { label: 'Publish', icon: Globe },
        commit: { label: 'Commit', icon: GitCommit },
        push: { label: 'Push', icon: UploadCloud }
    };

    const currentStep = steps[currentIndex];
    const isPausedForCommit = currentStep === 'commit' && status === 'paused';
    const allowPush = import.meta.env.ALLOW_PUSH === 'true';

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold text-white">Workflow Progress</h2>
                        <button onClick={onAbort} className="text-zinc-500 hover:text-red-400 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Timeline */}
                    <div className="relative mb-12">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-800 -translate-y-1/2" />
                        <div className="relative flex justify-between items-center">
                            {steps.map((step, idx) => {
                                const Info = stepInfo[step];
                                const isCompleted = idx < currentIndex || (status === 'completed' && idx === steps.length - 1);
                                const isActive = idx === currentIndex && status !== 'error' && status !== 'completed';
                                const isError = idx === currentIndex && status === 'error';
                                const isFuture = idx > currentIndex;

                                // Red highlight logic for cancellations (only future steps can be targeted for cancel)
                                const isTargetedForCancel = (hoveredCancelIdx !== null && idx >= hoveredCancelIdx && idx > currentIndex) || (isAborting && idx >= currentIndex && status !== 'completed');

                                return (
                                    <div key={step} className="relative flex flex-col items-center group">
                                        {/* Connector line for finished steps */}
                                        {idx > 0 && idx <= currentIndex && (
                                            <div className={`absolute top-1/2 right-full w-full h-0.5 -translate-y-1/2 z-0 ${(isCompleted || isActive) && !isTargetedForCancel ? 'bg-emerald-500' : 'bg-zinc-800'}`} style={{ width: '100%' }} />
                                        )}

                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 relative ${isTargetedForCancel ? 'bg-red-500/20 text-red-500 ring-2 ring-red-500/30' :
                                            isCompleted ? 'bg-emerald-500 text-zinc-950' :
                                                isActive ? 'bg-emerald-500/20 text-emerald-500 ring-4 ring-emerald-500/10' :
                                                    isError ? 'bg-red-500/20 text-red-500' :
                                                        'bg-zinc-800 text-zinc-500'
                                            }`}>
                                            {isCompleted && !isTargetedForCancel ? <CheckCircle size={20} /> : <Info.icon size={20} className={isActive ? 'animate-pulse' : ''} />}

                                            {/* Cancel future step button */}
                                            {isFuture && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onCancelStep(idx); }}
                                                    onMouseEnter={() => setHoveredCancelIdx(idx)}
                                                    onMouseLeave={() => setHoveredCancelIdx(null)}
                                                    className="absolute -top-1 -right-1 bg-zinc-700 text-zinc-400 hover:bg-red-500 hover:text-white rounded-full p-0.5 opacity-40 hover:opacity-100 transition-opacity z-20"
                                                    title="Cancel this and following steps"
                                                >
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <span className={`absolute top-full mt-2 text-[10px] font-bold uppercase tracking-wider ${isTargetedForCancel ? 'text-red-500' : isActive ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                            {Info.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Status Content */}
                    <div className="min-h-[140px] flex flex-col justify-center">
                        {status === 'error' ? (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3">
                                <AlertCircle className="text-red-500 shrink-0" size={20} />
                                <div>
                                    <p className="text-sm font-bold text-red-200">Step Failed</p>
                                    <p className="text-xs text-red-200/70">{error}</p>
                                </div>
                            </div>
                        ) : isPausedForCommit ? (
                            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Commit Message</label>
                                    <textarea
                                        autoFocus
                                        value={commitMsg}
                                        onChange={(e) => setCommitMsg(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 text-sm outline-none focus:border-emerald-500/50 transition-colors min-h-[80px] resize-none"
                                        placeholder="What changed?"
                                    />
                                </div>
                                <button
                                    onClick={() => onConfirmCommit(commitMsg)}
                                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                                >
                                    Confirm & Continue <ChevronRight size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <div className="text-sm text-zinc-300 font-medium mb-1">
                                    {status === 'completed' ? 'Workflow Successful!' :
                                        currentStep === 'save' ? 'Saving post content...' :
                                            currentStep === 'publish' ? 'Generating static site...' :
                                                currentStep === 'commit' ? 'Recording changes to Git...' :
                                                    currentStep === 'push' ? 'Pushing to remote repository...' : 'Processing...'}
                                </div>
                                <div className="text-xs text-zinc-500">
                                    {status === 'completed' ? 'All steps finished. You can now close this modal.' : 'Please wait while we handle the deployment.'}
                                </div>
                            </div>
                        )}

                        {/* Push Warning & Permission Hints (Shown whenever push is in pipeline) */}
                        <div className="space-y-3 mt-4">
                            {steps.includes('push') && status !== 'completed' && status !== 'error' && !dontShowPushWarning && (
                                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg flex gap-3 animate-in fade-in slide-in-from-top-1">
                                    <AlertTriangle className="text-orange-500 shrink-0" size={20} />
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-orange-200 mb-1">Push Warning</p>
                                        <p className="text-[10px] text-orange-200/70 leading-relaxed">External pushes are irreversible and will affect the live repository.</p>
                                        <label className="flex items-center gap-2 mt-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={dontShowPushWarning}
                                                onChange={(e) => {
                                                    const val = e.target.checked;
                                                    setDontShowPushWarning(val);
                                                    localStorage.setItem('inscript_hide_push_warning', val ? 'true' : 'false');
                                                }}
                                                className="w-3 h-3 rounded border-zinc-700 bg-zinc-800 text-emerald-500"
                                            />
                                            <span className="text-[9px] text-orange-200/40 group-hover:text-orange-200/60 transition-colors">Don't show again</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {!allowPush && status !== 'error' && !dontShowPushInfo && (
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3 animate-in fade-in slide-in-from-top-1">
                                    <Info className="text-blue-500 shrink-0" size={16} />
                                    <div className="flex-1">
                                        <div className="text-[10px] text-blue-200/70 leading-relaxed mb-2">
                                            Tip: Enable direct push by setting <code className="bg-blue-500/20 px-1 rounded">ALLOW_PUSH=true</code> in your <code className="bg-blue-500/20 px-1 rounded">.env</code> file.
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={dontShowPushInfo}
                                                onChange={(e) => {
                                                    const val = e.target.checked;
                                                    setDontShowPushInfo(val);
                                                    localStorage.setItem('inscript_hide_push_info', val ? 'true' : 'false');
                                                }}
                                                className="w-3 h-3 rounded border-zinc-700 bg-zinc-800 text-blue-500"
                                            />
                                            <span className="text-[9px] text-blue-200/40 group-hover:text-blue-200/60 transition-colors">Don't show this tip again</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Global Footer Actions */}
                <div className="px-6 py-4 bg-zinc-950/50 flex justify-between items-center border-t border-zinc-800">
                    <button
                        onClick={onAbort}
                        onMouseEnter={() => setIsAborting(true)}
                        onMouseLeave={() => setIsAborting(false)}
                        className="text-xs font-bold text-red-500/60 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                        Abort Workflow
                    </button>
                    {status === 'completed' && (
                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-bold transition-all"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const ConfirmationModal = ({ config, onClose }) => {
    if (!config) return null;
    const { title, message, type = 'warning', confirmText = 'Confirm', onConfirm } = config;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 opacity-100">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            {type === 'danger' ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-zinc-950/50 flex justify-end gap-3 border-t border-zinc-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all ${type === 'danger'
                            ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20'
                            : 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/20'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [posts, setPosts] = useState([]);
    const [isCopied, setIsCopied] = useState(false);
    const [currentPost, setCurrentPost] = useState(null);
    const [title, setTitle] = useState('');
    const [postTags, setPostTags] = useState([]);
    const [postCategories, setPostCategories] = useState([]);
    const [filename, setFilename] = useState('');
    const [loading, setLoading] = useState(false);
    const [showMediaLibrary, setShowMediaLibrary] = useState(false);
    const [libraryImages, setLibraryImages] = useState([]);
    const [originalContent, setOriginalContent] = useState({ title: '', html: '', tags: [], categories: [] });
    const [isDirty, setIsDirty] = useState(false);
    const [showDiff, setShowDiff] = useState(false);

    // Pointer-Based History State
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const [tick, setTick] = useState(0); // Force re-render for toolbar

    // New state for custom UI
    const [pendingFile, setPendingFile] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', 'error', 'unsaved', 'saved'
    const [showDebug, setShowDebug] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // Distinct from loading
    const [modalConfig, setModalConfig] = useState(null); // { title, message, onConfirm, type: 'danger'|'waerning' }
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'drafts', 'published'
    const [showSidebar, setShowSidebar] = useState(true);
    const [showNewPostModal, setShowNewPostModal] = useState(false);
    const [showMetadataModal, setShowMetadataModal] = useState(false);
    const [showYoutubeModal, setShowYoutubeModal] = useState(false);
    const [deployStatus, setDeployStatus] = useState(null); // 'publishing', 'committing', 'pushing'
    const [workflow, setWorkflow] = useState(null); // { steps: [], currentIndex: 0, status: 'active'|'paused'|'completed'|'error', error: null, commitMessage: null }

    // Advanced Filtering States
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [createdRange, setCreatedRange] = useState({ start: null, end: null });
    const [modifiedRange, setModifiedRange] = useState({ start: null, end: null });
    const [showFilters, setShowFilters] = useState(false);

    // Use refs for comparison to avoid stale closures in Tiptap callbacks
    const originalContentRef = React.useRef({ title: '', html: '' });
    const isInitialLoadingRef = React.useRef(false);
    const isSyncingRef = React.useRef(false); // New lock for the entire sync window
    const titleRef = React.useRef(title);

    // Refs for history to avoid stale closures in Tiptap callbacks
    const historyRef = React.useRef([]);
    const historyIndexRef = React.useRef(-1);
    const historyDebounceRef = React.useRef(null);
    const saveDraftDebounceRef = React.useRef(null);
    const isWorkflowProcessingRef = React.useRef(false); // Locking mechanism for deployment
    // Capture initial URL params immediately to avoid useEffect race conditions clearing them
    const startupParamsRef = React.useRef(new URLSearchParams(window.location.search));

    // Keep refs in sync with state
    useEffect(() => {
        historyRef.current = history;
        historyIndexRef.current = historyIndex;
    }, [history, historyIndex]);

    // Sidebar Resizing Logic
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem('inscript_sidebar_width');
        return saved ? parseInt(saved, 10) : 320;
    });
    const isResizingRef = React.useRef(false);

    const startResizing = React.useCallback(() => {
        isResizingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const stopResizing = React.useCallback(() => {
        if (isResizingRef.current) {
            isResizingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            localStorage.setItem('inscript_sidebar_width', sidebarWidth);
        }
    }, [sidebarWidth]);

    const resize = React.useCallback((e) => {
        if (isResizingRef.current) {
            // Clamp width to viewport width - 50px (keep handle visible) or 80% width
            const maxWidth = Math.min(600, window.innerWidth - 50);
            const newWidth = Math.max(240, Math.min(maxWidth, e.clientX));
            setSidebarWidth(newWidth);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);

        // Safety check on window resize to ensure handle stays visible
        const handleWindowResize = () => {
            // If manual resize pushes sidebar off screen, reclaim it
            setSidebarWidth(prev => Math.min(prev, window.innerWidth - 50));
        };
        window.addEventListener('resize', handleWindowResize);

        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            window.removeEventListener('resize', handleWindowResize);
        };
    }, [resize, stopResizing]);

    // Keep titleRef in sync with state
    useEffect(() => {
        titleRef.current = title;
    }, [title]);

    const isReadonlyEnv = import.meta.env.MODE === 'readonly';
    const [isReadonlyUser, setIsReadonlyUser] = useState(() => new URLSearchParams(window.location.search).get('readonly') === 'true');
    const isReadonly = isReadonlyEnv || isReadonlyUser;

    // Use Refs to prevent stale closures in callbacks
    const isReadonlyRef = React.useRef(isReadonly);
    useEffect(() => { isReadonlyRef.current = isReadonly; }, [isReadonly]);

    // Title Integrity & Healing
    useEffect(() => {
        if (filename && (title === null || title === undefined)) {
            console.warn('[Inscript] Detected invalid title (null/undefined). Healing to fallback...');
            setTitle(filename.replace('.md', '') || 'Untitled');
        }
    }, [title, filename]);


    const editor = useEditor({
        extensions: [
            StarterKit,
            TiptapImage.configure({
                allowBase64: true,
            }),
            TextStyle,
            Color,
            FontSize,
            Highlight.configure({ multicolor: true }),
            Underline,
            Subscript,
            Superscript,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Youtube,
        ],
        content: currentPost?.html || '', // CRITICAL: Initialize with content so History starts clean
        editable: !isReadonly, // Disable editing in readonly mode
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-lg max-w-none focus:outline-none min-h-[calc(100vh-300px)]',
            },
        },
        onUpdate: ({ editor }) => {
            // Use Ref to avoid stale closure during readonly toggles
            if (isReadonlyRef.current) return;

            // Always tick for Toolbar updates
            setTick(t => t + 1);

            if (!isInitialLoadingRef.current && !isSyncingRef.current) {
                // Debounce the history push
                if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);

                historyDebounceRef.current = setTimeout(() => {
                    const newHtml = editor.getHTML();
                    const newTitle = titleRef.current;

                    // Use Refs to get LATEST state
                    const currentHist = historyRef.current;
                    const currentIndex = historyIndexRef.current;
                    const currentHistoryItem = currentHist[currentIndex];

                    // Check if actually changed
                    if (!currentHistoryItem || currentHistoryItem.html !== newHtml || currentHistoryItem.title !== newTitle || JSON.stringify(currentHistoryItem.tags) !== JSON.stringify(postTags) || JSON.stringify(currentHistoryItem.categories) !== JSON.stringify(postCategories)) {
                        // Slice history to remove any "redo" future
                        const newHistory = currentHist.slice(0, currentIndex + 1);

                        // Push new state
                        const newState = {
                            html: newHtml,
                            title: newTitle,
                            tags: postTags,
                            categories: postCategories,
                            timestamp: new Date().toISOString()
                        };
                        newHistory.push(newState);

                        // Update state
                        setHistory(newHistory);
                        setHistoryIndex(newHistory.length - 1);
                        setIsDirty(true);
                    }
                }, 1000); // 1s debounce
            }
        },
        onSelectionUpdate: ({ editor }) => {
            // Force re-render for Toolbar state (Bold/Italic active buttons)
            setTick(t => t + 1);
        },
    }, [filename]); // Re-create editor when filename changes

    // Sync editor editability when isReadonly changes
    useEffect(() => {
        if (editor && !editor.isDestroyed) {
            editor.setEditable(!isReadonly);
        }
    }, [editor, isReadonly]);

    const checkIfDirty = (newTitle, newHtml) => {
        // We are dirty if we have a draft history (more than 1 item, or the only item is not original)
        // OR if the current title/content differs from the original baseline.
        const hasHistory = history.length > 1 || (history.length > 0 && !history[0].isOriginal);

        // We also check title/content explicitly because changing title doesn't immediately push to history
        // in our current implementation (it debounces), but we want immediate UI feedback.
        const titleChanged = originalContent && newTitle !== originalContent.title;

        if (hasHistory || titleChanged) {
            setIsDirty(true);
        }
    };

    // Auto-sync entire history to server
    // Auto-sync entire history to server
    useEffect(() => {
        // Prevent saving if: no filename, syncing locked, or history is just the original (single item)
        // This ensures we don't create draft files for unedited posts.
        if (!filename || isSyncingRef.current || history.length <= 1) return;

        const timeout = setTimeout(async () => {
            try {
                // Ensure we are saving the CURRENT state of history
                await axios.post(`/api/drafts/${filename}`, {
                    history: history,
                    currentIndex: historyIndex
                });
                console.log(`[DraftSync] Saved history (len: ${history.length}, ptr: ${historyIndex})`);
                setCurrentPost(prev => prev ? { ...prev, hasDraft: true } : prev);
                setPosts(prev => prev.map(p => p.filename === filename ? { ...p, hasDraft: true } : p));
                setSaveStatus('success');
                setTimeout(() => setSaveStatus(null), 2000);
            } catch (err) {
                console.error('[DraftSync] Failed:', err);
                setSaveStatus('error');
            }
        }, 2000); // Slower autosave frequency (2s)

        return () => clearTimeout(timeout);
    }, [history, historyIndex, title, filename, postTags, postCategories]);

    useEffect(() => {
        if (editor && !isInitialLoadingRef.current && !isSyncingRef.current) {
            checkIfDirty(title, editor.getHTML(), "useEffect[title]");
        }
    }, [title, editor]); // Added editor to dependencies for safety

    // Routing: Sync URL with filename
    useEffect(() => {
        const appTitle = import.meta.env.TITLE;
        if (filename) {
            const url = new URL(window.location);
            url.searchParams.set('post', filename.replace('.md', ''));
            window.history.replaceState({}, '', url);
            document.title = `${title} | ${appTitle}`;
        } else {
            // Only clear if we didn't start with a post param (prevent race condition wipe)
            const startupPost = startupParamsRef.current.get('post');
            if (!startupPost) {
                const url = new URL(window.location);
                url.searchParams.delete('post');
                window.history.replaceState({}, '', url);
                document.title = appTitle;
            }
        }
    }, [filename, title]);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const loadedPosts = (await axios.get(isReadonlyEnv ? '/data.json' : '/api/posts')).data;
            setPosts(loadedPosts);

            // Handle Deep Linking on Initial Load
            // Handle Deep Linking on Initial Load using captured Ref
            const postParam = startupParamsRef.current.get('post');
            if (postParam && !filename) {
                const targetFilename = postParam + '.md';
                // Determine if valid post
                const targetPost = loadedPosts.find(p => p.filename === targetFilename);
                if (targetPost) {
                    loadPost(targetFilename, loadedPosts);
                    // Clear the startup ref so future navigations work normally
                    startupParamsRef.current = new URLSearchParams();
                }
            }


        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const fetchLibraryImages = async () => {
        try {
            const res = await axios.get('/api/images');
            setLibraryImages(res.data);
        } catch (error) {
            console.error('Error fetching library images:', error);
        }
    };

    const loadPost = async (file, loadedPosts = null) => {
        if (window.innerWidth < 768) setShowSidebar(false);
        if (file === filename) return;

        // No more discard modal on switch - we sync drafts!
        // Hard reset UI states immediately to prevent flickering/stale indicators
        setIsDirty(false);
        setSaveStatus(null);
        performLoadPost(file, loadedPosts);
    };

    const performLoadPost = async (file, loadedPosts = null) => {
        setLoading(true);
        isInitialLoadingRef.current = true;
        setFilename(file);

        // Clear any pending debounced actions
        if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
        if (saveDraftDebounceRef.current) clearTimeout(saveDraftDebounceRef.current);

        try {
            let res = { data: null };

            if (isReadonlyEnv) {
                // Find post in local state which has full content in readonly mode
                // Use loadedPosts if provided (during initial load), otherwise use state
                const sourcePosts = loadedPosts || posts;
                const post = sourcePosts.find(p => p.filename === file);
                if (post) {
                    res.data = {
                        html: post.html,
                        title: post.title,
                        frontmatter: {
                            title: post.title,
                            tags: post.tags,
                            categories: post.categories
                        },
                        hasDraft: false, // Static mode never has drafts
                        history: [], // No history in static
                        savedHtml: post.html, // Baseline
                        savedTitle: post.title
                    };
                } else {
                    throw new Error('Post not found in static data');
                }
            } else {
                res = await axios.get(`/api/posts/${file}?t=${Date.now()}`); // Cache bust
            }

            const postTitle = res.data.title || res.data.frontmatter.title || file;

            setShowDiff(false);
            setFilename(file);
            setCurrentPost(res.data);

            // New History Hydration
            const originalState = {
                title: postTitle,
                html: res.data.savedHtml !== undefined ? res.data.savedHtml : res.data.html, // Use savedHtml (raw file) if available, else html
                tags: res.data.frontmatter?.tags || res.data.tags || [],
                categories: res.data.frontmatter?.categories || res.data.categories || [],
                timestamp: res.data.created || new Date().toISOString(),
                isOriginal: true
            };

            let hist = Array.isArray(res.data.history) && res.data.history.length > 0
                ? res.data.history
                : [];

            // Enforce Original as First Item
            const firstIsOriginal = hist.length > 0 && (hist[0].html === originalState.html);

            if (!firstIsOriginal) {
                hist = [originalState, ...hist];
            }

            if (hist.length === 0) hist = [originalState];

            const idxFromRes = typeof res.data.currentIndex === 'number' ? res.data.currentIndex : hist.length - 1;
            const finalIndex = (!firstIsOriginal && res.data.hasDraft) ? idxFromRes + 1 : idxFromRes;
            const safeIndex = Math.max(0, Math.min(finalIndex, hist.length - 1));

            setHistory(hist);
            setHistoryIndex(safeIndex);

            if (hist.length > 1 || (hist.length > 0 && !hist[0].isOriginal)) {
                setIsDirty(true);
            }

            // Set content from pointer
            const currentState = hist[safeIndex];
            const safeTitle = currentState?.title || postTitle || filename?.replace('.md', '') || 'Untitled';
            setTitle(safeTitle);
            titleRef.current = safeTitle;

            // Set Tags/Categories from current history state or fallback to original (frontmatter)
            setPostTags(currentState.tags || originalState.tags);
            setPostCategories(currentState.categories || originalState.categories);

            // setOriginalContent helps with diffs logic, but history is now primary
            setOriginalContent({
                title: originalState.title,
                html: originalState.html,
                tags: originalState.tags || [],
                categories: originalState.categories || []
            });

            setLoading(false);
        } catch (err) {
            console.error('[LoadPost] Failed:', err);
            setLoading(false);
            isInitialLoadingRef.current = false;
            isSyncingRef.current = false;
        }
    };

    // Helper to sync history pointer changes to server (Debounced)
    const syncHistoryWithServer = (newIndex) => {
        if (!filename) return;

        // 1. Update Local State (Optimistic)
        // We do this via the caller usually, but let's centralize if possible.
        // Actually, the caller calculates the new index.
        setHistoryIndex(newIndex);

        // 2. Update Editor Content & UI
        const targetState = history[newIndex];
        if (targetState) {
            isSyncingRef.current = true; // Lock onUpdate
            editor.commands.setContent(targetState.html);
            const safeTitle = targetState?.title || title || 'Untitled';
            setTitle(safeTitle);
            setPostTags(targetState.tags || []);
            setPostCategories(targetState.categories || []);
            // Unlock after short delay
            setTimeout(() => isSyncingRef.current = false, 100);
        }

        // 3. Debounced Server Sync
        if (saveDraftDebounceRef.current) clearTimeout(saveDraftDebounceRef.current);

        saveDraftDebounceRef.current = setTimeout(async () => {
            try {
                console.log(`[HistorySync] Syncing pointer to ${newIndex}`);
                setSaveStatus('saving');
                // Use Refs to ensure we send the latest history array if it changed recently
                await axios.post(`/api/drafts/${filename}`, {
                    history: historyRef.current,
                    currentIndex: newIndex
                });
                setSaveStatus('success');
                setTimeout(() => setSaveStatus(null), 2000);
            } catch (err) {
                console.error('[HistorySync] Failed:', err);
                setSaveStatus('error');
            }
        }, 500); // 500ms debounce for pointer movements
    };

    // Initialize Editor Content from History
    useEffect(() => {
        if (editor && currentPost && filename && currentPost.filename === filename && historyIndex >= 0 && history.length > historyIndex) {

            // Wait for editor to be ready/mounted
            if (!editor.isDestroyed) {
                const currentState = history[historyIndex];
                const currentHtml = currentState?.html || '';

                // Only update if editor is empty or we are forcing initial load
                // We depend on isInitialLoadingRef to force the first setContent
                if (isInitialLoadingRef.current) {
                    console.log(`[Editor] Initializing content from history[${historyIndex}]`);

                    // Guard: If history item is magically empty but we have a title, something is wrong.
                    // But an empty post is valid. 
                    // The user reported "html property is empty". 
                    // Let's ensure we don't sync this empty state back immediately if it's an error.

                    editor.commands.setContent(currentHtml);

                    // Set baseline for diffs
                    setOriginalContent({ title: history[0].title, html: history[0].html, tags: history[0].tags, categories: history[0].categories });
                    isInitialLoadingRef.current = false;
                    // Small delay to allow editor to settle before enabling sync listeners
                    setTimeout(() => {
                        isSyncingRef.current = false;
                    }, 100);
                }
            }
        }
    }, [editor, filename, currentPost, history, historyIndex]);


    const handleDelete = async () => {
        if (!filename) return;

        setModalConfig({
            title: 'Delete Post',
            message: `Are you sure you want to delete "${filename}"? This cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await axios.delete(`/api/posts/${filename}`);
                    setFilename(null);
                    setCurrentPost(null);
                    setIsDirty(false);
                    fetchPosts();
                    setModalConfig(null);
                } catch (err) {
                    console.error('[Delete] Failed:', err);
                    alert('Failed to delete post'); // Fallback or use toast
                }
            }
        });
    };

    const handleDiscard = async () => {
        if (!filename || !currentPost) return;

        setModalConfig({
            title: 'Discard Draft',
            message: "Discard all draft changes? This will revert to the published version.",
            type: 'warning',
            confirmText: 'Discard Changes',
            onConfirm: async () => {
                try {
                    await axios.delete(`/api/drafts/${filename}`);
                    await performLoadPost(filename);
                    fetchPosts();
                    setModalConfig(null);
                } catch (err) {
                    console.error('[Discard] Failed:', err);
                    alert('Failed to discard draft');
                }
            }
        });
    };

    const savePost = async () => {
        if (!filename || !isDirty || loading) return;
        setLoading(true);
        setSaveStatus('saving');
        try {
            const html = editor.getHTML();
            console.log('[Save] Sending to /api/posts:', { filename, title });

            const res = await axios.post('/api/posts', {
                filename,
                frontmatter: { ...currentPost?.frontmatter, title, tags: postTags, categories: postCategories },
                html
            });

            console.log('[Save] Success:', res.data);

            // Update local state with the authoritative frontmatter from server
            if (res.data.frontmatter) {
                setCurrentPost(prev => ({ ...prev, frontmatter: res.data.frontmatter }));
            }

            const normalized = editor.getHTML();
            originalContentRef.current = { title, html: normalized };
            setOriginalContent({ title, html: normalized, tags: postTags, categories: postCategories });
            setIsDirty(false);
            setLoading(false);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('saved'), 3000);
            fetchPosts();
        } catch (err) {
            console.error('[Save] Failed to save post:', err);
            if (err.response) {
                console.error('[Save] Server Error Data:', err.response.data);
                console.error('[Save] Server Status:', err.response.status);
            }
            setLoading(false);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 5000);
        }
    };

    useEffect(() => {
        if (!workflow || workflow.status !== 'active' || isWorkflowProcessingRef.current) return;

        const executeStep = async () => {
            isWorkflowProcessingRef.current = true;
            const currentStep = workflow.steps[workflow.currentIndex];

            try {
                if (currentStep === 'save') {
                    setSaveStatus('saving');
                    const html = editor.getHTML();
                    await axios.post('/api/posts', {
                        filename,
                        frontmatter: { ...currentPost?.frontmatter, title, tags: postTags, categories: postCategories },
                        html
                    });
                    setSaveStatus('success');
                    setIsDirty(false);
                    setTimeout(() => setSaveStatus('saved'), 2000);
                } else if (currentStep === 'publish') {
                    setDeployStatus('publishing');
                    await axios.post('/api/publish');
                } else if (currentStep === 'commit') {
                    if (!workflow.commitMessage) {
                        setWorkflow(prev => ({ ...prev, status: 'paused' }));
                        isWorkflowProcessingRef.current = false;
                        return;
                    }
                    setDeployStatus('committing');
                    await axios.post('/api/git/commit', {
                        message: workflow.commitMessage,
                        filename
                    });
                } else if (currentStep === 'push') {
                    setDeployStatus('pushing');
                    await axios.post('/api/git/push');
                }

                // Proceed to next step or complete (using functional updates to ensure latest state)
                setWorkflow(prev => {
                    if (!prev || prev.status !== 'active') return prev;
                    if (prev.currentIndex < prev.steps.length - 1) {
                        return { ...prev, currentIndex: prev.currentIndex + 1 };
                    } else {
                        setDeployStatus(null);
                        fetchPosts();
                        return { ...prev, status: 'completed' };
                    }
                });
            } catch (err) {
                console.error(`[Workflow] Step ${currentStep} failed:`, err);
                setWorkflow(prev => ({
                    ...prev,
                    status: 'error',
                    error: err.response?.data?.error || err.message
                }));
                setDeployStatus(null);
            } finally {
                isWorkflowProcessingRef.current = false;
            }
        };

        executeStep();
    }, [workflow, filename, title, postTags, postCategories, editor, currentPost]);

    const handleSaveWorkflowAction = (steps) => {
        if (!filename || loading || !!deployStatus) return;
        setWorkflow({
            steps,
            currentIndex: 0,
            status: 'active',
            error: null,
            commitMessage: null
        });
    };

    const createNewPost = () => {
        setShowNewPostModal(true);
    };

    const handleNewPostConfirm = (name, metadata = {}) => {
        if (!name) return;
        const finalName = (name.endsWith('.md') ? name : `${name}.md`).split(' ').join('').toLowerCase();
        setFilename(finalName);
        setTitle(name);
        editor.commands.setContent('');
        setCurrentPost({ frontmatter: { title: name, ...metadata }, hasDraft: false });

        const newPost = {
            filename: finalName,
            title: name,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            hasDraft: true,
            isUnpublished: true, // Mark as unpublished initially
            tags: [],
            categories: [],
            ...metadata // Include initial metadata (e.g. type: 'introduction')
        };

        setPosts(prev => [newPost, ...prev]);
        setHistory([{ title: name, html: '', tags: [], categories: [], ...metadata, timestamp: new Date().toISOString(), isOriginal: true }]);
        setHistoryIndex(0);
        setIsDirty(true);
        setShowNewPostModal(false);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        await axios.post('/api/upload', formData);
        fetchLibraryImages();
    };

    const selectFromLibrary = (imageUrl) => {
        editor.chain().focus().setImage({ src: imageUrl }).run();
        setShowMediaLibrary(false);
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('created'); // 'title', 'created', 'modified'
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

    const allTags = useMemo(() => {
        const tags = new Set();
        posts.forEach(p => (p.tags || []).forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [posts]);

    const allCategories = useMemo(() => {
        const cats = new Set();
        posts.forEach(p => (p.categories || []).forEach(c => cats.add(c)));
        return Array.from(cats).sort();
    }, [posts]);

    const introductionPost = useMemo(() => posts.find(p => p.type === 'introduction'), [posts]);

    const filteredAndSortedPosts = posts
        .filter(post => {
            if (post.type === 'introduction') return false; // Exclude intro post from main list
            const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.filename.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            if (activeTab === 'drafts' && !post.hasDraft) return false;
            if (activeTab === 'unpublished' && !post.isUnpublished) return false;

            // Multi-select Tags (Union: must have atleast one selected tag)
            if (selectedTags.length > 0) {
                const postTags = post.tags || [];
                const hasAllTags = selectedTags.some(t => postTags.includes(t));
                if (!hasAllTags) return false;
            }

            // Multi-select Categories (Union: must have atleast one selected category)
            if (selectedCategories.length > 0) {
                const postCats = post.categories || [];
                const hasAllCats = selectedCategories.some(c => postCats.includes(c));
                if (!hasAllCats) return false;
            }

            const checkRange = (date, range) => {
                if (!range.start && !range.end) return true;
                const d = new Date(date).setHours(0, 0, 0, 0);
                if (range.start) {
                    const start = new Date(range.start).setHours(0, 0, 0, 0);
                    if (d < start) return false;
                }
                if (range.end) {
                    const end = new Date(range.end).setHours(0, 0, 0, 0);
                    if (d > end) return false;
                }
                return true;
            };

            if (!checkRange(post.created, createdRange)) return false;
            if (!checkRange(post.modified, modifiedRange)) return false;

            return true;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'filename':
                    comparison = a.filename.localeCompare(b.filename);
                    break;
                case 'created':
                    comparison = new Date(a.created) - new Date(b.created);
                    break;
                case 'modified':
                    comparison = new Date(a.modified) - new Date(b.modified);
                    break;
                case 'status':
                    // Sort by draft status (drafts first if DESC)
                    comparison = (a.hasDraft ? 1 : 0) - (b.hasDraft ? 1 : 0);
                    break;
                default:
                    comparison = 0;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });


    const clearAllFilters = () => {
        setSelectedTags([]);
        setSelectedCategories([]);
        setCreatedRange({ start: null, end: null });
        setModifiedRange({ start: null, end: null });
        setShowFilters(false);
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <ConfirmationModal config={modalConfig} onClose={() => setModalConfig(null)} />

            {!isReadonly && (
                <NewPostModal
                    isOpen={showNewPostModal}
                    onClose={() => setShowNewPostModal(false)}
                    onConfirm={handleNewPostConfirm}
                    existingFilenames={posts.map(p => p.filename)}
                />
            )}

            {!isReadonly && (
                <MetadataModal
                    isOpen={showMetadataModal}
                    onClose={() => setShowMetadataModal(false)}
                    tags={allTags}
                    categories={allCategories}
                    postTags={postTags}
                    postCategories={postCategories}
                    onTagsChange={setPostTags}
                    onCategoriesChange={setPostCategories}
                />
            )}

            {!isReadonly && (
                <YoutubeEmbedModal
                    isOpen={showYoutubeModal}
                    onClose={() => setShowYoutubeModal(false)}
                    onConfirm={(id) => {
                        editor.chain().focus().setYoutubeVideo({ 'data-youtube-video': id }).run();
                        setShowYoutubeModal(false);
                    }}
                />
            )}
            {!isReadonly && (
                <ImageSelectorModal
                    isOpen={showMediaLibrary}
                    onClose={() => setShowMediaLibrary(false)}
                    images={libraryImages}
                    onSelect={selectFromLibrary}
                    onUpload={handleImageUpload}
                />
            )}

            {!isReadonly && (
                <WorkflowStatusModal
                    isOpen={!!workflow}
                    onClose={() => setWorkflow(null)}
                    workflow={workflow}
                    currentTitle={title}
                    onAbort={() => setWorkflow(null)}
                    onCancelStep={(idx) => {
                        setWorkflow(prev => {
                            const newSteps = prev.steps.slice(0, idx);
                            // If we cancelled the current step or all steps, just close the modal or mark it done?
                            // Logic: User wants to STOP at 'idx'. So steps after 'idx-1' are removed.
                            if (newSteps.length === 0) return null;
                            return { ...prev, steps: newSteps };
                        });
                    }}
                    onConfirmCommit={(msg) => {
                        setWorkflow(prev => ({ ...prev, status: 'active', commitMessage: msg }));
                    }}
                />
            )}

            {/* Mobile Sidebar Overlay */}
            {showSidebar && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setShowSidebar(false)}
                />
            )}

            {/* Sidebar */}
            {showSidebar && (
                <div
                    className="fixed inset-y-0 left-0 z-50 md:sticky md:top-0 md:h-screen md:relative md:z-30 bg-zinc-900 border-r border-zinc-800 flex flex-col flex-shrink-0 group/sidebar shadow-2xl md:shadow-none"
                    style={{ width: Math.min(sidebarWidth, typeof window !== 'undefined' ? window.innerWidth - 60 : 300) }}
                >
                    <div className="p-6 border-b border-zinc-800">
                        <div className="flex justify-between items-center mb-6 min-h-14">
                            <button onClick={() => {
                                setFilename(null);
                                setCurrentPost(null);
                                setHistory([]);
                                setHistoryIndex(-1);
                                setIsDirty(false);
                                setSaveStatus(null);
                                setOriginalContent({ title: '', html: '', tags: [], categories: [] });
                            }} className="hover:opacity-80 transition-opacity text-left">
                                <h1 className="text-xl font-bold tracking-tight text-white">{import.meta.env.TITLE}</h1>
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-1 rounded font-mono hidden sm:inline-block">
                                    {posts.length} POSTS
                                </span>
                                {/* Mobile Close Button */}
                                <button
                                    onClick={() => setShowSidebar(false)}
                                    className="w-10 h-10 flex items-center justify-center p-0 md:hidden text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    <PanelLeftClose size={20} />
                                </button>
                                {!isReadonly && (
                                    <button
                                        onClick={createNewPost}
                                        className="w-10 h-10 flex items-center justify-center p-0 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors border border-emerald-500/20"
                                        title="New Post"
                                    >
                                        <Plus size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search posts..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:border-white transition-colors"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`w-10 h-10 flex items-center justify-center p-0 rounded-lg border transition-all ${showFilters || selectedTags.length > 0 || selectedCategories.length > 0 || createdRange.start || modifiedRange.start
                                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-white'
                                        }`}
                                    title="Toggle Filters"
                                >
                                    <Filter size={16} />
                                    {(selectedTags.length > 0 || selectedCategories.length > 0 || createdRange.start || modifiedRange.start) && (
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                    )}
                                </button>
                            </div>

                            {/* Filters Panel */}
                            {showFilters && (
                                <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-4 shadow-xl max-h-[60vh] overflow-y-auto custom-scrollbar">
                                    <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Advanced Filters</span>
                                        <button
                                            onClick={clearAllFilters}
                                            className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors uppercase font-bold tracking-wide flex items-center gap-1"
                                        >
                                            <XCircle size={10} />
                                            Clear All
                                        </button>
                                    </div>

                                    {!isReadonly && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Status</label>
                                            <div className="flex p-1 bg-zinc-900 rounded-lg border border-zinc-700">
                                                {['all', 'drafts', 'unpublished'].map(tab => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => setActiveTab(tab)}
                                                        className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${activeTab === tab
                                                            ? 'bg-zinc-800 text-white shadow-sm'
                                                            : 'text-zinc-500 hover:text-zinc-300'
                                                            }`}
                                                    >
                                                        {tab}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <MultiSelect
                                            label="Tags"
                                            options={allTags}
                                            selected={selectedTags}
                                            onChange={setSelectedTags}
                                        />
                                        <MultiSelect
                                            label="Categories"
                                            options={allCategories}
                                            selected={selectedCategories}
                                            onChange={setSelectedCategories}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <CalendarRangePicker
                                            label="Created Date Range"
                                            range={createdRange}
                                            onChange={setCreatedRange}
                                        />
                                        <CalendarRangePicker
                                            label="Modified Date Range"
                                            range={modifiedRange}
                                            onChange={setModifiedRange}
                                        />
                                    </div>

                                    {(selectedTags.length > 0 || selectedCategories.length > 0 || createdRange.start || modifiedRange.start || (activeTab !== 'all' && !isReadonly)) && (
                                        <button
                                            onClick={clearAllFilters}
                                            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
                                        >
                                            Reset Filters
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="space-y-1.5 pt-2 border-t border-zinc-800/50">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] uppercase font-bold text-zinc-500">Sort by</label>
                                    <span className="text-[10px] text-zinc-600 font-mono">{sortOrder.toUpperCase()}</span>
                                </div>
                                <div className="flex gap-2">
                                    <SortDropdown
                                        value={sortBy}
                                        onChange={setSortBy}
                                        options={[
                                            { value: 'created', label: 'Date Created' },
                                            { value: 'modified', label: 'Date Modified' },
                                            { value: 'title', label: 'Post Title' },
                                            { value: 'filename', label: 'Filename' },
                                            !isReadonly && { value: 'status', label: 'Draft Status' },
                                        ].filter(Boolean)}
                                    />
                                    <button
                                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                        className={`w-10 flex items-center justify-center p-0 rounded-lg border transition-all ${sortOrder === 'asc' ? 'bg-zinc-800 border-zinc-700' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                                            } hover:border-white`}
                                        title={`Switch to ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                                    >
                                        {sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredAndSortedPosts.map(post => (
                            <button
                                key={post.filename}
                                onClick={() => loadPost(post.filename)}
                                className={`w-full text-left p-3 rounded-lg transition-all flex items-start gap-3 relative group ${filename === post.filename ? 'bg-zinc-800 shadow-lg border border-zinc-700' : 'hover:bg-zinc-800/50 border border-transparent'
                                    }`}
                                title={post.title}
                            >
                                <FileText size={18} className="text-zinc-500 mt-1 flex-shrink-0" />
                                {/* Show yellow dot if unsaved changes in editor OR if there's a saved draft on disk */}
                                {!isReadonly && ((isDirty && filename === post.filename) || post.hasDraft) && (
                                    <div className={`absolute top-3 right-3 w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${post.isUnpublished ? 'bg-purple-400 text-purple-400' : 'bg-yellow-400 text-yellow-400'}`} title={post.isUnpublished ? "Unpublished Draft" : "Unsaved changes (Draft)"} />
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium truncate">{post.title}</div>
                                    <div className="flex items-center gap-3 mt-1.5 opacity-60">
                                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono" title={`Created: ${new Date(post.created).toLocaleString()}`}>
                                            <Calendar size={10} />
                                            <span>{new Date(post.created).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono" title={`Modified: ${new Date(post.modified).toLocaleString()}`}>
                                            <Edit3 size={10} />
                                            <span>{new Date(post.modified).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Pinned Introduction Post */}
                    {(introductionPost || !isReadonly) && (
                        <div className="p-2 border-t border-zinc-800 bg-zinc-900/30">
                            {introductionPost ? (
                                <button
                                    onClick={() => loadPost(introductionPost.filename)}
                                    className={`w-full text-left p-3 rounded-lg transition-all flex items-start gap-3 relative group border-2 ${filename === introductionPost.filename
                                        ? 'bg-zinc-800 shadow-md border-emerald-500/50' // Highlight active pinned post
                                        : 'hover:bg-zinc-800/50 border-emerald-500/20 hover:border-emerald-500/40' // Distinct border for pinned
                                        }`}
                                    title={introductionPost.title}
                                >
                                    <div className="text-emerald-500 mt-1 flex-shrink-0">
                                        <Pin size={18} fill="currentColor" className="opacity-80" />
                                    </div>
                                    {!isReadonly && ((isDirty && filename === introductionPost.filename) || introductionPost.hasDraft) && (
                                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_currentColor]" title="Unsaved changes" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-bold truncate text-emerald-100">{introductionPost.title}</div>
                                        <div className="flex items-center gap-2 mt-1.5 opacity-60">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">Introduction</span>
                                        </div>
                                    </div>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleNewPostConfirm('Introduction', { type: 'introduction' })}
                                    className="w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800/50 group text-zinc-500 hover:text-emerald-500"
                                    title="Create Introduction Post"
                                >
                                    <div className="mt-0.5 flex-shrink-0">
                                        <Pin size={18} className="opacity-50 group-hover:opacity-100" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium">Create Introduction</div>
                                        <div className="text-[10px] mt-0.5 opacity-60">Pinned Recommendation</div>
                                    </div>
                                    <Plus size={16} className="opacity-50 group-hover:opacity-100" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Drag Handle - made larger and centered on border for better usability */}
                    <div
                        onMouseDown={startResizing}
                        className="absolute right-0 translate-x-1/2 top-0 bottom-0 w-4 bg-transparent hover:bg-emerald-500/50 cursor-col-resize z-50 transition-colors"
                    />
                </div>
            )
            }

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden relative">
                {filename ? (
                    <>
                        <div className="h-16 border-b border-zinc-800 px-4 md:px-8 flex items-center justify-between bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-20">
                            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0 mr-2 md:mr-4">
                                <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                                    <button
                                        onClick={() => setShowSidebar(!showSidebar)}
                                        className={`w-10 h-10 flex items-center justify-center p-0 rounded-lg transition-colors text-zinc-500 hover:text-white hover:bg-zinc-800/50`}
                                        title={showSidebar ? "Collapse Sidebar" : "Expand Sidebar"}
                                    >
                                        {showSidebar ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                                    </button>
                                    <div className={`h-6 w-px bg-zinc-800 ${!showSidebar && 'hidden'}`} />
                                    {isReadonly ? (
                                        <h1 className="text-lg md:text-xl font-bold w-full truncate mb-0 flex justify-between items-center">{title}</h1>
                                    ) : (
                                        <input
                                            ref={titleRef}
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="bg-transparent text-lg md:text-xl font-bold outline-none w-full min-w-0 mb-0"
                                            placeholder="Post Title"
                                        />
                                    )}
                                </div>
                                <div className="flex-shrink-0 flex items-center justify-end">
                                    {/* Unified Status Badge */}
                                    {saveStatus === 'saving' && (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-800 rounded text-zinc-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                            <div className="w-2 h-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            <span className="hidden md:inline">Saving</span>
                                        </div>
                                    )}
                                    {saveStatus === 'success' && (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-500/20">
                                            <CheckCircle size={10} />
                                            <span className="hidden md:inline">Saved</span>
                                        </span>
                                    )}
                                    {saveStatus === 'error' && (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-900/20 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded border border-red-900/30">
                                            <AlertCircle size={10} />
                                            <span className="hidden md:inline">Error</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={async () => {
                                        const url = new URL(window.location);
                                        url.searchParams.set('post', filename.replace('.md', ''));
                                        const shareUrl = url.toString();

                                        if (navigator.share) {
                                            try {
                                                await navigator.share({
                                                    title: `${title} | ${import.meta.env.TITLE}`,
                                                    text: `Check out "${title}"`,
                                                    url: shareUrl
                                                });
                                                return; // Shared successfully
                                            } catch (err) {
                                                // User cancelled or share failed, fallback to copy
                                                console.log('Share cancelled/failed, falling back to copy');
                                            }
                                        }

                                        // Fallback: Clipboard
                                        try {
                                            await navigator.clipboard.writeText(shareUrl);
                                            setIsCopied(true);
                                            setTimeout(() => setIsCopied(false), 2000);
                                        } catch (err) {
                                            console.error('Failed to copy', err);
                                        }
                                    }}
                                    className={`w-10 h-10 flex items-center justify-center p-0 rounded-lg transition-colors mr-2 ${isCopied ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
                                    title={isCopied ? "Link Copied!" : "Share Link"}
                                >
                                    {isCopied ? <CheckCircle size={20} /> : <Share2 size={20} />}
                                </button>

                            </div>

                            {!isReadonly && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 md:mr-4 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                                        <button
                                            onClick={() => setShowDiff(false)}
                                            className={`p-2 md:px-3 md:py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${!showDiff ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}
                                            title="Editor View"
                                        >
                                            <Edit3 size={16} className="md:hidden" />
                                            <span className="hidden md:inline">Editor</span>
                                        </button>
                                        <button
                                            onClick={() => setShowDiff(true)}
                                            className={`p-2 md:px-3 md:py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${showDiff ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-sm' : 'text-zinc-500 hover:text-white'}`}
                                            title="Version History"
                                        >
                                            <Clock size={16} className="md:hidden" />
                                            <span className="hidden md:inline">History</span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleDiscard}
                                        disabled={!currentPost?.hasDraft}
                                        className={`w-10 h-10 flex items-center justify-center p-0 transition-colors rounded-lg ${!currentPost?.hasDraft
                                            ? 'text-zinc-700 cursor-not-allowed'
                                            : 'text-zinc-500 hover:text-red-400 hover:bg-red-400/10'
                                            }`}
                                        title={currentPost?.hasDraft ? "Discard Draft" : "No Draft to Discard"}
                                    >
                                        <XCircle size={20} />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="w-10 h-10 flex items-center justify-center p-0 text-red-900 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors group"
                                        title="Delete Post"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                    <SaveSplitButton
                                        isSaving={saveStatus === 'saving'}
                                        isDirty={isDirty || !!deployStatus}
                                        deployStatus={deployStatus}
                                        onSave={savePost}
                                        onAction={handleSaveWorkflowAction}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Responsive Toolbar */}
                        {!isReadonly && !showDiff && (
                            <ResponsiveToolbar
                                editor={editor}
                                onHistoryUndo={() => {
                                    if (historyIndex > 0) {
                                        if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
                                        const newIndex = historyIndex - 1;
                                        syncHistoryWithServer(newIndex);
                                    }
                                }}
                                onHistoryRedo={() => {
                                    if (historyIndex < history.length - 1) {
                                        if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
                                        const newIndex = historyIndex + 1;
                                        syncHistoryWithServer(newIndex);
                                    }
                                }}
                                canUndo={historyIndex > 0}
                                canRedo={historyIndex < history.length - 1}
                                showMetadataModal={() => setShowMetadataModal(true)}
                                hasMetadata={postTags.length > 0 || postCategories.length > 0}
                                showMetadataActive={showMetadataModal}
                                onShowMediaLibrary={() => {
                                    setShowMediaLibrary(true);
                                    fetchLibraryImages();
                                }}
                                onAddYoutube={() => setShowYoutubeModal(true)}
                            />
                        )}

                        <div className="flex-1 overflow-y-auto relative bg-zinc-950">
                            {showDiff ? (
                                // Assume HistoryView is only accessible if !isReadonly because the toggle is hidden
                                <HistoryView
                                    history={history}
                                    originalHtml={originalContent.html}
                                    originalTitle={originalContent.title}
                                    originalTags={originalContent.tags}
                                    originalCategories={originalContent.categories}
                                    current={editor.getHTML()}
                                    currentIndex={historyIndex}
                                    onSelect={(idx) => {
                                        syncHistoryWithServer(idx);
                                        setShowDiff(false);
                                    }}
                                />
                            ) : (
                                <div className="max-w-6xl mx-auto px-2 py-3 md:px-8 md:py-12">
                                    {editor && (
                                        <BubbleMenu
                                            editor={editor}
                                            shouldShow={({ editor }) => !isReadonly && !editor.state.selection.empty && !editor.isActive('image')}
                                            tippyOptions={{ duration: 100, zIndex: 9999, maxWidth: '98vw', interactive: true }}
                                        >
                                            <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl flex items-center p-1 gap-1 flex-wrap overflow-visible max-w-[90vw] custom-scrollbar">
                                                <button
                                                    onClick={() => editor.chain().focus().toggleBold().run()}
                                                    className={`p-1.5 rounded hover:bg-zinc-800 ${editor.isActive('bold') ? 'text-yellow-400 bg-zinc-800' : 'text-zinc-300'}`}
                                                    title="Bold"
                                                >
                                                    <Bold size={16} />
                                                </button>
                                                <button
                                                    onClick={() => editor.chain().focus().toggleItalic().run()}
                                                    className={`p-1.5 rounded hover:bg-zinc-800 ${editor.isActive('italic') ? 'text-yellow-400 bg-zinc-800' : 'text-zinc-300'}`}
                                                    title="Italic"
                                                >
                                                    <Italic size={16} />
                                                </button>
                                                <div className="w-px h-4 bg-zinc-800 mx-1" />
                                                <FontSizeSelector editor={editor} />
                                                <div className="w-px h-4 bg-zinc-800 mx-1" />
                                                <ColorSelector
                                                    icon={Highlighter}
                                                    title="Highlight"
                                                    activeColor={editor.getAttributes('highlight').color}
                                                    onChange={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
                                                    onRemove={() => editor.chain().focus().unsetHighlight().run()}
                                                    presets={['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#e9d5ff', '#fed7aa', '#fecaca']}
                                                    variant="highlight"
                                                />
                                                <ColorSelector
                                                    icon={Palette}
                                                    title="Text Color"
                                                    activeColor={editor.getAttributes('textStyle').color}
                                                    onChange={(color) => editor.chain().focus().setColor(color).run()}
                                                    onRemove={() => editor.chain().focus().unsetColor().run()}
                                                    presets={['#000000', '#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#71717a']}
                                                    variant="text"
                                                />
                                                <div className="w-px h-4 bg-zinc-800 mx-1" />
                                                <button
                                                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                                                    className={`p-1.5 rounded hover:bg-zinc-800 ${editor.isActive('codeBlock') ? 'text-yellow-400 bg-zinc-800' : 'text-zinc-300'}`}
                                                    title="Code Block"
                                                >
                                                    <Code size={16} />
                                                </button>
                                                <button
                                                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                                    className={`p-1.5 rounded hover:bg-zinc-800 ${editor.isActive('blockquote') ? 'text-yellow-400 bg-zinc-800' : 'text-zinc-300'}`}
                                                    title="Quote"
                                                >
                                                    <Quote size={16} />
                                                </button>
                                            </div>
                                        </BubbleMenu>
                                    )}
                                    <EditorContent editor={editor} />
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col h-full">
                        {/* Empty State Header for Mobile Navigation */}
                        <div className="h-16 border-b border-zinc-800 px-8 flex items-center bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-20">
                            <button
                                onClick={() => setShowSidebar(!showSidebar)}
                                className={`p-2 rounded-lg transition-colors text-zinc-500 hover:text-white hover:bg-zinc-800/50 mr-4`}
                                title={showSidebar ? "Collapse Sidebar" : "Expand Sidebar"}
                            >
                                {showSidebar ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                            </button>
                            <h1 className="text-xl font-bold text-zinc-500"></h1>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4 p-4 text-center">
                            <FileText size={64} className="opacity-20" />
                            <p className="text-lg">Select a post to start {!isReadonly ? 'editing' : 'reading'}</p>
                        </div>
                    </div>
                )}


            </div>

            {/* Debug Overlay Panel */}
            {
                !isReadonlyEnv && (
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className={`fixed bottom-4 right-4 z-[110] w-10 h-10 flex items-center justify-center rounded-lg border transition-all duration-300 ${showDebug
                            ? 'bg-zinc-100 border-zinc-200 text-zinc-900 shadow-xl scale-110'
                            : 'bg-zinc-900/80 backdrop-blur-md border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'
                            }`}
                        title="Mission Control Debugger"
                    >
                        {showDebug ? <X size={18} /> : <Settings size={18} />}
                    </button>
                )
            }

            {
                showDebug && !isReadonlyEnv && (
                    <div className="fixed bottom-16 right-4 z-[100] bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl w-80 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[80vh]">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity size={16} className="text-emerald-500" />
                                <h3 className="text-sm font-bold text-white tracking-tight">Debug Dashboard</h3>
                            </div>
                            <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded font-mono">v2.4.0</span>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                            {/* Tips Card */}
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Monitor size={48} />
                                </div>
                                <div className="flex gap-3 relative z-10">
                                    <Info className="text-blue-500 shrink-0" size={18} />
                                    <div>
                                        <p className="text-xs font-bold text-blue-200 mb-1">Visualization Tip</p>
                                        <p className="text-[10px] text-blue-200/70 leading-relaxed">
                                            The <code className="bg-blue-500/20 px-1 rounded text-blue-300">readonly=true</code> parameter helps you see exactly how the app looks when published.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Layout size={12} /> Interactive Controls
                                </h4>
                                <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg transition-colors ${isReadonlyUser ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
                                            {isReadonlyUser ? <Eye size={16} /> : <Edit3 size={16} />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-zinc-200">Readonly Mode</p>
                                            <p className="text-[10px] text-zinc-500">Hide editing tools</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const url = new URL(window.location);
                                            const newValue = !isReadonlyUser;
                                            if (newValue) url.searchParams.set('readonly', 'true');
                                            else url.searchParams.delete('readonly');
                                            window.history.replaceState({}, '', url);
                                            setIsReadonlyUser(newValue);
                                        }}
                                        className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${isReadonlyUser ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${isReadonlyUser ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            {/* App State */}
                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Cpu size={12} /> Live Engine State
                                </h4>
                                <div className="space-y-2 font-mono text-[11px]">
                                    <div className="flex justify-between py-1.5 px-3 bg-zinc-900/30 rounded-lg">
                                        <span className="text-zinc-500">isDirty</span>
                                        <span className={isDirty ? "text-yellow-400 font-bold" : "text-emerald-400"}>{isDirty ? "YES" : "NO"}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 px-3 bg-zinc-900/30 rounded-lg">
                                        <span className="text-zinc-500">title</span>
                                        <span className="text-zinc-300 truncate ml-4" title={title}>{title || "EMPTY"}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 px-3 bg-zinc-900/30 rounded-lg">
                                        <span className="text-zinc-500">filename</span>
                                        <span className="text-zinc-300 truncate ml-4" title={filename}>{filename || "none"}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 px-3 bg-zinc-900/30 rounded-lg">
                                        <span className="text-zinc-500">saveStatus</span>
                                        <span className="text-blue-400">{saveStatus || "idle"}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 px-3 bg-zinc-900/30 rounded-lg">
                                        <span className="text-zinc-500">historyPtr</span>
                                        <span className="text-zinc-300">{historyIndex} / {history.length}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 px-3 bg-zinc-900/30 rounded-lg">
                                        <span className="text-zinc-500">tokens</span>
                                        <span className="text-zinc-300">{editor ? editor.getText().length : 0} chars</span>
                                    </div>
                                </div>
                            </div>

                            {/* Environment */}
                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Database size={12} /> Configuration
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] text-zinc-500 mb-1">Site Configuration</p>
                                        <div className="space-y-1">
                                            <div className="p-2 bg-zinc-900/30 border border-zinc-800/50 rounded-lg flex flex-col gap-1">
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-zinc-500">Title</span>
                                                    <span className="text-zinc-300 truncate ml-2">{import.meta.env.TITLE}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-zinc-500">URL</span>
                                                    <span className="text-zinc-300 truncate ml-2">{import.meta.env.SITE_URL}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-zinc-500">Port</span>
                                                    <span className="text-zinc-300 font-mono">{import.meta.env.SERVER_PORT}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-zinc-500">Favicon</span>
                                                    <span className="text-zinc-300 truncate ml-2">{import.meta.env.FAVICON}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-zinc-500 mb-1">Filesystem Paths</p>
                                        <div className="space-y-1.5 font-mono text-[9px]">
                                            <div className="p-2 bg-zinc-900/30 border border-zinc-800/50 rounded-lg space-y-2">
                                                <div>
                                                    <span className="text-zinc-500 block mb-0.5">Content</span>
                                                    <span className="text-zinc-400 break-all leading-tight">{import.meta.env.CONTENT_DIR}</span>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-500 block mb-0.5">Static</span>
                                                    <span className="text-zinc-400 break-all leading-tight">{import.meta.env.STATIC_DIR}</span>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-500 block mb-0.5">Drafts</span>
                                                    <span className="text-zinc-400 break-all leading-tight">{import.meta.env.DRAFTS_DIR}</span>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-500 block mb-0.5">Dist</span>
                                                    <span className="text-zinc-400 break-all leading-tight">{import.meta.env.DIST_DIR}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-zinc-500 mb-1">Git Permissions</p>
                                        <div className={`p-2 rounded-lg text-[10px] font-bold flex items-center gap-2 ${import.meta.env.ALLOW_PUSH === 'true' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'}`}>
                                            {import.meta.env.ALLOW_PUSH === 'true' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            {import.meta.env.ALLOW_PUSH === 'true' ? 'ALLOW_PUSH: ENABLED' : 'ALLOW_PUSH: DISABLED'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 text-center">
                            <p className="text-[9px] text-zinc-600 uppercase tracking-tighter">Mission Control Debugger &copy; 2026</p>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

// Helper function moved out of App to avoid recreation on render
const getTextContent = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
};

// HistoryView moved out of App to ensure stable identity and prevent remounting/scrolling glitches
const HistoryView = ({ history, originalHtml, originalTitle: originalTitleProp, originalTags = [], originalCategories = [], current, currentIndex, onSelect }) => {
    const [selectedIdx, setSelectedIdx] = useState(currentIndex);
    const [mode, setMode] = useState('visual'); // 'visual' | 'source' | 'text'

    // Sync Scrolling Refs
    const leftRef = React.useRef(null);
    const rightRef = React.useRef(null);
    const activeVersionRef = React.useRef(null);
    const isScrolling = React.useRef(false);

    // Auto-scroll to selected version
    React.useEffect(() => {
        if (activeVersionRef.current) {
            activeVersionRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [selectedIdx]);

    const handleScroll = (source) => (e) => {
        if (isScrolling.current) return;
        isScrolling.current = true;
        const target = source === 'left' ? rightRef.current : leftRef.current;
        if (target) {
            const percentage = e.target.scrollTop / (e.target.scrollHeight - e.target.clientHeight);
            if (Number.isFinite(percentage)) {
                target.scrollTop = percentage * (target.scrollHeight - target.clientHeight);
            }
        }
        setTimeout(() => { isScrolling.current = false; }, 50);
    };

    const selectedState = history[selectedIdx] || {};
    const compareHtml = selectedState.html || '';

    const diffSource = React.useMemo(() => {
        if (mode === 'visual') return null;
        if (mode === 'source') {
            return Diff.diffLines(originalHtml || '', compareHtml);
        }
        if (mode === 'text') {
            return Diff.diffWords(getTextContent(originalHtml || ''), getTextContent(compareHtml));
        }
        return null;
    }, [originalHtml, compareHtml, mode]);

    // Calculate Title Diff
    const diffTitle = React.useMemo(() => {
        if (mode === 'visual') return null;
        const originalTitle = typeof originalTitleProp === 'string' ? originalTitleProp : '';
        const compareTitle = selectedState.title || '';
        return Diff.diffWords(originalTitle, compareTitle);
    }, [originalTitleProp, selectedState.title, mode]);

    // Helper for Array Diff
    const getArrayDiff = (oldArr = [], newArr = []) => {
        const added = newArr.filter(x => !oldArr.includes(x));
        const removed = oldArr.filter(x => !newArr.includes(x));
        const unchanged = oldArr.filter(x => newArr.includes(x));
        return { added, removed, unchanged };
    };

    const tagDiff = React.useMemo(() => getArrayDiff(originalTags, selectedState.tags), [originalTags, selectedState.tags]);
    const catDiff = React.useMemo(() => getArrayDiff(originalCategories, selectedState.categories), [originalCategories, selectedState.categories]);

    const renderMetadataDiff = (diff, label, forOriginal) => {
        if (!diff) return null;
        const { added, removed, unchanged } = diff;
        if (added.length === 0 && removed.length === 0 && unchanged.length === 0) return null;

        return (
            <div className="mb-4">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</div>
                <div className="flex flex-wrap gap-1.5">
                    {unchanged.map(item => (
                        <span key={item} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-xs border border-zinc-700">{item}</span>
                    ))}
                    {forOriginal ? removed.map(item => (
                        <span key={item} className="px-2 py-0.5 rounded bg-red-900/20 text-red-400 text-xs border border-red-900/30 line-through decoration-red-400/50" title="Removed">
                            {item}
                        </span>
                    )) : added.map(item => (
                        <span key={item} className="px-2 py-0.5 rounded bg-emerald-900/20 text-emerald-400 text-xs border border-emerald-900/30 font-bold" title="Added">
                            + {item}
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    const renderMetadataCurrent = (items = [], label) => {
        if (!items || items.length === 0) return null;
        return (
            <div className="mb-4">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</div>
                <div className="flex flex-wrap gap-1.5">
                    {items.map(item => (
                        <span key={item} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs border border-zinc-700">{item}</span>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col md:flex-row h-full bg-zinc-950">
            {/* History Sidebar - Styled to match main sidebar */}
            <div className="w-full md:w-64 h-56 md:h-auto bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col flex-shrink-0">
                <div className="h-10 md:h-16 flex items-center px-4 md:px-6 border-b border-zinc-800">
                    <span className="font-bold text-zinc-400 text-xs uppercase tracking-wider">
                        Version History
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto bg-zinc-900/30">
                    {history.map((item, idx) => {
                        const isCurrent = idx === currentIndex;
                        const isOriginal = idx === 0;
                        const isSelected = selectedIdx === idx;
                        return (
                            <button
                                key={idx}
                                ref={isSelected ? activeVersionRef : null}
                                onClick={() => setSelectedIdx(idx)}
                                className={`w-full text-left px-4 md:px-6 py-3 md:py-4 border-b border-zinc-800/50 flex flex-col gap-1 transition-all ${isSelected
                                    ? 'bg-zinc-900 border-l-2 border-l-emerald-500'
                                    : 'hover:bg-zinc-900/50 border-l-2 border-l-transparent'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-sm font-bold ${isOriginal ? 'text-blue-400' : 'text-zinc-300'}`}>
                                        {isOriginal ? 'Original' : `Version ${idx}`}
                                    </span>
                                    {isCurrent && (
                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Active</span>
                                    )}
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500">
                                    {new Date(item.timestamp).toLocaleString(undefined, {
                                        month: 'short', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <div className="p-2 md:p-4 border-t border-zinc-800 bg-zinc-900/50">
                    <button
                        onClick={() => onSelect(selectedIdx)}
                        className="w-full py-2 md:py-2.5 bg-zinc-100 hover:bg-white text-black font-bold rounded-lg text-xs uppercase tracking-wide transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                        <span className="md:hidden"><Redo size={14} /></span>
                        Restore Version
                    </button>
                </div>
            </div>

            {/* Diff Area - Flex Col on Mobile (Split Top/Bottom), Grid on Desktop (Split Left/Right) */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="p-2 min-h-12 md:min-h-16 md:p-3 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-950/95 backdrop-blur z-20">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 pl-1 md:pl-2">Original (Reference)</span>
                    <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 shadow-sm">
                        <button onClick={() => setMode('visual')} className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${mode === 'visual' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}>Preview</button>
                        <button onClick={() => setMode('text')} className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${mode === 'text' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}>Text</button>
                        <button onClick={() => setMode('source')} className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${mode === 'source' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}>Source</button>
                    </div>
                </div>
                <div ref={leftRef} onScroll={handleScroll('left')} className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Title Display/Diff */}
                    <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 border-b border-zinc-800/50">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Title</div>
                        {mode === 'visual' ? (
                            <div className="text-lg md:text-xl font-bold text-zinc-400 mb-4 md:mb-6 break-words">{originalTitleProp}</div>
                        ) : (
                            <div className="text-lg md:text-xl font-bold text-zinc-400 font-mono mb-4 md:mb-6 break-words">
                                {diffTitle ? diffTitle.map((part, i) => !part.added && <span key={i} style={part.removed ? { backgroundColor: 'rgba(127,29,29,0.4)', textDecoration: 'line-through' } : {}}>{part.value}</span>) : originalTitleProp}
                            </div>
                        )}

                        {/* Metadata Original/Diff Left */}
                        {mode !== 'visual' ? (
                            <>
                                {renderMetadataDiff(tagDiff, 'Tags', true)}
                                {renderMetadataDiff(catDiff, 'Categories', true)}
                            </>
                        ) : (
                            <>
                                {renderMetadataCurrent(originalTags, 'Tags')}
                                {renderMetadataCurrent(originalCategories, 'Categories')}
                            </>
                        )}
                    </div>
                    <div className="p-4 md:p-8">
                        {mode === 'visual' ? (
                            <div className="prose prose-invert max-w-none prose-sm md:prose-base" dangerouslySetInnerHTML={{ __html: originalHtml }} />
                        ) : (
                            <pre className="font-mono text-xs text-zinc-400 whitespace-pre-wrap">{diffSource && diffSource.map((part, i) => !part.added && <span key={i} style={part.removed ? { backgroundColor: 'rgba(127,29,29,0.4)', textDecoration: 'line-through' } : {}}>{part.value}</span>)}</pre>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-zinc-900/20">
                <div className="p-2 min-h-12 md:min-h-16 md:p-3 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-emerald-500 sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
                    Selected Version ({selectedIdx})
                </div>
                <div ref={rightRef} onScroll={handleScroll('right')} className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Title Display/Diff */}
                    <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 border-b border-zinc-800/50 shrink-0">
                        <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Title</div>
                        {mode === 'visual' ? (
                            <div className="text-lg md:text-xl font-bold text-zinc-200 mb-4 md:mb-6 break-words">{selectedState.title}</div>
                        ) : (
                            <div className="text-lg md:text-xl font-bold text-zinc-200 font-mono mb-4 md:mb-6 break-words">
                                {diffTitle ? diffTitle.map((part, i) => !part.removed && <span key={i} style={part.added ? { backgroundColor: 'rgba(6,78,59,0.4)' } : {}}>{part.value}</span>) : selectedState.title}
                            </div>
                        )}

                        {/* Metadata Current/Diff Right */}
                        {mode !== 'visual' ? (
                            <>
                                {renderMetadataDiff(tagDiff, 'Tags', false)}
                                {renderMetadataDiff(catDiff, 'Categories', false)}
                            </>
                        ) : (
                            <>
                                {renderMetadataCurrent(selectedState.tags, 'Tags')}
                                {renderMetadataCurrent(selectedState.categories, 'Categories')}
                            </>
                        )}
                    </div>
                    <div className="p-4 md:p-8">
                        {mode === 'visual' ? (
                            <div className="prose prose-invert max-w-none prose-sm md:prose-base" dangerouslySetInnerHTML={{ __html: compareHtml }} />
                        ) : (
                            <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap">{diffSource && diffSource.map((part, i) => !part.removed && <span key={i} style={part.added ? { backgroundColor: 'rgba(6,78,59,0.4)' } : {}}>{part.value}</span>)}</pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const InscriptApp = App;
export default InscriptApp;
