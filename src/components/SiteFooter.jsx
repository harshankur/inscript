import React from 'react';
import { Trans } from 'react-i18next';

const INSCRIPT_URL = 'https://inscript.harshankur.com';
const LINK_CLASS = 'underline decoration-zinc-300 dark:decoration-zinc-700 underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors';

const ExternalLink = ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener" className={LINK_CLASS}>{children}</a>
);

// The footer of every screen a visitor can be on: the legal links (when configured) and
// "Powered by Inscript" on one line, then the copyright line `<title> © <year> <holder>`
// last. `config` comes from resolveFooterConfig (src/lib/footerConfig.js). The "poweredBy"
// string wraps the name in <site> (not <link>, which the Trans parser treats as a void element).
const SiteFooter = ({ config, className = '' }) => {
    const { copyright, legalLinks } = config;
    return (
        <footer className={`text-[11px] leading-5 text-center text-zinc-500 dark:text-zinc-400 ${className}`}>
            <p className="flex flex-wrap items-center justify-center gap-x-2">
                {legalLinks.map(link => (
                    <React.Fragment key={link.url}>
                        <ExternalLink href={link.url}>{link.label}</ExternalLink>
                        <span aria-hidden="true">&middot;</span>
                    </React.Fragment>
                ))}
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
