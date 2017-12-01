var m = window.m;
var _ = window._;
var createPDF = window.createPDF;

var SettingsData = {
    tvq: 9.9975,
    tps: 5.0,
    storeno: '',
    storeaddr: '',
    storecity: '',
    storepostcode: '',
    storephone: '',
    bdcoup: '45678',
    loaded: false,
    loadSettings: function () {
        var settings = localStorage.getItem('settings');
        if (settings) {
            settings = JSON.parse(settings);
            this.tvq = settings.tvq;
            this.tps = settings.tps;
            this.storeno = settings.storeno;
            this.bdcoup = settings.bdcoup;
            this.storecity = settings.storecity;
            this.storeaddr = settings.storeaddr;
            this.storephone = settings.storephone;
            this.storepostcode = settings.storepostcode;
            return true;
        } else {
            return false;
        }
    },
    saveSettings: function () {
        var settings = {
            tvq: this.tvq,
            tps: this.tps,
            storeno: this.storeno,
            bdcoup: this.bdcoup,
            storecity: this.storecity,
            storeaddr: this.storeaddr,
            storephone: this.storephone,
            storepostcode: this.storepostcode
        }
        settings = JSON.stringify(settings);
        localStorage.setItem('settings', settings);
        return true;
    }
}
SettingsData.loaded = SettingsData.loadSettings();

var QuoteData = {
    allquotes: {},
    openquote: {},
    loadQuotes: function () {
        var quotes = localStorage.getItem('allquotes');
        if (quotes) {
            this.allquotes = JSON.parse(quotes);
            return true;
        } else {
            this.allquotes = {};
            return false;
        }
    },
    saveQuotes: function () {
        var quotes = JSON.stringify(this.allquotes);
        localStorage.setItem('allquotes', quotes);
        return true;
    },
    loadQuote: function (quoteID) {
        var quote = localStorage.getItem(quoteID);
        if (quote) {
            this.openquote = JSON.parse(quote);
            return true;
        } else {
            this.openquote = {};
            return false;
        }
    },
    saveQuote: function () {
        if (!this.openquote.ID) return false;
        var quote = JSON.stringify(this.openquote);
        localStorage.setItem(this.openquote.ID, quote);
        return true;
    }
}
QuoteData.loadQuotes();

var QuoteHeader = function (activeTab) {
    return m('section.hero.is-info.is-bold', [
        m('.hero-body', m('.container', [
            m('h1.title.is-1', 'Soumissions par J-F Desrochers'),
            m('h2.subtitle.is-3', 'Rédigez vos soumissions rapidement et facilement avec ce petit programme')
        ])),
        m('.hero-foot', m('nav.tabs.is-boxed', m('.container', m('ul', [
            m('li' + (activeTab == 'quotelist' ? '.is-active' : ''), m('a[href="/"]', {oncreate: m.route.link}, [
                m('span.icon.is-small', m('i.fa.fa-home')),
                m('span', 'Mes soumissions')
            ])),
            m('li' + (activeTab == 'newquote' ? '.is-active' : ''), m('a[href="/new"]', {oncreate: m.route.link}, [
                m('span.icon.is-small', m('i.fa.fa-pencil-square-o')),
                m('span', 'Créer une nouvelle soumission')
            ])),
            m('li' + (activeTab == 'importquote' ? '.is-active' : ''), m('a[href="/load"]', {oncreate: m.route.link}, [
                m('span.icon.is-small', m('i.fa.fa-upload')),
                m('span', 'Charger une/des soumission(s)')
            ])),
            m('li' + (activeTab == 'settings' ? '.is-active' : ''), m('a[href="/settings"]', {oncreate: m.route.link}, [
                m('span.icon.is-small', m('i.fa.fa-cog')),
                m('span', 'Réglages')
            ]))
        ]))))
    ]);
}

