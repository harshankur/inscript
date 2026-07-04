import {
    useInscriptEditor, InscriptEditor,
    ImageSelectorModal, YoutubeEmbedModal,
} from 'inscript-editor';
import api from './lib/api';
import {
    Activity, Moon, Sun,
    AlertCircle,
    AlertTriangle,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Cpu,
    Database,
    Edit3,
    Eye,
    FileText,
    Filter,
    Folder,
    FolderOpen,
    GitCommit,
    Globe,
    Info,
    Layout,
    List,
    Monitor,
    PanelLeftClose,
    PanelLeftOpen,
    Pin,
    Plus,
    Save,
    Settings,
    Share2,
    SortAsc,
    SortDesc,
    Tag,
    Trash2,
    UploadCloud,
    LogOut,
    User,
    X,
    XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Login from './components/Login';

const MetadataModal = ({ isOpen, onClose, tags, categories, postTags, postCategories, onTagsChange, onCategoriesChange }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('tags'); // 'tags' | 'categories'
    const [search, setSearch] = useState('');

    if (!isOpen) return null;

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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredItems.length > 0) {
                // Select/toggle the first filtered item
                toggleItem(filteredItems[0]);
                setSearch('');
            } else if (search) {
                // No results, create new item
                handleCreate();
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t('metadata')}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 border-b border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={() => { setActiveTab('tags'); setSearch(''); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'tags' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        {t('tags')} ({postTags.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('categories'); setSearch(''); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'categories' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        {t('categories')} ({postCategories.length})
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('searchOrCreate', { item: activeTab })}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
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
                            {t('createItem', { item: search })}
                        </button>
                    )}

                    <div className="mb-2 text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                        {search ? t('matchingResults') : t('availableItems')}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {filteredItems.map(item => (
                            <button
                                key={item}
                                onClick={() => toggleItem(item)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${currentSelected.includes(item)
                                    ? 'bg-emerald-500 text-black border-emerald-500'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                            >
                                {item}
                            </button>
                        ))}
                        {filteredItems.length === 0 && !search && (
                            <span className="text-zinc-400 dark:text-zinc-500 text-sm italic">{t('noItemsFound')}</span>
                        )}
                    </div>
                </div>

                {/* Footer (Selected Summary) */}
                <div className="p-4 bg-white dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 dark:text-zinc-500">
                    {t('selected')}: {currentSelected.length > 0 ? currentSelected.join(', ') : t('none')}
                </div>
            </div>
        </div>
    );
};

