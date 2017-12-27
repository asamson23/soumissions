var m = window.m;
var _ = window._;
var titleCase = window.titleCase;
var createPDF = window.createPDF;

var zFill = function(s) {
    return ('0' + s).slice(-2);
}

var serializeFieldSet = function(fieldSet) {
    var res = {};
    Object.keys(fieldSet).map(function (o) {
        res[o] = fieldSet[o].value;
    });
    return res;
}

var EcoSetting = {
    INCLUDE: 'INCLUDE',
    INSERT: 'INSERT'
}
var SettingsData = {
    tvq: 9.9975,
    tps: 5.0,
    storeno: '',
    storeaddr: '',
    storecity: '',
    storepostcode: '',
    storephone: '',
    bdcoup: '53431',
    loaded: false,
    ecosetting: EcoSetting.INCLUDE,
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
            this.ecosetting = settings.ecosetting;
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
            storepostcode: this.storepostcode,
            ecosetting: this.ecosetting
        }
        settings = JSON.stringify(settings);
        localStorage.setItem('settings', settings);
        return true;
    }
}
SettingsData.loaded = SettingsData.loadSettings();

var QuoteStatus = {
    NEW: 'NEW',
    ACTIVE: 'ACTIVE',
    EXPIRED: 'EXPIRED',
    INACTIVE: 'INACTIVE'
}

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
        if (!this.openquote.id) return false;
        var quote = JSON.stringify(this.openquote);
        localStorage.setItem(this.openquote.id, quote);
        return true;
    },
    nextQuoteId: function () {
        var store = SettingsData.storeno,
            date = new Date(),
            datestr = String(date.getFullYear()).slice(2, 4) + zFill(String(date.getMonth() + 1)) + zFill(String(date.getDate())),
            seq = 1,
            id = store + datestr + zFill(seq);
        while (id in this.allquotes) {
            seq++;
            id = store + datestr + zFill(seq);
        }
        return id;
    },
    newQuote: function () {
        var date = new Date();
        var expdate = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate());
        this.openquote = {
            id: this.nextQuoteId(),
            date: date,
            expires: expdate,
            associate: {
                number: '',
                name: ''
            },
            store: {
                no: SettingsData.storeno,
                addr: SettingsData.storeaddr,
                city: SettingsData.storecity + ', QC',
                postcode: SettingsData.storepostcode,
                phone: SettingsData.storephone
            },
            customer: {
                name: '',
                company: '',
                addr: '',
                city: '',
                province: '',
                postcode: '',
                phone: '',
                email: ''
            },
            items: {
                header: ['Qté', 'No d\'UGS', 'Description', 'Prix Unitaire', 'Prix Total'],
                rows: []
            },
            comments: '',
            notes: '',
            status: QuoteStatus.NEW
        }
        return this.openquote;
    },
    dateToStr: function (d) {
        return zFill(String(d.getDate())) + '/' + zFill(String(d.getMonth() + 1)) + '/' + String(d.getFullYear());
    },
    strToDate: function (s) {
        s = s.split('/');
        return new Date(Number(s[2]), Number(s[1]) - 1, Number(s[0]));
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

var FieldGroup = {
    view: function (vnode) {
        var params = vnode.attrs;
        return m('div.field', [
            m('label.label' + (params.small ? '.is-small' : ''), params.label),
            params.hasAddons ? m('div.field' + (params.hasAddons ? '.has-addons' : ''), vnode.children) :
            vnode.children,
            (params.isValid === true && params.successText) ? m('p.help.is-success', params.successText) :
            (params.isValid === false && params.errorText) ? m('p.help.is-danger', params.errorText) : 
            (params.helpText) ? m('p.help', params.helpText) : ''
        ])
    }
}

var InputField = {
    oninit: function (vnode) {
        var params = vnode.attrs;
        var self = this;
        self.validate = function () {
            var isValid = params.regEx.test(params.fieldSet[params.name].value);
            if (isValid) {
                if (typeof params.filter === 'function') {
                    var filtered = params.filter(params.fieldSet[params.name].value, params.regEx);
                    if (filtered === false) {
                        isValid = false;
                    } else {
                        params.fieldSet[params.name].value = filtered;
                    }
                } else if (typeof params.filter === 'string') {
                    params.fieldSet[params.name].value = params.fieldSet[params.name].value.replace(params.regEx, params.filter);
                };
            };
            params.fieldSet[params.name].valid = isValid;
            return isValid;
        }
        self.onChange = function (e) {
            params.fieldSet[params.name].value = e.target.value;
            if (typeof params.onChange === 'function') {
                params.onChange(e, params.fieldSet[params.name]);
            };
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

        var render = [
            m('div.control' + (params.icon ? '.has-icons-right' : '') + (params.fullwidth ? '.is-expanded' : ''), [
                m('input.input'  + (params.small ? '.is-small' : '') + (params.fieldSet[params.name].valid === true ? '.is-success' : params.fieldSet[params.name].valid === false ? '.is-danger' : ''), {
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
            ])
        ];
        if (params.manualGrouping === true) {
            return render;
        } else {
            var hasAddons = false;
            if (Array.isArray(params.manualGrouping)) {
                render = render.concat(params.manualGrouping);
                hasAddons = true;
            }
            return m(FieldGroup, {
                hasAddons: hasAddons,
                label: params.label,
                small: params.small,
                helpText: params.helpText,
                successText: params.successText,
                errorText: params.errorText,
                isValid: params.fieldSet[params.name].valid
            }, render);
        }
    }
}

var SelectField = {
    oninit: function (vnode) {
        var params = vnode.attrs;
        var self = this;
        self.validate = function () {
            var isValid = true;
            if (typeof params.onValidate === 'function') {
                isValid = params.onValidate(params.fieldSet[params.name].value);
            }
            params.fieldSet[params.name].valid = isValid;
            return isValid;
        }
        self.onChange = function (e) {
            params.fieldSet[params.name].value = e.target.value;
            if (typeof params.onChange === 'function') {
                params.onChange(e);
            };
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

        var render = [
            m('div.control' + (params.icon ? '.has-icons-right' : '') + (params.fullwidth ? '.is-expanded' : ''), [
                m('div.select'  + (params.small ? '.is-small' : '') + (params.fullwidth ? '.is-fullwidth' : '') + (params.fieldSet[params.name].valid === true ? '.is-success' : params.fieldSet[params.name].valid === false ? '.is-danger' : ''), [
                    m('select', {
                        oncreate: function (vdom) {
                            if (params.autofocus) {
                                vdom.dom.focus();
                            }
                        },
                        id: params.name,
                        name: params.name,
                        onchange: self.onChange,
                        onblur: self.onExit,
                        disabled: params.disabled || false
                    }, params.options.map(function (o) {
                        return m('option', {value: o.value, selected: (params.fieldSet[params.name].value == o.value)}, o.label);
                    }))
                ]),
                params.icon ? m('span.icon.is-small.is-right', m('i', {className: params.icon})) : ''
            ])
        ];
        if (params.manualGrouping === true) {
            return render;
        } else {
            var hasAddons = false;
            if (Array.isArray(params.manualGrouping)) {
                render = render.concat(params.manualGrouping);
                hasAddons = true;
            }
            return m(FieldGroup, {
                hasAddons: hasAddons,
                label: params.label,
                small: params.small,
                helpText: params.helpText,
                successText: params.successText,
                errorText: params.errorText,
                isValid: params.fieldSet[params.name].valid
            }, render);
        }
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

NewQuote.oninit = function () {
    var self = this;
    self.fieldSet = {};
    self.quoteFields = {};
    self.quoteItems = [];
    self.quote = QuoteData.newQuote();
    self.isLoading = false;
    self.notFound = false;

    self.loadSku = function (e, field) {
        if (field.value !== '') {
            self.isLoading = true;
            self.notFound = false;
            m.request('https://hook.io/jfdesrochers/splslookup/' + field.value).then(function (value) {
                console.log(value);
                self.quoteFields['desc'].value = value.description;
                self.quoteFields['price'].value = value.listPrice;
                self.isLoading = false;
            }).catch(function (err) {
                self.isLoading = false;
                self.notFound = true;
                setTimeout(function () {
                    self.notFound = false;
                    m.redraw();
                }, 2000);
                console.error(err);
            })
        }
    }
}

NewQuote.view = function () {
    var self = this;
    return [
        QuoteHeader('newquote'),
        m('section.section', [
            m('.container', [
                m('.columns', [
                    m('.column', [
                        m('h1.title', 'Créer une nouvelle soumission'),
                        m('h2.subtitle', 'Veuillez remplir les champs de cette page. La soumission sera sauvegardée automatiquement.'),
                    ]),
                    m('.column.is-3.notification', [
                        m('div.field', [
                            m('label.label.is-small', 'Numéro du devis'),
                            m('div.control', m('p.is-small', self.quote.id))
                        ]),
                        m('div.field', [
                            m('label.label.is-small', 'Statut du devis'),
                            m('div.control', self.quote.status == QuoteStatus.NEW ? m('p.is-small', 'NOUVEAU') : '')
                        ]),
                    ])
                ])
            ])
        ]),
        m('section.section.is-small', [
            m('.container', [
                m('h1.title.is-4', '1. Renseignements Généraux'),
                m('h2.subtitle.is-6', 'D\'abord, quelques renseignements généraux sur la soumission.'),
                m('.columns', [
                    m('.column', [
                        m(InputField, {
                            name: 'assno',
                            label: 'Votre numéro d\'associé',
                            fieldSet: self.fieldSet,
                            defaultValue: '',
                            regEx: /^\d{7}$/,
                            helpText: 'Entrez votre numéro d\'associé. (ex.: 1234567 ou 0004567)',
                            errorText: 'Entrez un numéro d\'associé valide. (ex.: 1234567 ou 0004567)',
                            autofocus: true
                        }),
                        m(InputField, {
                            name: 'assname',
                            label: 'Votre nom',
                            fieldSet: self.fieldSet,
                            defaultValue: '',
                            regEx: /^.+$/,
                            filter: titleCase.convert,
                            helpText: 'Entrez votre nom complet (prénom et nom)',
                            errorText: 'Entrez un nom valide.'
                        })
                    ]),
                    m('.column', [
                        m(InputField, {
                            name: 'quotedate',
                            label: 'Date de la soumission',
                            fieldSet: self.fieldSet,
                            defaultValue: QuoteData.dateToStr(self.quote.date),
                            regEx: /^(0[1-9]|[12][0-9]|3[01])[- /.]?(0[1-9]|1[0-2])[- /.]?((?:19|20)\d\d)$/,
                            filter: function (s, rEx) {
                                self.quote.date = QuoteData.strToDate(s.replace(rEx, '$1/$2/$3'));
                                return QuoteData.dateToStr(self.quote.date);
                            },
                            helpText: '(jj/mm/aaaa)',
                            errorText: 'Entrez une date valide (jj/mm/aaaa).'
                        }),
                        m(InputField, {
                            name: 'quoteexpires',
                            label: 'Date d\'expiration',
                            fieldSet: self.fieldSet,
                            defaultValue: QuoteData.dateToStr(self.quote.expires),
                            regEx: /^(0[1-9]|[12][0-9]|3[01])[- /.]?(0[1-9]|1[0-2])[- /.]?((?:19|20)\d\d)$/,
                            filter: function (s, rEx) {
                                self.quote.expires = QuoteData.strToDate(s.replace(rEx, '$1/$2/$3'));
                                if (self.quote.expires < self.quote.date) {
                                    return false;
                                }
                                return QuoteData.dateToStr(self.quote.expires);
                            },
                            helpText: '(jj/mm/aaaa)',
                            errorText: 'Entrez une date valide (jj/mm/aaaa). La date doit être supérieure à la date de soumission.'
                        })
                    ])
                ])
            ])
        ]),
        m('section.section.is-small', [
            m('.container', [
                m('h1.title.is-4', '2. Renseignements sur votre client'),
                m('h2.subtitle.is-6', 'Veuillez remplir tous les champs ci-dessous.'),
                m('.columns', [
                    m('.column', [
                        m('.columns', [
                            m('.column', [
                                m(InputField, {
                                    name: 'custphone',
                                    label: 'Numéro de téléphone du client',
                                    fieldSet: self.fieldSet,
                                    defaultValue: '',
                                    regEx: /^[(]?(\d{3})[)]?\s?-?\s?(\d{3})\s?-?\s?(\d{4})$/,
                                    filter: '($1) $2-$3',
                                    helpText: 'Entrez le numéro de téléphone de votre client.',
                                    errorText: 'Entrez un numéro de téléphone valide. (ex.: (555) 555-2345)'
                                })
                            ]),
                            m('.column', [
                                m(InputField, {
                                    name: 'custemail',
                                    label: 'Adresse courriel du client',
                                    fieldSet: self.fieldSet,
                                    defaultValue: '',
                                    regEx: /^([A-Z|a-z|0-9](\.|_){0,1})+[A-Z|a-z|0-9]\@([A-Z|a-z|0-9])+((\.){0,1}[A-Z|a-z|0-9]){2}\.[a-z]{2,3}$/,
                                    helpText: 'Entrez l\'adresse courriel de votre client.',
                                    errorText: 'Entrez une adresse courriel valide. (ex.: nom@entreprise.com)'
                                })
                            ]),
                        ]),
                        m(InputField, {
                            name: 'custname',
                            label: 'Nom de la personne-ressource',
                            fieldSet: self.fieldSet,
                            defaultValue: '',
                            regEx: /^.+$/,
                            filter: titleCase.convert,
                            helpText: 'Entrez le nom complet (prénom et nom)',
                            errorText: 'Entrez un nom valide.'
                        }),
                        m(InputField, {
                            name: 'custbusiness',
                            label: 'Nom de l\'entreprise',
                            fieldSet: self.fieldSet,
                            defaultValue: '',
                            regEx: /^.+$/,
                            filter: titleCase.convert,
                            helpText: 'Entrez le nom de l\'entreprise.',
                            errorText: 'Entrez un nom valide.'
                        })
                    ]),
                    m('.column', [
                        m(InputField, {
                            name: 'custaddr',
                            label: 'Adresse du client',
                            fieldSet: self.fieldSet,
                            defaultValue: '',
                            regEx: /^\d+\s?.+$/,
                            filter: titleCase.convert,
                            helpText: 'Entrez l\'adresse de votre client.',
                            errorText: 'Entrez une adresse valide.'
                        }),
                        m('.columns', [
                            m('.column', [
                                m(InputField, {
                                    name: 'custcity',
                                    label: 'Ville du client',
                                    fieldSet: self.fieldSet,
                                    defaultValue: '',
                                    regEx: /^.+$/,
                                    filter: titleCase.convert,
                                    helpText: 'Entrez la ville de votre client.',
                                    errorText: 'Entrez une ville valide.'
                                })
                            ]),
                            m('.column', [
                                m(SelectField, {
                                    name: 'custprovince',
                                    label: 'Province du client',
                                    fieldSet: self.fieldSet, 
                                    defaultValue: 'QC',
                                    helpText: 'Choisissez la province de votre client.',
                                    fullwidth: true,
                                    options: [
                                        {value: 'QC', label: 'Québec'},
                                        {value: 'ON', label: 'Ontario'},
                                        {value: 'NB', label: 'Nouveau-Brunswick'},
                                        {value: 'NS', label: 'Nouvelle-Écosse'},
                                        {value: 'NL', label: 'Terre-Neuve et Labrador'},
                                        {value: 'PEI', label: 'Ile du Prince-Édouard'},
                                        {value: 'MB', label: 'Manitoba'},
                                        {value: 'SK', label: 'Saskatchewan'},
                                        {value: 'AB', label: 'Alberta'},
                                        {value: 'BC', label: 'Colombie-Britannique'}
                                    ]
                                })
                            ])
                        ]),
                        m(InputField, {
                            name: 'custpostcode',
                            label: 'Code postal du client',
                            fieldSet: self.fieldSet,
                            defaultValue: '',
                            regEx: /^([ABCEGHJ-NPRSTVXY]{1}\d{1}[A-Z]{1})\s?(\d{1}[A-Z]{1}\d{1})$/i,
                            filter: function (s, rEx) {
                                return s.replace(rEx, '$1 $2').toUpperCase();
                            },
                            helpText: 'Entrez le code postal de votre client (ex.: H0H 0H0).',
                            errorText: 'Entrez un code postal valide (ex.: H0H 0H0).'
                        }),
                    ])
                ])
            ])
        ]),
        m('section.section.is-small', [
            m('.container', [
                m('h1.title.is-4', '3. Items de votre soumission'),
                m('h2.subtitle.is-6', 'Vous pouvez ajouter jusqu\'à 18 items à votre soumission ci-dessous.'),
                m('table.table.is-fullwidth', [
                    m('thead', m('tr', [
                        m('th', m('abbr', {title: 'Quantité'}, 'Qté')),
                        m('th', 'UGS'),
                        m('th', 'Description'),
                        m('th', m('abbr', {title: 'Prix unitaire'}, 'Prix')),
                        m('th', 'Rabais'),
                        m('th', 'Écofrais'),
                        m('th', 'Total')
                    ])),
                    m('tbody', self.quoteItems.length > 0 ? '' : m('tr', m('td', {colspan: 7}, 'Aucun item à afficher.')))
                ]),
                m('h2.subtitle.is-5', 'Ajouter un item'),
                m('.columns', [
                    m('.column.is-1', m(InputField, {
                        name: 'qty',
                        label: 'Quantité',
                        fieldSet: self.quoteFields,
                        defaultValue: '1',
                        regEx: /^[1-9]\d*$/,
                        errorText: 'Entrez une quantité valide (> 0).'
                    })),
                    m('.column', m(InputField, {
                        name: 'sku',
                        label: 'UGS',
                        fieldSet: self.quoteFields,
                        defaultValue: '',
                        regEx: /^.+$/,
                        onChange: self.loadSku,
                        errorText: 'Entrez une UGS valide.',
                        helpText: self.notFound ? 'Item non trouvé!' : self.isLoading ? 'Chargement de l\'item...' : '',
                        icon: self.isLoading ? 'fa fa-cog fa-spin' : 'fa fa-search'
                    })),
                    m('.column.is-4', m(InputField, {
                        name: 'desc',
                        label: 'Description',
                        fieldSet: self.quoteFields,
                        defaultValue: '',
                        regEx: /^.+$/,
                        errorText: 'Entrez une description valide.'
                    })),
                    m('.column', m(InputField, {
                        name: 'price',
                        label: 'Prix unitaire',
                        fieldSet: self.quoteFields,
                        defaultValue: '',
                        regEx: /^(\d+)(?:[\,|\.](\d{1,2}))?$/,
                        filter: function (v, r) {
                            var m = r.exec(v);
                            if (!m[1]) return '';
                            if (m[2]) {
                                if (m[2].length == 1) {
                                    return m[1] + '.' + m[2] + '0';
                                } else {
                                    return m[1] + '.' + m[2];
                                }
                            } else {
                                return m[1] + '.00';
                            }
                        },
                        errorText: 'Entrez un prix valide. (ex.: 25.00)'
                    })),
                    m('.column', [
                        m(InputField, {
                            manualGrouping: [
                                m(SelectField, {
                                    manualGrouping: true,
                                    name: 'rebatetype',
                                    fieldSet: self.fieldSet, 
                                    defaultValue: '$',
                                    options: [
                                        {value: '$', label: '$'},
                                        {value: '%', label: '%'}
                                    ]
                                })
                            ],
                            name: 'rebatevalue',
                            label: 'Rabais',
                            fieldSet: self.quoteFields,
                            defaultValue: '',
                            fullwidth: true,
                            regEx: /^(\d+)(?:[\,|\.](\d{1,2}))?$/,
                            filter: function (v, r) {
                                var m = r.exec(v);
                                if (!m[1]) return '';
                                if (m[2]) {
                                    if (m[2].length == 1) {
                                        return m[1] + '.' + m[2] + '0';
                                    } else {
                                        return m[1] + '.' + m[2];
                                    }
                                } else {
                                    return m[1] + '.00';
                                }
                            },
                            errorText: 'Entrez un rabais valide. (ex.: 25.00)'
                        })
                    ]),
                ])
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
                    window.open('pdfview.html#' + createPDF());
                }}, 'Test PDF')
            ])
        ])
    ];
}

var Settings = {}

Settings.oninit = function () {
    var self = this;
    self.fieldSet = {};
    self.ecoSetting = SettingsData.ecosetting;
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
            SettingsData.ecosetting = self.fieldSet['ecosetting'].value;
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
                            filter: titleCase.convert,
                            errorText: 'Entrez l\'adresse du magasin.'
                        }),
                        m(InputField, {
                            name: 'storecity',
                            label: 'Ville du magasin',
                            fieldSet: self.fieldSet,
                            defaultValue: SettingsData.storecity,
                            regEx: /^.+$/,
                            filter: titleCase.convert,
                            errorText: 'Entrez la ville du magasin.'
                        }),
                        m(InputField, {
                            name: 'storepostcode',
                            label: 'Code postal du magasin',
                            fieldSet: self.fieldSet,
                            defaultValue: SettingsData.storepostcode,
                            regEx: /^([ABCEGHJ-NPRSTVXY]{1}\d{1}[A-Z]{1})\s?(\d{1}[A-Z]{1}\d{1})$/i,
                            filter: function (s, rEx) {
                                return s.replace(rEx, '$1 $2').toUpperCase();
                            },
                            errorText: 'Entrez un code postal valide (ex.: H0H 0H0).'
                        }),
                        m(InputField, {
                            name: 'storephone',
                            label: 'Numéro de téléphone du magasin',
                            fieldSet: self.fieldSet,
                            defaultValue: SettingsData.storephone,
                            regEx: /^[(]?(\d{3})[)]?\s?-?\s?(\d{3})\s?-?\s?(\d{4})$/,
                            filter: '($1) $2-$3',
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
                        }),
                        m(SelectField, {
                            name: 'ecosetting',
                            label: 'Options d\'affichage des écofrais',
                            fieldSet: self.fieldSet, 
                            defaultValue: SettingsData.ecosetting,
                            helpText: "Vous pouvez afficher les écofrais dans votre soumission de deux façons: si vous choisissez d'inclure les écofrais dans le prix de l'item, un astérisque sera placé à côté du prix avec une note indiquant que les écofrais ont été incorporés. Si vous désirez avoir les écofrais sur leur propre ligne à la place, ils seront placés directement sous l'item. Notez par contre qu'une soumission ne peut avoir qu'un maximum de 18 lignes: une soumission d'articles technologiques risque de se remplir rapidement!",
                            fullwidth: true,
                            options: [
                                {value: EcoSetting.INCLUDE, label: 'Inclure les écofrais dans le prix de l\'item'},
                                {value: EcoSetting.INSERT, label: 'Ajouter les écofrais sur leur propre ligne de soumission'}
                            ]
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