var InputField = {
    oninit: function (vnode) {
        var params = vnode.attrs;
        var self = this;
        self.validate = function () {
            params.fieldSet[params.name].valid = params.regEx.test(params.fieldSet[params.name].value);
            return params.fieldSet[params.name].valid;
        }
        self.onChange = function (e) {
            params.fieldSet[params.name].value = e.target.value;
            self.validate();
            if (typeof params.onChange === 'function') {
                params.onChange(e);
            }
        }
        self.onExit = function () {
            self.validate();
        }
        if (!params.fieldSet[params.name]) {
            params.fieldSet[params.name] = {
                value: params.defaultValue,
                valid: null,
                validate: self.validate
            }
        }
    },
    view: function (vnode) {
        var params = vnode.attrs;
        var self = this;

        return m('div.field', [
            m('label.label', params.label),
            m('div.control' + (params.icon ? '.has-icons-right' : ''), [
                m('input.input' + (params.fieldSet[params.name].valid === true ? '.is-success' : params.fieldSet[params.name].valid === false ? '.is-danger' : ''), {
                    oncreate: function (vdom) {
                        if (params.autofocus) {
                            vdom.dom.focus();
                        }
                    },
                    id: params.name,
                    name: params.name,
                    type: 'text',
                    placeholder: params.label,
                    value: params.fieldSet[params.name].value,
                    onchange: self.onChange,
                    onblur: self.onExit,
                    disabled: params.disabled || false
                }),
                params.icon ? m('span.icon.is-small.is-right', m('i', {className: params.icon})) : ''
            ]),
            (params.fieldSet[params.name].valid === true && params.successText) ? m('p.help.is-success', params.successText) :
            (params.fieldSet[params.name].valid === false && params.errorText) ? m('p.help.is-danger', params.errorText) : ''
        ])
    }
}

var QuoteList = {}

QuoteList.view = function () {
    return [
        QuoteHeader('quotelist'),
        m('section.section', [
            m('.container', [

            ])
        ])
    ];
}

var NewQuote = {}

NewQuote.view = function () {
    return [
        QuoteHeader('newquote'),
        m('section.section', [
            m('.container', [

            ])
        ])
    ];
}

var ImportQuote = {}

ImportQuote.view = function () {
    return [
        QuoteHeader('importquote'),
        m('section.section', [
            m('.container', [
                m('button.button.is-info', {onclick: function () {
                    window.open('/pdfview.html#' + createPDF());
                }}, 'Test PDF')
            ])
        ])
    ];
}

var Settings = {}

Settings.oninit = function () {
    var self = this;
    self.fieldSet = {};

    self.save = function () {
        var valid = Object.keys(self.fieldSet).every(function (k) {
            return self.fieldSet[k].validate();
        })
        if (valid) {
            SettingsData.bdcoup = self.fieldSet['bdcoup'].value;
            SettingsData.tvq = parseFloat(self.fieldSet['tvq'].value);
            SettingsData.tps = parseFloat(self.fieldSet['tps'].value);
            SettingsData.storeno = self.fieldSet['storeno'].value;
            SettingsData.storeaddr = self.fieldSet['storeaddr'].value;
            SettingsData.storecity = self.fieldSet['storecity'].value;
            SettingsData.storepostcode = self.fieldSet['storepostcode'].value;
            SettingsData.storephone = self.fieldSet['storephone'].value;
            SettingsData.saveSettings();
            SettingsData.loaded = true;
            m.route.set('/');
        }
    }
}

Settings.view = function () {
    var self = this;
    return [
        QuoteHeader('settings'),
        m('section.section', [
            m('.container', [
                m('h1.title', 'Réglages'),
                m('h2.subtitle', 'Voici quelques réglages nécessaires à l\'opération du programme. SVP remplir tous les champs avant de continuer.'),
                m('.columns', [
                    m('.column', [
                        m(InputField, {
                            name: 'storeno',
                            label: 'Numéro de magasin',
                            fieldSet: self.fieldSet,
                            defaultValue: SettingsData.storeno,
                            regEx: /^[1-9]{1}\d{0,2}$/,
                            errorText: 'Entrez un numéro de magasin valide.',
                            autofocus: true
                        }),
                        m(InputField, {
                            name: 'storeaddr',
                            label: 'Adresse du magasin',
                            fieldSet: self.fieldSet,
                            defaultValue: SettingsData.storeaddr,
                            regEx: /^\d+\s?.+$/,
                            errorText: 'Entrez l\'adresse du magasin.'
                        }),
                        m(InputField, {
                            name: 'storecity',
                            label: 'Ville du magasin',
                            fieldSet: self.fieldSet,
                            defaultValue: SettingsData.storecity,
                            regEx: /^.+$/,
                            errorText: 'Entrez la ville du magasin.'
                        }),
                        m(InputField, {
                            name: 'storepostcode',
                            label: 'Code postal du magasin',
                            fieldSet: self.fieldSet,
                            defaultValue: SettingsData.storepostcode,
                            regEx: /^[ABCEGHJ-NPRSTVXY]{1}\d{1}[A-Z]{1}\s?\d{1}[A-Z]{1}\d{1}$/i,
                            errorText: 'Entrez un code postal valide (ex.: H0H 0H0).'
                        }),
                        m(InputField, {
                            name: 'storephone',
                            label: 'Numéro de téléphone du magasin',
                            fieldSet: self.fieldSet,
                            defaultValue: SettingsData.storephone,
                            regEx: /^[(]?\d{3}[)]?\s?-?\s?\d{3}\s?-?\s?\d{4}$/,
                            errorText: 'Entrez un numéro de téléphone valide (ex.: (555) 555-2345).'
                        }),
                    ]),
                    m('.column', [
                        m(InputField, {
                            name: 'tvq',
                            label: 'Taxe de Vente du Québec (%)',
                            fieldSet: self.fieldSet,
                            defaultValue: SettingsData.tvq,
                            regEx: /^\d+(\.\d+)?$/,
                            errorText: 'Entrez un pourcentage de taxe valide (ex.: 9.9975).'
                        }),
                        m(InputField, {
                            name: 'tps',
                            label: 'Taxe des Produits et Services (%)',
                            fieldSet: self.fieldSet,
                            defaultValue: SettingsData.tps,
                            regEx: /^\d+(\.\d+)?$/,
                            errorText: 'Entrez un pourcentage de taxe valide (ex.: 5.0).'
                        }),
                        m(InputField, {
                            name: 'bdcoup',
                            label: 'Code de bon pour le développement des affaires',
                            fieldSet: self.fieldSet,
                            defaultValue: SettingsData.bdcoup,
                            regEx: /^\d{5}$/,
                            errorText: 'Entrez un code de bon valide (ex.: 12345).'
                        })
                    ])
                ]),
                m('.field.is-grouped.notification', [
                    m('.control', m('button.button.is-primary', {onclick: self.save}, 'Sauvegarder')),
                    m('.control', m('a.button[href="/"]', {oncreate: m.route.link}, 'Annuler'))
                ])
            ])
        ])
    ];
}