const SortDropdown = ({ value, onChange, options }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative flex-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg py-1.5 px-3 text-xs text-left text-zinc-700 dark:text-zinc-300 hover:border-zinc-500 transition-colors flex justify-between items-center"
            >
                <span>{selectedOption ? selectedOption.label : 'Sort by...'}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[70]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl z-[80] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs transition-colors ${value === opt.value
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
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
    const { t } = useTranslation();
    return (
        <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 ml-1">{label}</label>
            <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-1 max-h-32 overflow-y-auto custom-scrollbar">
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
                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-700 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
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
    const { t, i18n } = useTranslation();
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
        if (viewMode === 'days') return viewDate.toLocaleString(i18n.language, { month: 'short', year: 'numeric' });
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
                                                ? 'bg-zinc-700 text-zinc-900 dark:text-white font-bold ring-1 ring-zinc-500'
                                                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-700'
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
                            className="p-2 text-[10px] rounded text-zinc-500 dark:text-zinc-400 hover:bg-zinc-700 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
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
                            className={`p-2 text-[10px] rounded hover:bg-zinc-700 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white ${y === new Date().getFullYear() ? 'text-emerald-500 font-bold' : 'text-zinc-500 dark:text-zinc-400'}`}
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
                            className="p-2 text-[10px] rounded text-zinc-500 dark:text-zinc-400 hover:bg-zinc-700 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
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
                <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">{label}</label>
                <button
                    onClick={handleTodayClick}
                    className="text-[9px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10"
                >
                    {t('today')}
                </button>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-3">
                <div className="flex justify-between items-center mb-3">
                    <button onClick={handlePrevClick} className="p-1 hover:bg-zinc-700 rounded text-zinc-500 dark:text-zinc-400"><ChevronLeft size={14} /></button>
                    <button onClick={handleHeaderClick} className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:underline transition-all">
                        {renderHeader()}
                    </button>
                    <button onClick={handleNextClick} className="p-1 hover:bg-zinc-700 rounded text-zinc-500 dark:text-zinc-400"><ChevronRight size={14} /></button>
                </div>
                {renderGrid()}
                {viewMode === 'days' && (range.start || range.end) && (
                    <div className="mt-3 flex items-center justify-between text-[9px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-300 dark:border-zinc-700 pt-2">
                        <span>{range.start ? new Date(range.start).toLocaleDateString(i18n.language) : '...'} - {range.end ? new Date(range.end).toLocaleDateString(i18n.language) : '...'}</span>
                        <button onClick={() => onChange({ start: null, end: null })} className="text-red-400 hover:underline">{t('resetFilters')}</button>
                    </div>
                )}
            </div>


        </div>
    );
};

const NewPostModal = ({ isOpen, onClose, onConfirm }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (name.trim()) {
            onConfirm(name.trim());
            setName('');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-zinc-900 dark:text-white">
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 opacity-100">
                <div className="p-6 text-zinc-900 dark:text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                            <Plus size={20} />
                        </div>
                        <h3 className="text-lg font-bold">{t('newPost')}</h3>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">{t('newPostDescription')}</p>
                    <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My New Post"
                        className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2.5 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit();
                            if (e.key === 'Escape') onClose();
                        }}
                    />
                </div>
                <div className="px-6 py-4 bg-white dark:bg-zinc-950/50 flex justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className="px-6 py-2 rounded-lg text-sm font-bold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20 transition-all"
                    >
                        {t('create')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SaveSplitButton = ({ onSave, onAction, isSaving, isDirty, deployStatus }) => {
    const { t } = useTranslation();
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
        if (deployStatus === 'publishing') return t('publishing');
        if (deployStatus === 'committing') return t('committing');
        if (deployStatus === 'pushing') return t('pushing');
        if (isSaving) return t('saving');
        return t('save');
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
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
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
                    if (!deployStatus && !isSaving && isDirty) setIsOpen(!isOpen);
                }}
                disabled={!!deployStatus || isSaving || !isDirty}
                className={`px-2 rounded-r-lg transition-all border-l border-white/10 ${isDirty
                    ? 'bg-yellow-400 text-zinc-950 hover:bg-yellow-300'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                    }`}
            >
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[200] overflow-hidden">
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
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors group"
                            >
                                <div className={`p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-700 ${opt.color}`}>
                                    <opt.icon size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{opt.label}</span>
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">Workflow</span>
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
    const { t } = useTranslation();
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
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Workflow Progress</h2>
                        <button onClick={onAbort} className="text-zinc-400 dark:text-zinc-500 hover:text-red-400 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Timeline */}
                    <div className="relative mb-12">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-100 dark:bg-zinc-800 -translate-y-1/2" />
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
                                            <div className={`absolute top-1/2 right-full w-full h-0.5 -translate-y-1/2 z-0 ${(isCompleted || isActive) && !isTargetedForCancel ? 'bg-emerald-500' : 'bg-zinc-100 dark:bg-zinc-800'}`} style={{ width: '100%' }} />
                                        )}

                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 relative ${isTargetedForCancel ? 'bg-red-500/20 text-red-500 ring-2 ring-red-500/30' :
                                            isCompleted ? 'bg-emerald-500 text-zinc-950' :
                                                isActive ? 'bg-emerald-500/20 text-emerald-500 ring-4 ring-emerald-500/10' :
                                                    isError ? 'bg-red-500/20 text-red-500' :
                                                        'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
                                            }`}>
                                            {isCompleted && !isTargetedForCancel ? <CheckCircle size={20} /> : <Info.icon size={20} className={isActive ? 'animate-pulse' : ''} />}

                                            {/* Cancel future step button */}
                                            {isFuture && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onCancelStep(idx); }}
                                                    onMouseEnter={() => setHoveredCancelIdx(idx)}
                                                    onMouseLeave={() => setHoveredCancelIdx(null)}
                                                    className="absolute -top-1 -right-1 bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-red-500 hover:text-zinc-900 dark:hover:text-white rounded-full p-0.5 opacity-40 hover:opacity-100 transition-opacity z-20"
                                                    title="Cancel this and following steps"
                                                >
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <span className={`absolute top-full mt-2 text-[10px] font-bold uppercase tracking-wider ${isTargetedForCancel ? 'text-red-500' : isActive ? 'text-emerald-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
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
                                    <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Commit Message</label>
                                    <textarea
                                        autoFocus
                                        value={commitMsg}
                                        onChange={(e) => setCommitMsg(e.target.value)}
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-zinc-900 dark:text-zinc-200 text-sm outline-none focus:border-emerald-500/50 transition-colors min-h-[80px] resize-none"
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
                                <div className="text-sm text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                                    {status === 'completed' ? 'Workflow Successful!' :
                                        currentStep === 'save' ? 'Saving post content...' :
                                            currentStep === 'publish' ? 'Generating static site...' :
                                                currentStep === 'commit' ? 'Recording changes to Git...' :
                                                    currentStep === 'push' ? 'Pushing to remote repository...' : 'Processing...'}
                                </div>
                                <div className="text-xs text-zinc-400 dark:text-zinc-500">
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
                                                className="w-3 h-3 rounded border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-emerald-500"
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
                                        <div className="text-[10px] text-blue-900/70 dark:text-blue-200/70 leading-relaxed mb-2">
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
                                                className="w-3 h-3 rounded border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-blue-500"
                                            />
                                            <span className="text-[9px] text-blue-900/40 dark:text-blue-200/40 group-hover:text-blue-900/60 dark:group-hover:text-blue-200/60 transition-colors">Don't show this tip again</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Global Footer Actions */}
                <div className="px-6 py-4 bg-white dark:bg-zinc-950/50 flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800">
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
                            className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-900 dark:text-white rounded text-xs font-bold transition-all"
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
    const { t } = useTranslation();
    if (!config) return null;
    const { title, message, type = 'warning', confirmText = t('confirm'), onConfirm } = config;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 opacity-100">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            {type === 'danger' ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{title}</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-white dark:bg-zinc-950/50 flex justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg text-sm font-bold text-zinc-900 dark:text-white shadow-lg transition-all ${type === 'danger'
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

const LanguageSelector = () => {
    const { i18n } = useTranslation();
    const languages = [
        { code: 'en', label: 'English' },
        { code: 'de', label: 'Deutsch' },
        { code: 'fr', label: 'Français' },
        { code: 'es', label: 'Español' },
        { code: 'pt', label: 'Português' },
        { code: 'it', label: 'Italiano' },
        { code: 'ja', label: '日本語' },
        { code: 'zh', label: '繁體中文' },
        { code: 'zh-CN', label: '简体中文' },
        { code: 'ko', label: '한국어' },
        { code: 'ru', label: 'Русский' },
        { code: 'af', label: 'Afrikaans' },
        { code: 'ne', label: 'नेपाली' },
        { code: 'hi', label: 'हिन्दी' },
        { code: 'bn', label: 'বাংলা' },
        { code: 'ta', label: 'தமிழ்' },
        { code: 'te', label: 'తెలుగు' },
        { code: 'ml', label: 'മലയാളം' },
        { code: 'kn', label: 'ಕನ್ನಡ' }
    ];

    return (
        <div className="relative group/lang">
            <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="h-9 px-3 pr-8 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[10px] font-bold rounded-lg border border-zinc-200 dark:border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all cursor-pointer appearance-none hover:bg-zinc-200 dark:hover:bg-zinc-700 min-w-[100px]"
            >
                {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.label}
                    </option>
                ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-zinc-500 group-hover/lang:text-zinc-900 dark:group-hover/lang:text-white transition-colors">
                <ChevronDown size={12} />
            </div>
        </div>
    );
};

