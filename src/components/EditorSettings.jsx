import React, { useEffect, useId, useRef, useState } from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    FOCUS_LINE_WIDTH_MAX,
    FOCUS_LINE_WIDTH_MIN,
    FOCUS_LINE_WIDTH_STEP,
    FOCUS_WIDTH_CUSTOM,
    FOCUS_WIDTH_SAME,
    LINE_WIDTH_MAX,
    LINE_WIDTH_MIN,
    LINE_WIDTH_PRESETS,
    LINE_WIDTH_STEP,
    PERCENT_FACTOR,
    TEXT_SIZE_MAX,
    TEXT_SIZE_MIN,
    TEXT_SIZE_STEP,
    textSizePercent,
} from '../lib/editorSettings';

// The translation key of each preset width.
const PRESET_LABEL_KEYS = {
    narrow: 'lineWidthNarrow',
    comfortable: 'lineWidthComfortable',
    wide: 'lineWidthWide',
    full: 'lineWidthFull',
};

const SECTION_HEADING_CLASS = 'text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400';

// A row of choices of which exactly one is on (a radio group): arrow keys move between them and
// choose, as a radio group does. `value` may match none of them, then the first can be tabbed to.
const ChoiceGroup = ({ label, options, value, onChange, columns = options.length }) => {
    const refs = useRef([]);
    const selected = options.findIndex(option => option.value === value);
    const tabStop = selected === -1 ? 0 : selected;

    const handleKeyDown = (event, index) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        const next = (index + step + options.length) % options.length;
        onChange(options[next].value);
        refs.current[next]?.focus();
    };

    return (
        <div role="radiogroup" aria-label={label} className="grid gap-1 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {options.map((option, index) => {
                const isOn = index === selected;
                return (
                    <button
                        key={option.value}
                        ref={element => { refs.current[index] = element; }}
                        type="button"
                        role="radio"
                        aria-checked={isOn}
                        tabIndex={index === tabStop ? 0 : -1}
                        onClick={() => onChange(option.value)}
                        onKeyDown={event => handleKeyDown(event, index)}
                        className={`min-w-0 px-2 py-1.5 text-xs font-bold rounded-md truncate transition-colors border ${isOn
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-sm'
                            : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-white'}`}
                        title={option.label}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};

// How far along its range a slider's value is, as a percentage.
const rangeProgress = ({ min, max, value }) => ((value - min) / (max - min)) * PERCENT_FACTOR;

// A labelled slider with its value beside it. The value has a fixed width so it never moves the slider.
const SliderRow = ({ label, valueText, disabled = false, ...range }) => {
    const id = useId();
    return (
        <div className={`space-y-1.5 ${disabled ? 'opacity-50' : ''}`}>
            <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={id} className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{label}</label>
                <span className="w-20 shrink-0 text-right text-xs tabular-nums text-zinc-500 dark:text-zinc-400">{valueText}</span>
            </div>
            <input id={id} type="range" disabled={disabled} className="inscript-range w-full" style={{ '--range-progress': `${rangeProgress(range)}%` }} {...range} />
        </div>
    );
};

// The editor settings: how the writing column looks. A view preference, so it sits with the other
// view controls and not with the buttons that change the post; the choices apply as they are made.
const EditorSettings = ({ settings, onChange, onReset, isDefault }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    const panelId = useId();
    const focusDimId = useId();

    useEffect(() => {
        if (!isOpen) return undefined;
        const handleMouseDown = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) setIsOpen(false);
        };
        const handleKeyDown = (event) => {
            if (event.key !== 'Escape') return;
            setIsOpen(false);
            triggerRef.current?.focus();
        };
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const presetOptions = LINE_WIDTH_PRESETS.map(preset => ({ value: preset.value, label: t(PRESET_LABEL_KEYS[preset.id]) }));
    const focusWidthOptions = [
        { value: FOCUS_WIDTH_SAME, label: t('focusWidthSame') },
        { value: FOCUS_WIDTH_CUSTOM, label: t('focusWidthCustom') },
    ];
    const focusWidthIsCustom = settings.focusWidthMode === FOCUS_WIDTH_CUSTOM;

    return (
        // Not on a phone: the header there has no room for another button, and a phone's column is
        // as wide as the screen whatever the setting says.
        <div className="relative hidden md:block" ref={rootRef}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen(open => !open)}
                className={`w-10 h-10 flex items-center justify-center p-0 rounded-lg transition-colors ${isOpen ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
                title={t('editorSettings')}
                aria-label={t('editorSettings')}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-controls={isOpen ? panelId : undefined}
            >
                <SlidersHorizontal size={20} />
            </button>

            {isOpen && (
                <div
                    id={panelId}
                    role="dialog"
                    aria-label={t('editorSettings')}
                    className="[color-scheme:light] dark:[color-scheme:dark] absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] p-4 space-y-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[200]"
                >
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-sm font-bold text-zinc-900 dark:text-white truncate">{t('editorSettings')}</h2>
                        <button
                            type="button"
                            onClick={onReset}
                            disabled={isDefault}
                            className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                        >
                            <RotateCcw size={12} />
                            <span>{t('resetToDefaults')}</span>
                        </button>
                    </div>

                    <section className="space-y-2.5">
                        <h3 className={SECTION_HEADING_CLASS}>{t('lineWidth')}</h3>
                        <ChoiceGroup label={t('lineWidth')} columns={2} options={presetOptions} value={settings.lineWidth} onChange={value => onChange({ lineWidth: value })} />
                        <SliderRow
                            label={t('lineWidth')}
                            valueText={t('unitRem', { value: settings.lineWidth })}
                            min={LINE_WIDTH_MIN}
                            max={LINE_WIDTH_MAX}
                            step={LINE_WIDTH_STEP}
                            value={settings.lineWidth}
                            onChange={event => onChange({ lineWidth: Number(event.target.value) })}
                        />
                    </section>

                    <section className="space-y-2.5">
                        <h3 className={SECTION_HEADING_CLASS}>{t('textSize')}</h3>
                        <SliderRow
                            label={t('textSize')}
                            valueText={t('unitPercent', { value: textSizePercent(settings.textSize) })}
                            min={TEXT_SIZE_MIN}
                            max={TEXT_SIZE_MAX}
                            step={TEXT_SIZE_STEP}
                            value={settings.textSize}
                            onChange={event => onChange({ textSize: Number(event.target.value) })}
                        />
                    </section>

                    <section className="space-y-2.5">
                        <h3 className={SECTION_HEADING_CLASS}>{t('focusMode')}</h3>
                        <ChoiceGroup label={t('focusMode')} options={focusWidthOptions} value={settings.focusWidthMode} onChange={value => onChange({ focusWidthMode: value })} />
                        <SliderRow
                            label={t('focusWidthSlider')}
                            valueText={t('unitRem', { value: focusWidthIsCustom ? settings.focusLineWidth : settings.lineWidth })}
                            disabled={!focusWidthIsCustom}
                            min={FOCUS_LINE_WIDTH_MIN}
                            max={FOCUS_LINE_WIDTH_MAX}
                            step={FOCUS_LINE_WIDTH_STEP}
                            value={focusWidthIsCustom ? settings.focusLineWidth : settings.lineWidth}
                            onChange={event => onChange({ focusLineWidth: Number(event.target.value) })}
                        />
                        <label htmlFor={focusDimId} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            <input
                                id={focusDimId}
                                type="checkbox"
                                checked={settings.focusDim}
                                onChange={event => onChange({ focusDim: event.target.checked })}
                                className="accent-emerald-500"
                            />
                            <span className="truncate">{t('focusDim')}</span>
                        </label>
                    </section>
                </div>
            )}
        </div>
    );
};

export default EditorSettings;