function detectIE() {
    // From https://codepen.io/gapcode/pen/vEJNZN
    var ua = window.navigator.userAgent;
  
    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }
  
    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }
  
    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
        // Edge (IE 12+) => return version number
        return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }
    return false;
}
var version = detectIE();

var IEWarning = {}

IEWarning.view = function () {
    return m('section.hero.is-warning.is-bold', [
        m('.hero-body', [
            m('.container', [
                m('h1.title.is-spaced', 'Vous utilisez présentement Internet Explorer ' + version + '.'),
                m('h2.subtitle', 'Afin de pouvoir utiliser toutes les fonctionnalités de ce site, nous vous recommandons d\'utiliser un navigateur moderne, tel que Google Chrome, Mozilla Firefox ou Microsoft Edge. Voici une sélection de navigateurs que vous pouvez télécharger :')
            ])
        ]),
        m('.hero-foot', [
            m('.container', m('.section', [
                m('.tile.is-ancestor', [
                    m('.tile.is-parent', m('a.tile.is-child.box.has-text-centered[href="https://www.google.fr/intl/fr/chrome/browser/desktop/"]', [
                        m('p.title', 'Google Chrome'),
                        m('img.browser-logo', {src: 'img/ChromeLogo.png'})
                    ])),
                    m('.tile.is-parent', m('a.tile.is-child.box.has-text-centered[href="https://www.mozilla.org/fr/firefox/new/"]', [
                        m('p.title', 'Mozilla Firefox'),
                        m('img.browser-logo', {src: 'img/FirefoxLogo.png'})
                    ])),
                    m('.tile.is-parent', m('a.tile.is-child.box.has-text-centered[href="http://www.opera.com/fr"]', [
                        m('p.title', 'Opera'),
                        m('img.browser-logo', {src: 'img/OperaLogo.png'})
                    ])),
                    m('.tile.is-parent', m('a.tile.is-child.box.has-text-centered[href="https://www.microsoft.com/fr-ca/windows/microsoft-edge"]', [
                        m('p.title', 'Microsoft Edge'),
                        m('img.browser-logo', {src: 'img/EdgeLogo.png'})
                    ]))
                ])
            ]))
        ])
    ]);
}

if (version && version < 10) {
    document.getElementById('approot').innerHTML = '<p>Vous utilisez présentement Internet Explorer ' + version + '. Ce navigateur n\'est plus supporté par Microsoft et ne fonctionnera pas sur ce site. Veuillez télécharger un navigateur moderne, tel que <a href="https://www.google.fr/intl/fr/chrome/browser/desktop/">Google Chrome</a> ou <a href="https://www.mozilla.org/fr/firefox/new/">Mozilla Firefox</a>.</p>';
} else if (version && version < 12) {
    m.mount(document.getElementById('approot'), IEWarning);
} else {
    var ifSettings = function (comp) {
        return {
            onmatch: function () {
                if (SettingsData.loaded) {
                    return comp;
                } else {
                    return Settings;
                }
            }
        }
    };
    m.route(document.getElementById('approot'), '/', {
        '/': ifSettings(QuoteList),
        '/new': ifSettings(NewQuote),
        '/load': ifSettings(ImportQuote),
        '/settings': Settings
    });
}