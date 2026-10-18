import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { PRIVACY_SETTINGS_LABEL_KEY } from '../lib/viewCounting';

const INSCRIPT_URL = 'https://inscript.harshankur.com';
const LINK_CLASS = 'underline decoration-zinc-300 dark:decoration-zinc-700 underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors';

const ExternalLink = ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener" className={LINK_CLASS}>{children}</a>
);

// The footer of every screen a visitor can be on: the legal links (when configured) and
// "Powered by Inscript" on one line, then the copyright line `<title> © <year> <holder>`
// last. `config` comes from resolveFooterConfig (src/lib/footerConfig.js). A legal link reads
// in the visitor's language unless the environment set its label. The "poweredBy" string wraps
// the name in <site> (not <link>, which the Trans parser treats as a void element). With
// `privacySettings` (view counting is on, src/lib/viewCounting.js) a "Privacy settings" link after
// the legal links asks the visitor again whether their visits may be counted: viewcounter's
// consent.js opens its question for any click on an element with data-viewcounter-consent.
const SiteFooter = ({ config, privacySettings = false, className = '' }) => {
    const { t } = useTranslation();
    const { copyright, legalLinks } = config;
    return (
        <footer className={`text-[11px] leading-5 text-center text-zinc-500 dark:text-zinc-400 ${className}`}>
            <p className="flex flex-wrap items-center justify-center gap-x-2">
                {legalLinks.map(link => (
                    <React.Fragment key={link.url}>
                        <ExternalLink href={link.url}>{link.label ?? t(link.labelKey)}</ExternalLink>
                        <span aria-hidden="true">&middot;</span>
                    </React.Fragment>
                ))}
                {privacySettings && (
                    <>
                        <button type="button" data-viewcounter-consent="" className={LINK_CLASS}>{t(PRIVACY_SETTINGS_LABEL_KEY)}</button>
                        <span aria-hidden="true">&middot;</span>
                    </>
                )}
                <span>
                    <Trans i18nKey="poweredBy" components={{ site: <ExternalLink href={INSCRIPT_URL} /> }} />
                </span>
            </p>
            {copyright && (
                <p>
                    {copyright.title && <>{copyright.title} </>}
                    &copy;
                    {copyright.year && <> {copyright.year}</>}
                    {copyright.holder && (
                        <>
                            {' '}
                            {copyright.holderUrl
                                ? <ExternalLink href={copyright.holderUrl}>{copyright.holder}</ExternalLink>
                                : copyright.holder}
                        </>
                    )}
                </p>
            )}
        </footer>
    );
};

export default SiteFooter;