const App = () => {
    const { t, i18n } = useTranslation();
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'dark';
        }
        return 'dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    const APP_TITLE = import.meta.env.MODE === 'demo' ? 'Inscript Demo' : import.meta.env.TITLE;
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
    const [showDiff, setShowDiff] = useState(false);

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

    // Authentication State
    const [user, setUser] = useState(null);
    const [authEnabled, setAuthEnabled] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    const isReadonlyEnv = import.meta.env.MODE === 'readonly';
    const [isReadonlyUser, setIsReadonlyUser] = useState(() => new URLSearchParams(window.location.search).get('readonly') === 'true');
    const isReadonly = isReadonlyEnv || isReadonlyUser;

    // Editor hook — manages useEditor, history stack, isDirty, and all associated refs
    const {
        editor,
        history, setHistory,
        historyIndex, setHistoryIndex,
        isDirty, setIsDirty,
        canUndo, canRedo,
        restoreVersion,
        markSaved,
        titleRef,
        historyRef,
        historyDebounceRef,
        isSyncingRef,
        isLoadingRef: isInitialLoadingRef,
    } = useInscriptEditor({
        contentKey: filename,
        title,
        tags: postTags,
        categories: postCategories,
        isReadonly,
    });

    // Imperative handle for the editor render component
    const editorRef = React.useRef(null);

    // Refs that stay in App (server sync + deployment locking)
    const originalContentRef = React.useRef({ title: '', html: '' });
    const saveDraftDebounceRef = React.useRef(null);
    const isWorkflowProcessingRef = React.useRef(false); // Locking mechanism for deployment
    // Capture initial URL params immediately to avoid useEffect race conditions clearing them
    const startupParamsRef = React.useRef(new URLSearchParams(window.location.search));
    // Holds a new post's initial history entry until useInscriptEditor's own
    // contentKey-change reset has run (see handleNewPostConfirm).
    const pendingNewPostHistoryRef = React.useRef(null);

    // Apply a new post's seed history entry once the hook's contentKey-driven
    // reset for this filename has already happened.
    useEffect(() => {
        const pending = pendingNewPostHistoryRef.current;
        if (pending && pending.filename === filename) {
            pendingNewPostHistoryRef.current = null;
            setHistory([pending.entry]);
            setHistoryIndex(0);
            setIsDirty(true);
        }
    }, [filename]);

    // Sidebar Resizing Logic
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem('inscript_sidebar_width');
        if (saved) return parseInt(saved, 10);
        return Math.min(Math.max(window.innerWidth * 0.25, 280), 450);
    });

    const [categorySidebarWidth, setCategorySidebarWidth] = useState(() => {
        const saved = localStorage.getItem('inscript_category_sidebar_width');
        return saved ? parseInt(saved, 10) : 64; // Default to 64px
    });

    const isResizingRef = React.useRef(false);
    const isResizingCategoryRef = React.useRef(false);

    const startResizing = React.useCallback(() => {
        isResizingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const startResizingCategory = React.useCallback(() => {
        isResizingCategoryRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const stopResizing = React.useCallback(() => {
        if (isResizingRef.current || isResizingCategoryRef.current) {
            if (isResizingRef.current) {
                localStorage.setItem('inscript_sidebar_width', sidebarWidth);
            }
            if (isResizingCategoryRef.current) {
                localStorage.setItem('inscript_category_sidebar_width', categorySidebarWidth);
            }
            isResizingRef.current = false;
            isResizingCategoryRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    }, [sidebarWidth, categorySidebarWidth]);

    const resize = React.useCallback((e) => {
        if (isResizingRef.current) {
            // Clamp width to viewport width - 50px (keep handle visible) or 80% width
            const maxWidth = Math.min(600, window.innerWidth - 50);
            const newWidth = Math.max(240, Math.min(maxWidth, e.clientX));
            setSidebarWidth(newWidth);
        } else if (isResizingCategoryRef.current) {
            // Categories sidebar - clamp between 50px and 200px
            const newWidth = Math.max(50, Math.min(200, e.clientX));
            setCategorySidebarWidth(newWidth);
        }
    }, [sidebarWidth]); // Added sidebarWidth to deps for consistency though not strictly needed for the logic itself

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
    useEffect(() => {
        // Prevent saving if: no filename, syncing locked, or history is just the original (single item)
        // This ensures we don't create draft files for unedited posts.
        if (!filename || isSyncingRef.current || history.length <= 1) return;

        const timeout = setTimeout(async () => {
            try {
                // Ensure we are saving the CURRENT state of history
                await api.post(`/api/drafts/${filename}`, {
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
        const appTitle = APP_TITLE;
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
        checkAuth();
        fetchPosts();
    }, []);

    const checkAuth = async () => {
        if (isReadonlyEnv) {
            setAuthLoading(false);
            return;
        }
        try {
            const res = await api.get('/api/me');
            setUser(res.data.user);
            setAuthEnabled(res.data.authEnabled);
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setAuthLoading(false);
        }
    };

    const fetchPosts = async () => {
        try {
            let loadedPosts = (await api.get(isReadonlyEnv ? '/data.json' : '/api/posts')).data;
            loadedPosts = loadedPosts.map(p => ({
                ...p,
                tags: (p.tags || []).map(t => typeof t === 'string' ? t.trim().toLowerCase() : t).filter(Boolean),
                categories: (Array.isArray(p.categories) ? p.categories : (p.categories ? [p.categories] : []))
                    .map(c => {
                        if (typeof c !== 'string') return c;
                        const trimmed = c.trim();
                        return trimmed ? (trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()) : '';
                    })
                    .filter(Boolean)
            }));
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
            const res = await api.get('/api/images');
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
                res = await api.get(`/api/posts/${file}?t=${Date.now()}`); // Cache bust
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
            const normalizeTags = (ts) => (ts || []).map(t => typeof t === 'string' ? t.trim().toLowerCase() : t).filter(Boolean);
            const normalizeCats = (cs) => (cs || []).map(c => typeof c === 'string' ? c.trim().charAt(0).toUpperCase() + c.trim().slice(1).toLowerCase() : c).filter(Boolean);

            setPostTags(normalizeTags(currentState.tags || originalState.tags));
            setPostCategories(normalizeCats(currentState.categories || originalState.categories));

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
            restoreVersion(newIndex); // sets content without emitting onUpdate
            const safeTitle = targetState?.title || title || 'Untitled';
            setTitle(safeTitle);
            setPostTags(targetState.tags || []);
            setPostCategories(targetState.categories || []);
        }

        // 3. Debounced Server Sync
        if (saveDraftDebounceRef.current) clearTimeout(saveDraftDebounceRef.current);

        saveDraftDebounceRef.current = setTimeout(async () => {
            try {
                console.log(`[HistorySync] Syncing pointer to ${newIndex}`);
                setSaveStatus('saving');
                // Use Refs to ensure we send the latest history array if it changed recently
                await api.post(`/api/drafts/${filename}`, {
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


    const handleLogout = () => {
        setModalConfig({
            title: 'Confirm Logout',
            message: 'Are you sure you want to log out of Inscript?',
            type: 'warning',
            confirmText: 'Logout',
            onConfirm: async () => {
                try {
                    await api.get('/auth/logout');
                    setUser(null);
                    setModalConfig(null);
                } catch (error) {
                    console.error('Logout failed:', error);
                }
            }
        });
    };

    const handleDelete = async () => {
        if (!filename) return;

        setModalConfig({
            title: 'Delete Post',
            message: `Are you sure you want to delete "${filename}"? This cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await api.delete(`/api/posts/${filename}`);
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
                    await api.delete(`/api/drafts/${filename}`);
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

            const res = await api.post('/api/posts', {
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
                    await api.post('/api/posts', {
                        filename,
                        frontmatter: { ...currentPost?.frontmatter, title, tags: postTags, categories: postCategories },
                        html
                    });
                    setSaveStatus('success');
                    setIsDirty(false);
                    setTimeout(() => setSaveStatus('saved'), 2000);
                } else if (currentStep === 'publish') {
                    setDeployStatus('publishing');
                    await api.post('/api/publish');
                } else if (currentStep === 'commit') {
                    if (!workflow.commitMessage) {
                        setWorkflow(prev => ({ ...prev, status: 'paused' }));
                        isWorkflowProcessingRef.current = false;
                        return;
                    }
                    setDeployStatus('committing');
                    await api.post('/api/git/commit', {
                        message: workflow.commitMessage,
                        filename
                    });
                } else if (currentStep === 'push') {
                    setDeployStatus('pushing');
                    await api.post('/api/git/push');
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
        // useInscriptEditor resets history to [] whenever contentKey (filename) changes,
        // in an effect that runs after this render commits. Seeding history synchronously
        // here would get wiped by that reset, so stash it and apply once filename catches up.
        pendingNewPostHistoryRef.current = {
            filename: finalName,
            entry: { title: name, html: '', tags: [], categories: [], ...metadata, timestamp: new Date().toISOString(), isOriginal: true },
        };
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
        setShowNewPostModal(false);
    };

    const handleImageUpload = async (file) => {
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        await api.post('/api/upload', formData);
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
        posts.forEach(p => (p.tags || []).forEach(t => {
            if (typeof t === 'string') tags.add(t.trim().toLowerCase());
        }));
        // Also include current post's tags (even if not saved yet)
        (postTags || []).forEach(t => {
            if (typeof t === 'string') tags.add(t.trim().toLowerCase());
        });
        return Array.from(tags).filter(Boolean).sort();
    }, [posts, postTags]);

    // --- Dynamic Sidebar Tag Fitting ---
    const getVisibleTags = (tags, width) => {
        if (!tags || tags.length === 0) return { visible: [], overflow: 0 };

        // Available width for tags: SidebarWidth - padding/icon/gap overhead
        // Very conservative offset (100px) to prevent padding overlap and edge clipping
        const availableWidth = width - 100;
        let currentWidth = 0;
        const visible = [];
        const charWidth = 7; // text-[9px] very conservative avg char width
        const chipOverhead = 20; // padding + border + safety margin
        const gap = 4;
        const overflowChipWidth = 36; // "+X" chip with generous safety

        for (let i = 0; i < tags.length; i++) {
            const tag = tags[i];
            const estimatedWidth = (tag.length * charWidth) + chipOverhead;

            // Required width if we add this tag
            const isLast = i === tags.length - 1;
            const requiredWidthWithOverflow = currentWidth + estimatedWidth + (isLast ? 0 : gap + overflowChipWidth);

            if (i > 0 && requiredWidthWithOverflow > availableWidth) {
                // Doesn't fit with overflow chip
                break;
            }

            if (i === 0 && (currentWidth + estimatedWidth) > availableWidth) {
                // Even first tag doesn't fit
                break;
            }

            visible.push(tag);
            currentWidth += estimatedWidth + gap;
        }

        return { visible, overflow: tags.length - visible.length };
    };

    const allCategories = useMemo(() => {
        const cats = new Set();
        posts.forEach(p => {
            const pcats = Array.isArray(p.categories) ? p.categories : (p.categories ? [p.categories] : []);
            pcats.forEach(c => {
                if (typeof c === 'string') {
                    const normalized = c.trim();
                    if (normalized) {
                        cats.add(normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase());
                    }
                }
            });
        });
        (postCategories || []).forEach(c => {
            if (typeof c === 'string') {
                const normalized = c.trim();
                if (normalized) {
                    cats.add(normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase());
                }
            }
        });
        return Array.from(cats).sort();
    }, [posts, postCategories]);

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
            // Category filtering - checking if post belongs to the selected category (if any)
            if (selectedCategories.length > 0) {
                const postCats = post.categories || [];
                const hasMatch = selectedCategories.some(c => postCats.includes(c));
                if (!hasMatch) return false;
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
    if (authLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="animate-spin text-emerald-500 w-8 h-8" />
                    <span className="text-zinc-500 text-sm font-medium animate-pulse">Initializing Inscript...</span>
                </div>
            </div>
        );
    }

    if (authEnabled && !user) {
        return <Login />;
    }

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
                    t={t}
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
                    onSearch={async (q) => {
                        const res = await api.get(`/api/youtube/search?q=${encodeURIComponent(q)}`);
                        return res.data.items;
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
                    className="fixed inset-y-0 left-0 z-50 md:sticky md:top-0 md:h-screen md:relative md:z-30 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col flex-shrink-0 group/sidebar shadow-2xl md:shadow-none"
                    style={{ width: Math.min(sidebarWidth, typeof window !== 'undefined' ? window.innerWidth - 60 : 300) }}
                >
                    <div className="border-b border-zinc-200 dark:border-zinc-800">
                        {/* Row 1: Blog Title (h-16 to match editor) */}
                        <div className="h-16 px-6 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                            <button onClick={() => {
                                setFilename(null);
                                setCurrentPost(null);
                                setHistory([]);
                                setHistoryIndex(-1);
                                setIsDirty(false);
                                setSaveStatus(null);
                                setOriginalContent({ title: '', html: '', tags: [], categories: [] });
                            }} className="hover:opacity-80 transition-opacity text-left truncate flex-1 mr-2">
                                <h1 className="text-lg md:text-xl font-bold tracking-tight text-zinc-900 dark:text-white truncate">{APP_TITLE}</h1>
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleTheme}
                                    className="w-10 h-10 flex items-center justify-center p-0 rounded-lg transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 flex-shrink-0"
                                    title={'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode'}
                                >
                                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                                </button>
                                {/* Mobile Close Button */}
                                <button
                                    onClick={() => setShowSidebar(false)}
                                    className="w-10 h-10 flex items-center justify-center p-0 md:hidden text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                                >
                                    <PanelLeftClose size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Row 2: Utilities & Actions */}
                        <div className="px-6 py-4 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                            <div className="flex items-center gap-2">
                                <LanguageSelector />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-9 px-3 flex items-center bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-[10px] rounded-lg font-bold tracking-wider uppercase border border-zinc-200 dark:border-zinc-700/30 whitespace-nowrap">
                                    {posts.length} {t('posts')}
                                </span>
                                {!isReadonly && (
                                    <button
                                        onClick={createNewPost}
                                        className="w-9 h-9 flex items-center justify-center p-0 bg-emerald-500 text-white rounded-lg transition-all hover:bg-emerald-400 shadow-md shadow-emerald-500/10 active:scale-95 flex-shrink-0"
                                        title={t('newPost')}
                                    >
                                        <Plus size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-4 border-b border-zinc-200 dark:border-zinc-800/50">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder={t('searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:border-white transition-colors"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`w-10 h-10 flex items-center justify-center p-0 rounded-lg border transition-all ${showFilters || selectedTags.length > 0 || selectedCategories.length > 0 || createdRange.start || modifiedRange.start
                                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-white'
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
                            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl p-4 space-y-4 shadow-xl max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
                                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{t('advancedFilters')}</span>
                                    <button
                                        onClick={clearAllFilters}
                                        className="text-[10px] text-zinc-400 dark:text-zinc-500 hover:text-red-400 transition-colors uppercase font-bold tracking-wide flex items-center gap-1"
                                    >
                                        <XCircle size={10} />
                                        {t('clearAll')}
                                    </button>
                                </div>

                                {!isReadonly && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 ml-1">Status</label>
                                        <div className="flex p-1 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-300 dark:border-zinc-700">
                                            {['all', 'drafts', 'unpublished'].map(tab => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setActiveTab(tab)}
                                                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all ${activeTab === tab
                                                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                                                        : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                                        }`}
                                                >
                                                    {t(tab)}
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

                                {(selectedTags.length > 0 || createdRange.start || modifiedRange.start || (activeTab !== 'all' && !isReadonly)) && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="w-full py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
                                    >
                                        Reset Filters
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800/50">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Sort by</label>
                                <span className="text-[10px] text-zinc-600 font-mono">{sortOrder.toUpperCase()}</span>
                            </div>
                            <div className="flex gap-2">
                                <SortDropdown
                                    value={sortBy}
                                    onChange={setSortBy}
                                    options={[
                                        { value: 'created', label: t('dateCreated') },
                                        { value: 'modified', label: t('dateModified') },
                                        { value: 'title', label: t('postTitle') },
                                        { value: 'filename', label: t('filename') },
                                        !isReadonly && { value: 'status', label: t('draftStatus') },
                                    ].filter(Boolean)}
                                />
                                <button
                                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className={`w-10 flex items-center justify-center p-0 rounded-lg border transition-all ${sortOrder === 'asc' ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                                        } hover:border-white`}
                                    title={`Switch to ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                                >
                                    {sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Sidebar Content Area: Folders + Post List */}
                    <div className="flex-1 flex overflow-hidden relative">
                        {/* Vertical Category Folders */}
                        <div
                            style={{ width: `${categorySidebarWidth}px` }}
                            className="bg-zinc-100/50 dark:bg-zinc-800/20 border-r border-zinc-200 dark:border-zinc-800/50 flex flex-col items-center py-4 gap-4 overflow-y-auto no-scrollbar relative group/sidebar"
                        >
                            <button
                                onClick={() => setSelectedCategories([])}
                                className={`group flex flex-col items-center justify-center gap-1.5 transition-all h-16 min-h-16 relative w-full ${selectedCategories.length === 0 ? 'text-emerald-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                                title="All Posts"
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${selectedCategories.length === 0 ? 'bg-emerald-500/10 shadow-sm border border-emerald-500/20' : 'bg-transparent border border-transparent group-hover:bg-zinc-200/50 dark:group-hover:bg-zinc-700/50'}`}>
                                    <FolderOpen size={18} weight={selectedCategories.length === 0 ? "fill" : "regular"} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider truncate w-full px-1 text-center">All</span>
                                {selectedCategories.length === 0 && <div className="absolute right-0 top-1 bottom-1 w-1 bg-emerald-500 rounded-l-full" />}
                            </button>

                            {allCategories.map(cat => {
                                const isActive = selectedCategories.includes(cat);
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategories([cat])}
                                        className={`group flex flex-col items-center justify-center gap-1.5 transition-all h-16 min-h-16 relative w-full ${isActive ? 'text-emerald-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                                        title={cat}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-emerald-500/10 shadow-sm border border-emerald-500/20' : 'bg-transparent border border-transparent group-hover:bg-zinc-200/50 dark:group-hover:bg-zinc-700/50'}`}>
                                            <Folder size={18} weight={isActive ? "fill" : "regular"} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate w-full px-1 text-center">{cat}</span>
                                        {isActive && <div className="absolute right-0 top-1 bottom-1 w-1 bg-emerald-500 rounded-l-full" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Category Sidebar Drag Handle */}
                        <div
                            onMouseDown={startResizingCategory}
                            className="absolute left-[var(--cat-width)] z-50 w-1 hover:w-1.5 h-full cursor-col-resize hover:bg-emerald-500/50 transition-all"
                            style={{ left: `${categorySidebarWidth - 2}px` }}
                        />

                        {/* Posts List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {filteredAndSortedPosts.length > 0 ? (
                                filteredAndSortedPosts.map(post => (
                                    <button
                                        key={post.filename}
                                        onClick={() => loadPost(post.filename)}
                                        className={`w-full text-left p-3 rounded-lg transition-all flex items-start gap-3 relative group ${filename === post.filename ? 'bg-zinc-100 dark:bg-zinc-800 shadow-lg border border-zinc-300 dark:border-zinc-700' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50 border border-transparent'
                                            }`}
                                        title={post.title}
                                    >
                                        <FileText size={18} className="text-zinc-400 dark:text-zinc-500 mt-1 flex-shrink-0" />
                                        {/* Show yellow dot if unsaved changes in editor OR if there's a saved draft on disk */}
                                        {!isReadonly && ((isDirty && filename === post.filename) || post.hasDraft) && (
                                            <div className={`absolute top-3 right-3 w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${post.isUnpublished ? 'bg-purple-400 text-purple-400' : 'bg-yellow-400 text-yellow-400'}`} title={post.isUnpublished ? "Unpublished Draft" : "Unsaved changes (Draft)"} />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium truncate">{post.title}</div>
                                            <div className="flex items-center gap-3 mt-1.5 opacity-60">
                                                <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono" title={`Created: ${new Date(post.created).toLocaleString(i18n.language)}`}>
                                                    <Calendar size={10} />
                                                    <span>{new Date(post.created).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono" title={`Modified: ${new Date(post.modified).toLocaleString(i18n.language)}`}>
                                                    <Edit3 size={10} />
                                                    <span>{new Date(post.modified).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            </div>
                                            {/* Tag Chips Row */}
                                            {post.tags && post.tags.length > 0 && (() => {
                                                const { visible, overflow } = getVisibleTags(post.tags, sidebarWidth);
                                                return (
                                                    <div className="flex flex-nowrap gap-1 mt-2 items-center overflow-hidden">
                                                        {visible.map(tag => (
                                                            <span key={tag} className="px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[9px] font-medium border border-zinc-200 dark:border-zinc-700 whitespace-nowrap">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {overflow > 0 && (
                                                            <div className="relative group/tagtooltip inline-flex items-center">
                                                                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-medium border border-emerald-500/20 cursor-help whitespace-nowrap">
                                                                    +{overflow}
                                                                </span>
                                                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tagtooltip:block z-[60] bg-zinc-900 text-white text-[10px] p-2 rounded shadow-xl whitespace-nowrap border border-zinc-700 pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-75 blur-none">
                                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                                        {post.tags.slice(visible.length).map(t => (
                                                                            <span key={t} className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-600">
                                                                                {t}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-zinc-400 dark:text-zinc-500">
                                    <FolderOpen size={32} className="opacity-20 mb-2" />
                                    <p className="text-xs font-medium italic">No posts in this category</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pinned Introduction Post */}
                    {(introductionPost || !isReadonly) && (
                        <>
                            <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
                                {introductionPost ? (
                                    <button
                                        onClick={() => loadPost(introductionPost.filename)}
                                        className={`w-full text-left p-3 rounded-lg transition-all flex items-start gap-3 relative group border-2 h-[74px] ${filename === introductionPost.filename
                                            ? 'bg-zinc-100 dark:bg-zinc-800 shadow-md border-emerald-500/50' // Highlight active pinned post
                                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50 border-emerald-500/20 hover:border-emerald-500/40' // Distinct border for pinned
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
                                            <div className="text-sm font-bold truncate text-emerald-900 dark:text-emerald-100">{introductionPost.title}</div>
                                            <div className="flex items-center gap-2 mt-1.5 opacity-60">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">{t('introduction')}</span>
                                            </div>
                                        </div>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleNewPostConfirm('Introduction', { type: 'introduction' })}
                                        className="w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 group text-zinc-400 dark:text-zinc-500 hover:text-emerald-500 h-[74px]"
                                        title={t('createIntroduction')}
                                    >
                                        <div className="mt-0.5 flex-shrink-0">
                                            <Pin size={18} className="opacity-50 group-hover:opacity-100" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium">{t('createIntroduction')}</div>
                                        </div>
                                        <Plus size={16} className="opacity-50 group-hover:opacity-100" />
                                    </button>
                                )}
                            </div>
                            {/* User Profile & Logout */}
                        </>
                    )}

                    {/* Drag Handle - made larger and centered on border for better usability */}
                    <div
                        onMouseDown={startResizing}
                        className="absolute right-0 translate-x-1/2 top-0 bottom-0 w-4 bg-transparent hover:bg-emerald-500/50 cursor-col-resize z-50 transition-colors"
                    />
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden relative">
                {filename ? (
                    <>
                        <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-8 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-20">
                            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0 mr-2 md:mr-4">
                                <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                                    <button
                                        onClick={() => setShowSidebar(!showSidebar)}
                                        className={`w-10 h-10 flex items-center justify-center p-0 rounded-lg transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50`}
                                        title={showSidebar ? "Collapse Sidebar" : "Expand Sidebar"}
                                    >
                                        {showSidebar ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                                    </button>
                                    <div className={`h-6 w-px bg-zinc-100 dark:bg-zinc-800 ${!showSidebar && 'hidden'}`} />
                                    {isReadonly ? (
                                        <h1 className="text-lg md:text-xl font-bold w-full truncate mb-0 flex justify-between items-center">{title}</h1>
                                    ) : (
                                        <input
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
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
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
                                                    title: `${title} | ${APP_TITLE}`,
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
                                    className={`w-10 h-10 flex items-center justify-center p-0 rounded-lg transition-colors mr-2 ${isCopied ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
                                    title={isCopied ? "Link Copied!" : "Share Link"}
                                >
                                    {isCopied ? <CheckCircle size={20} /> : <Share2 size={20} />}
                                </button>

                            </div>

                            {!isReadonly && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 md:mr-4 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                        <button
                                            onClick={() => setShowDiff(false)}
                                            className={`p-2 md:px-3 md:py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${!showDiff ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                                            title="Editor View"
                                        >
                                            <Edit3 size={16} className="md:hidden" />
                                            <span className="hidden md:inline">{t('editor')}</span>
                                        </button>
                                        <button
                                            onClick={() => setShowDiff(true)}
                                            className={`p-2 md:px-3 md:py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${showDiff ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-sm' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                                            title={t('history')}
                                        >
                                            <Clock size={16} className="md:hidden" />
                                            <span className="hidden md:inline">{t('history')}</span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleDiscard}
                                        disabled={!currentPost?.hasDraft}
                                        className={`w-10 h-10 flex items-center justify-center p-0 transition-colors rounded-lg ${!currentPost?.hasDraft
                                            ? 'text-zinc-700 cursor-not-allowed'
                                            : 'text-zinc-400 dark:text-zinc-500 hover:text-red-400 hover:bg-red-400/10'
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

                        <InscriptEditor
                            ref={editorRef}
                            editor={editor}
                            isReadonly={isReadonly}
                            showDiff={showDiff}
                            history={history}
                            historyIndex={historyIndex}
                            originalContent={originalContent}
                            canUndo={canUndo}
                            canRedo={canRedo}
                            onHistoryUndo={() => {
                                if (historyIndex > 0) {
                                    if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
                                    syncHistoryWithServer(historyIndex - 1);
                                }
                            }}
                            onHistoryRedo={() => {
                                if (historyIndex < history.length - 1) {
                                    if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
                                    syncHistoryWithServer(historyIndex + 1);
                                }
                            }}
                            onShowMetadataModal={() => setShowMetadataModal(true)}
                            hasMetadata={postTags.length > 0 || postCategories.length > 0}
                            showMetadataActive={showMetadataModal}
                            onShowMediaLibrary={() => { setShowMediaLibrary(true); fetchLibraryImages(); }}
                            onAddYoutube={() => setShowYoutubeModal(true)}
                            onHistorySelect={(idx) => { syncHistoryWithServer(idx); setShowDiff(false); }}
                            restoreVersion={restoreVersion}
                            markSaved={markSaved}
                        />
                        {!showDiff && (
                            <footer className="shrink-0 px-4 py-3 md:px-8 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                                    <span>
                                        &copy; {new Date().getFullYear()}{' '}
                                        <a href="https://github.com/harshankur" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                                            Harsh Ankur
                                        </a>
                                    </span>
                                    <span>
                                        Powered by{' '}
                                        <a href="https://inscript.harshankur.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                                            Inscript
                                        </a>
                                    </span>
                                </div>
                            </footer>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col h-full">
                        {/* Empty State Header for Mobile Navigation */}
                        <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 px-8 flex items-center bg-zinc-50 dark:bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-20">
                            <button
                                onClick={() => setShowSidebar(!showSidebar)}
                                className={`p-2 rounded-lg transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 mr-4`}
                                title={showSidebar ? "Collapse Sidebar" : "Expand Sidebar"}
                            >
                                {showSidebar ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                            </button>
                            <h1 className="text-xl font-bold text-zinc-400 dark:text-zinc-500"></h1>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 gap-4 p-4 text-center">
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
                            : 'bg-zinc-50 dark:bg-zinc-900/80 backdrop-blur-md border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                        title="Dashboard"
                    >
                        {showDebug ? <X size={18} /> : <Settings size={18} />}
                    </button>
                )
            }

            {
                showDebug && !isReadonlyEnv && (
                    <div className="fixed bottom-16 right-4 z-[100] bg-white dark:bg-zinc-950/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl w-80 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[80vh]">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity size={16} className="text-emerald-500" />
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">Dashboard</h3>
                            </div>
                            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 px-2 py-0.5 rounded font-mono">v2.4.0</span>
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
                                        <p className="text-xs font-bold text-blue-900 dark:text-blue-200 mb-1">Visualization Tip</p>
                                        <p className="text-[10px] text-blue-900/70 dark:text-blue-200/70 leading-relaxed">
                                            The <code className="bg-blue-500/20 px-1 rounded text-blue-300">readonly=true</code> parameter helps you see exactly how the app looks when published.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Layout size={12} /> Interactive Controls
                                </h4>
                                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg transition-colors ${isReadonlyUser ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'}`}>
                                            {isReadonlyUser ? <Eye size={16} /> : <Edit3 size={16} />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-200">Readonly Mode</p>
                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Hide editing tools</p>
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
                                <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Cpu size={12} /> Live Engine State
                                </h4>
                                <div className="space-y-2 font-mono text-[11px]">
                                    <div className="flex justify-between py-1.5 px-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg">
                                        <span className="text-zinc-400 dark:text-zinc-500">isDirty</span>
                                        <span className={isDirty ? "text-yellow-400 font-bold" : "text-emerald-400"}>{isDirty ? "YES" : "NO"}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 px-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg">
                                        <span className="text-zinc-400 dark:text-zinc-500">title</span>
                                        <span className="text-zinc-700 dark:text-zinc-300 truncate ml-4" title={title}>{title || "EMPTY"}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 px-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg">
                                        <span className="text-zinc-400 dark:text-zinc-500">filename</span>
                                        <span className="text-zinc-700 dark:text-zinc-300 truncate ml-4" title={filename}>{filename || "none"}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 px-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg">
                                        <span className="text-zinc-400 dark:text-zinc-500">saveStatus</span>
                                        <span className="text-blue-400">{saveStatus || "idle"}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 px-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg">
                                        <span className="text-zinc-400 dark:text-zinc-500">historyPtr</span>
                                        <span className="text-zinc-700 dark:text-zinc-300">{historyIndex} / {history.length}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 px-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg">
                                        <span className="text-zinc-400 dark:text-zinc-500">tokens</span>
                                        <span className="text-zinc-700 dark:text-zinc-300">{editor ? editor.getText().length : 0} chars</span>
                                    </div>
                                </div>
                            </div>

                            {/* Account Section */}
                            {authEnabled && user && (
                                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                            <User size={12} /> Account
                                        </h4>
                                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">{user.displayName}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all font-bold text-sm group"
                                    >
                                        <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                                        <span>{t('logout')}</span>
                                    </button>
                                </div>
                            )}

                            {/* Environment */}
                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Database size={12} /> Configuration
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-1">Site Configuration</p>
                                        <div className="space-y-1">
                                            <div className="p-2 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-lg flex flex-col gap-1">
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-zinc-400 dark:text-zinc-500">Title</span>
                                                    <span className="text-zinc-700 dark:text-zinc-300 truncate ml-2">{APP_TITLE}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-zinc-400 dark:text-zinc-500">URL</span>
                                                    <span className="text-zinc-700 dark:text-zinc-300 truncate ml-2">{import.meta.env.SITE_URL}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-zinc-400 dark:text-zinc-500">Port</span>
                                                    <span className="text-zinc-700 dark:text-zinc-300 font-mono">{import.meta.env.SERVER_PORT}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-zinc-400 dark:text-zinc-500">Favicon</span>
                                                    <span className="text-zinc-700 dark:text-zinc-300 truncate ml-2">{import.meta.env.FAVICON}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-1">Filesystem Paths</p>
                                        <div className="space-y-1.5 font-mono text-[9px]">
                                            <div className="p-2 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-lg space-y-2">
                                                <div>
                                                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5">Content</span>
                                                    <span className="text-zinc-500 dark:text-zinc-400 break-all leading-tight">{import.meta.env.CONTENT_DIR}</span>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5">Static</span>
                                                    <span className="text-zinc-500 dark:text-zinc-400 break-all leading-tight">{import.meta.env.STATIC_DIR}</span>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5">Drafts</span>
                                                    <span className="text-zinc-500 dark:text-zinc-400 break-all leading-tight">{import.meta.env.DRAFTS_DIR}</span>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5">Dist</span>
                                                    <span className="text-zinc-500 dark:text-zinc-400 break-all leading-tight">{import.meta.env.DIST_DIR}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-1">Git Permissions</p>
                                        <div className={`p-2 rounded-lg text-[10px] font-bold flex items-center gap-2 ${import.meta.env.ALLOW_PUSH === 'true' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'}`}>
                                            {import.meta.env.ALLOW_PUSH === 'true' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            {import.meta.env.ALLOW_PUSH === 'true' ? 'ALLOW_PUSH: ENABLED' : 'ALLOW_PUSH: DISABLED'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 text-center">
                            <p className="text-[9px] text-zinc-600 uppercase tracking-tighter">Mission Control Dashboard &copy; 2026</p>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

const InscriptApp = App;
export default InscriptApp;
