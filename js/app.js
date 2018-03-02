var m = window.m;
var _ = window._;
var titleCase = window.titleCase;
var createPDF = window.createPDF;

var zFill = function(s) {
    return ('0' + s).slice(-2);
}

var serializeFieldSet = function(fieldSet) {
    var res = {};
    Object.keys(fieldSet).forEach(function (o) {
        res[o] = fieldSet[o].value;
    });
    return res;
}

var deserializeFieldSet = function(data, fieldSet) {
    Object.keys(data).forEach(function (o) {
        if (fieldSet[o]) {
            fieldSet[o].value = data[o];
            fieldSet[o].valid = null;
        }
    });
}

var resetValidation = function(fieldSet) {
    Object.keys(fieldSet).forEach(function (o) {
        fieldSet[o].valid = null;
    });
}

var validateFieldSet = function (fieldSet) {
    return Object.keys(fieldSet).every(function (k) {
        return fieldSet[k].validate();
    })
}

var SettingsData = {
    tvq: 9.975,
    tps: 5.0,
    storeno: '',
    storeaddr: '',
    storecity: '',
    storepostcode: '',
    storephone: '',
    bdcoup: '53431',
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
            this.openquote.date = new Date(this.openquote.date);
            this.openquote.expires = new Date(this.openquote.expires);
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
        this.allquotes[this.openquote.id] = {status: this.openquote.status, customer: this.openquote.customer.company};
        this.saveQuotes();
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
            items: [],
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

var QuoteHeader = function (activeTab, quoteid) {
    return m('header.hero.is-info.is-bold', [
        m('.hero-body', m('.container', [
            m('h1.title.is-1-tablet', 'Soumissions par J-F Desrochers'),
            m('h2.subtitle.is-3-tablet', 'Rédigez vos soumissions rapidement et facilement avec ce petit programme')
        ])),
        m('.hero-foot', m('nav.tabs.is-boxed.is-hidden-mobile', m('ul', [
            m('li' + (activeTab == 'quotelist' ? '.is-active' : ''), m('a[href="/"]', {oncreate: m.route.link}, [
                m('span.icon.is-small', m('i.fa.fa-home')),
                m('span', 'Mes soumissions')
            ])),
            m('li' + (activeTab == 'newquote' ? '.is-active' : ''), m('a[href="/new"]', {oncreate: m.route.link}, [
                m('span.icon.is-small', m('i.fa.fa-pencil-square-o')),
                (activeTab == 'newquote' && quoteid) ? m('span', 'Modifier la soumission ' + quoteid) :
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
        ])))
    ]);
}

var QuoteFooter = function (activeTab, quoteid) {
    return m('footer.footer', [
        m('.container', [
            m('nav.tabs.is-fullwidth.is-hidden-tablet', m('ul', [
                m('li' + (activeTab == 'quotelist' ? '.is-active' : ''), m('a[href="/"]', {oncreate: m.route.link}, [
                    m('span.icon.is-small', m('i.fa.fa-lg.fa-home')),
                    m('span', 'Liste')
                ])),
                m('li' + (activeTab == 'newquote' ? '.is-active' : ''), m('a[href="/new"]', {oncreate: m.route.link}, [
                    m('span.icon.is-small', m('i.fa.fa-lg.fa-pencil-square-o')),
                    (activeTab == 'newquote' && quoteid) ? m('span', 'Modifier') : m('span', 'Nouvelle')
                ])),
                m('li' + (activeTab == 'importquote' ? '.is-active' : ''), m('a[href="/load"]', {oncreate: m.route.link}, [
                    m('span.icon.is-small', m('i.fa.fa-lg.fa-upload')),
                    m('span', 'Charger')
                ])),
                m('li' + (activeTab == 'settings' ? '.is-active' : ''), m('a[href="/settings"]', {oncreate: m.route.link}, [
                    m('span.icon.is-small', m('i.fa.fa-lg.fa-cog')),
                    m('span', 'Réglages')
                ]))
            ])),
            m('content.is-hidden-mobile', m.trust('<strong>Soumissions</strong>, Copyright © 2018 par <a href="https://github.com/jfdesrochers/soumissions">Jean-François Desrochers</a>. Le code source de ce programme est disponible sous la license <a href="http://opensource.org/licenses/mit-license.php">MIT</a>.'))
        ])
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
        self.validated = false;
        self.validate = function () {
            if (self.validated) return;
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
            self.validate();
            self.validated = true;
            if (typeof params.onChange === 'function') {
                params.onChange(e, params.fieldSet[params.name]);
            };
        }
        self.onExit = function () {
            self.validate();
            self.validated = false;
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
        m('div.contents', [
            m('section.section', [
                m('.container', [
    
                ])
            ])
        ]),
        QuoteFooter('quotelist')
    ];
}

var NewQuote = {}

NewQuote.oninit = function (vnode) {
    var self = this;
    self.fieldSet = {};
    self.quoteFields = {};
    self.quoteItems = [];
    self.quotelen = 0;
    self.quoteid = vnode.attrs.key || null
    if (self.quoteid && QuoteData.loadQuote(self.quoteid)) {
        self.quote = QuoteData.openquote;
        self.quoteItems = [].concat(self.quote.items);
        self.quotelen = self.quoteItems.length;
    } else {
        self.quote = QuoteData.newQuote();
    }
    self.isLoading = false;
    self.notFound = false;
    self.editIndex = -1;
    self.viewerror = '';

    self.loadSku = function (e, field) {
        if (field.value !== '') {
            resetValidation(self.quoteFields);
            self.isLoading = true;
            self.notFound = false;
            var postcode = SettingsData.storepostcode.replace(' ', '');
            m.request('https://hook.io/jfdesrochers/splslookup/' + field.value + '/' + postcode).then(function (value) {
                self.quoteFields['desc'].value = value.description;
                self.quoteFields['price'].value = value.listPrice;
                self.quoteFields['rebatevalue'].value = value.savings || 0;
                self.quoteFields['rebatetype'].value = '$';
                self.isLoading = false;
                var adb = document.getElementById('addbtn');
                if (adb) {
                    adb.focus();
                };
            }).catch(function (err) {
                self.isLoading = false;
                self.notFound = true;
                setTimeout(function () {
                    self.notFound = false;
                }, 2000);
                var dsc = document.getElementById('desc');
                if (dsc) {
                    dsc.disabled = false;
                    dsc.focus();
                };
                console.error(err);
            })
        }
    }

    self.lookupAssociate = function (e, field) {
        if (field.value !== '') {
            var assname = localStorage.getItem(field.value);
            if (assname) {
                self.fieldSet['assname'].value = assname;
                var qd = document.getElementById('quotedate');
                qd && qd.focus();
            }
        }
        self.saveFields({saveAssociate: true})();
    }

    self.lookupCustomer = function (e, field) {
        if (field.value !== '') {
            var custdata = localStorage.getItem(field.value.replace(/\D/g, ''));
            if (custdata) {
                custdata = JSON.parse(custdata);
                for (var i in custdata) {
                    self.fieldSet[i].value = custdata[i];
                }
                var qt = document.getElementById('qty');
                qt && qt.focus();
            }
        }
        self.saveFields({saveCustomer: true})();
    }

    self.setEditItem = function (idx) {
        return function (e) {
            e.preventDefault();
            self.editIndex = idx;
            deserializeFieldSet(self.quoteItems[idx], self.quoteFields);
            var qty = document.getElementById('qty');
            if (qty) {
                qty.focus();
            }
        }
    }

    self.addQuoteItem = function (e) {
        e.preventDefault();
        if (validateFieldSet(self.quoteFields)) {
            if (self.editIndex > -1) {
                self.quoteItems[self.editIndex] = serializeFieldSet(self.quoteFields);
            } else {
                self.quoteItems.push(serializeFieldSet(self.quoteFields));
                self.quotelen += 1;
            }
            self.saveFields()();
            self.resetFields(e);
        }
    }

    self.deleteItem = function (e) {
        if (self.editIndex > -1) {
            self.quoteItems.splice(self.editIndex, 1);
            self.quotelen -= 1;
            self.saveFields()();
            self.resetFields(e);
        }
    }

    self.resetFields = function (e) {
        e.preventDefault();
        Object.keys(self.quoteFields).forEach(function (o) {
            self.quoteFields[o].value = '';
            self.quoteFields[o].valid = null;
        });
        self.quoteFields['qty'].value = '1';
        self.quoteFields['rebatetype'].value = '$';
        self.editIndex = -1;
        var qty = document.getElementById('qty');
        if (qty) {
            qty.focus();
        }
    }

    self.saveFields = function (options) {
        options = options || {};
        return function() {
            var f = serializeFieldSet(self.fieldSet);
            self.quote.associate.name = f.assname;
            self.quote.associate.number = f.assno;
            self.quote.customer.name = f.custname;
            self.quote.customer.company = f.custbusiness;
            self.quote.customer.addr = f.custaddr;
            self.quote.customer.city = f.custcity;
            self.quote.customer.province = f.custprovince;
            self.quote.customer.postcode = f.custpostcode;
            self.quote.customer.phone = f.custphone;
            self.quote.customer.email = f.custemail;
            /* self.quote.items.header = ['Qté', 'No d\'UGS', 'Description', 'Prix Unitaire', 'Prix Total'];
            self.quote.items.rows = self.quoteItems.map(function (o) {
                var price = (o.rebatetype === '$' ?
                (parseFloat(o.price) - parseFloat(o.rebatevalue)).toFixed(2) :
                (parseFloat(o.price) - (parseFloat(o.price) * (parseFloat(o.rebatevalue) / 100))).toFixed(2));
                return [o.qty, o.sku, o.desc, String(price) + '&nbsp;$', String((price * parseInt(o.qty)).toFixed(2)) + '&nbsp;$'];
            }); */
            self.quote.items = [].concat(self.quoteItems);
            self.quote.notes = f.quotenotes;
            QuoteData.saveQuote();
            if (options.saveAssociate && f.assname !== '' && f.assno !== '') {
                localStorage.setItem(f.assno, f.assname);
            }
            if (options.saveCustomer && f.custname !== '' && f.custbusiness !== '' && f.custaddr !== '' && f.custcity !== '' && f.custprovince !== '' && f.custpostcode !== '' && f.custphone !== '' && f.custemail !== '') {
                var phone = f.custphone.replace(/\D/g, '');
                localStorage.setItem(phone, JSON.stringify({
                    custname: f.custname,
                    custbusiness: f.custbusiness,
                    custaddr: f.custaddr,
                    custcity: f.custcity,
                    custprovince: f.custprovince,
                    custpostcode: f.custpostcode,
                    custphone: f.custphone,
                    custemail: f.custemail
                }));
            }
        }
    }

    self.viewquote = function () {
        var valid = validateFieldSet(self.fieldSet);
        self.viewerror = '';
        if (valid) {
            if (self.quotelen > 0 && self.quotelen <= 18) {
                var quoteview = Object.assign({}, self.quote)
                quoteview.items = {};
                quoteview.items.header = ['Qté', 'No d\'UGS', 'Description', 'Prix Unitaire', 'Prix Total'];
                var subtotal = 0;
                quoteview.items.rows = self.quoteItems.map(function (o) {
                    var price = (o.rebatetype === '$' ?
                    (parseFloat(o.price) - parseFloat(o.rebatevalue)) :
                    (parseFloat(o.price) - (parseFloat(o.price) * (parseFloat(o.rebatevalue) / 100))));
                    var total = (price * parseInt(o.qty));
                    subtotal += total;
                    return [o.qty, o.sku, o.desc, String(price.toFixed(2)) + ' $', String(total.toFixed(2)) + ' $'];
                });
                var rowtotal = 18 - self.quotelen;
                for (var i=0; i<rowtotal; i++) {
                    quoteview.items.rows.push(['','','','','']);
                };
                var tps = (subtotal * SettingsData.tps / 100);
                var tvq = (subtotal * SettingsData.tvq / 100);
                quoteview.items.rows.push(['', '', '', 'Total partiel', String(subtotal.toFixed(2)) + ' $']);
                quoteview.items.rows.push(['', '', '', 'TPS', String(tps.toFixed(2)) + ' $']);
                quoteview.items.rows.push(['', '', '', 'TVQ', String(tvq.toFixed(2)) + ' $']);
                quoteview.items.rows.push(['', '', 'Ceci n\'est pas une facture', 'Total', String((subtotal + tps + tvq).toFixed(2)) + ' $']);
                window.open('pdfview.html#' + createPDF(quoteview));
            } else {
                self.viewerror = 'Votre devis doit contenir un minimum de 1 et un maximum de 18 items!'
            }
        } else {
            self.viewerror = 'Certains de vos champs contiennent des valeurs invalides! Assurez-vous de bien remplir tous les champs avant de continuer!'
        }
    }
}

NewQuote.view = function () {
    var self = this;
    return [
        QuoteHeader('newquote', self.quoteid),
        m('div.contents', [
            m('section.section', [
                m('.container', [
                    m('.columns', [
                        m('.column', [
                            m('h1.title', self.quoteid ? 'Modifier la soumission' : 'Créer une nouvelle soumission'),
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
                                defaultValue: self.quote.associate.number,
                                regEx: /^\d{7}$/,
                                helpText: 'Entrez votre numéro d\'associé. (ex.: 1234567 ou 0004567)',
                                errorText: 'Entrez un numéro d\'associé valide. (ex.: 1234567 ou 0004567)',
                                autofocus: true,
                                onChange: self.lookupAssociate
                            }),
                            m(InputField, {
                                name: 'assname',
                                label: 'Votre nom',
                                fieldSet: self.fieldSet,
                                defaultValue: self.quote.associate.name,
                                regEx: /^.+$/,
                                filter: titleCase.convert,
                                helpText: 'Entrez votre nom complet (prénom et nom)',
                                errorText: 'Entrez un nom valide.',
                                onChange: self.saveFields({saveAssociate: true})
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
                                errorText: 'Entrez une date valide (jj/mm/aaaa).',
                                onChange: self.saveFields()
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
                                errorText: 'Entrez une date valide (jj/mm/aaaa). La date doit être supérieure à la date de soumission.',
                                onChange: self.saveFields()
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
                                        defaultValue: self.quote.customer.phone,
                                        regEx: /^[(]?(\d{3})[)]?\s?-?\s?(\d{3})\s?-?\s?(\d{4})$/,
                                        filter: '($1) $2-$3',
                                        helpText: 'Entrez le numéro de téléphone de votre client.',
                                        errorText: 'Entrez un numéro de téléphone valide. (ex.: (555) 555-2345)',
                                        onChange: self.lookupCustomer
                                    })
                                ]),
                                m('.column', [
                                    m(InputField, {
                                        name: 'custemail',
                                        label: 'Adresse courriel du client',
                                        fieldSet: self.fieldSet,
                                        defaultValue: self.quote.customer.email,
                                        regEx: /^([A-Z|a-z|0-9](\.|_){0,1})+[A-Z|a-z|0-9]\@([A-Z|a-z|0-9])+((\.){0,1}[A-Z|a-z|0-9]){2}\.[a-z]{2,3}$/,
                                        helpText: 'Entrez l\'adresse courriel de votre client.',
                                        errorText: 'Entrez une adresse courriel valide. (ex.: nom@entreprise.com)',
                                        onChange: self.saveFields({saveCustomer: true})
                                    })
                                ]),
                            ]),
                            m(InputField, {
                                name: 'custname',
                                label: 'Nom de la personne-ressource',
                                fieldSet: self.fieldSet,
                                defaultValue: self.quote.customer.name,
                                regEx: /^.+$/,
                                filter: titleCase.convert,
                                helpText: 'Entrez le nom complet (prénom et nom)',
                                errorText: 'Entrez un nom valide.',
                                onChange: self.saveFields({saveCustomer: true})
                            }),
                            m(InputField, {
                                name: 'custbusiness',
                                label: 'Nom de l\'entreprise',
                                fieldSet: self.fieldSet,
                                defaultValue: self.quote.customer.company,
                                regEx: /^.+$/,
                                filter: function (s) {
                                    if (/[A-Z]+/.test(s)) {
                                        return s
                                    } else {
                                        return titleCase.convert(s)
                                    }
                                },
                                helpText: 'Entrez le nom de l\'entreprise.',
                                errorText: 'Entrez un nom valide.',
                                onChange: self.saveFields({saveCustomer: true})
                            })
                        ]),
                        m('.column', [
                            m(InputField, {
                                name: 'custaddr',
                                label: 'Adresse du client',
                                fieldSet: self.fieldSet,
                                defaultValue: self.quote.customer.addr,
                                regEx: /^\d+\s?.+$/,
                                filter: titleCase.convert,
                                helpText: 'Entrez l\'adresse de votre client.',
                                errorText: 'Entrez une adresse valide.',
                                onChange: self.saveFields({saveCustomer: true})
                            }),
                            m('.columns', [
                                m('.column', [
                                    m(InputField, {
                                        name: 'custcity',
                                        label: 'Ville du client',
                                        fieldSet: self.fieldSet,
                                        defaultValue: self.quote.customer.city,
                                        regEx: /^.+$/,
                                        filter: titleCase.convert,
                                        helpText: 'Entrez la ville de votre client.',
                                        errorText: 'Entrez une ville valide.',
                                        onChange: self.saveFields({saveCustomer: true})
                                    })
                                ]),
                                m('.column', [
                                    m(SelectField, {
                                        name: 'custprovince',
                                        label: 'Province du client',
                                        fieldSet: self.fieldSet, 
                                        defaultValue: self.quote.customer.province || 'QC',
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
                                        ],
                                        onChange: self.saveFields({saveCustomer: true})
                                    })
                                ])
                            ]),
                            m(InputField, {
                                name: 'custpostcode',
                                label: 'Code postal du client',
                                fieldSet: self.fieldSet,
                                defaultValue: self.quote.customer.postcode,
                                regEx: /^([ABCEGHJ-NPRSTVXY]{1}\d{1}[A-Z]{1})\s?(\d{1}[A-Z]{1}\d{1})$/i,
                                filter: function (s, rEx) {
                                    return s.replace(rEx, '$1 $2').toUpperCase();
                                },
                                helpText: 'Entrez le code postal de votre client (ex.: H0H 0H0).',
                                errorText: 'Entrez un code postal valide (ex.: H0H 0H0).',
                                onChange: self.saveFields({saveCustomer: true})
                            }),
                        ])
                    ])
                ])
            ]),
            m('section.section.is-small', [
                m('.container', [
                    m('h1.title.is-4', '3. Items de votre soumission'),
                    self.quotelen < 18 ? m('h2.subtitle.is-6', 'Vous pouvez ajouter jusqu\'à ' + (18 - self.quotelen) + (self.quotelen === 17 ? ' item' : ' items') + ' à votre soumission ci-dessous.') :
                    m('h2.subtitle.is-6.has-text-danger', 'Vous ne pouvez pas ajouter d\'items à votre soumission.'),
                    m('table#quoteitems.table.is-fullwidth.is-narrow', [
                        m('thead', m('tr', [
                            m('th', m('abbr', {title: 'Quantité'}, 'Qté')),
                            m('th', 'UGS'),
                            m('th', 'Description'),
                            m('th', m('abbr', {title: 'Prix unitaire'}, 'Prix')),
                            m('th', 'Rabais'),
                            m('th', 'Total'),
                            m('th', '')
                        ])),
                        m('tbody', self.quoteItems.length > 0 ? self.quoteItems.map(function (o, i) {
                            return m('tr' + (self.editIndex === i ? '.is-selected' : ''), [
                                m('td', o.qty),
                                m('td', o.sku),
                                m('td', o.desc),
                                m('td', m.trust(o.price + '&nbsp;$')),
                                m('td', m.trust((o.rebatetype === '$' ? o.rebatevalue : String((parseFloat(o.price) * (parseFloat(o.rebatevalue) / 100)).toFixed(2))) + '&nbsp;$')),
                                m('td', m.trust((o.rebatetype === '$' ?
                                String(((parseFloat(o.price) - parseFloat(o.rebatevalue)) * parseInt(o.qty)).toFixed(2)) :
                                String(((parseFloat(o.price) - (parseFloat(o.price) * (parseFloat(o.rebatevalue) / 100))) * parseInt(o.qty)).toFixed(2))) + '&nbsp;$')),
                                m('td', m('a.icon', {onclick: self.setEditItem(i)}, m('i.fa.fa-lg.fa-pencil')))
                            ])
                        }) : m('tr', m('td', {colspan: 8}, 'Aucun item à afficher.')))
                    ]),
                    m('.card', [
                        m('header.card-header', m('p.card-header-title', self.editIndex > -1 ? 'Modifier un item' : 'Ajouter un item')),
                        m('.card-content', [
                            m('.columns.is-multiline', [
                                m('.column.is-one-quarter', m(InputField, {
                                    name: 'qty',
                                    label: 'Quantité',
                                    fieldSet: self.quoteFields,
                                    defaultValue: '1',
                                    regEx: /^[1-9]\d*$/,
                                    errorText: 'Entrez une quantité valide (> 0).',
                                    disabled: self.isLoading
                                })),
                                m('.column.is-one-quarter', m(InputField, {
                                    name: 'sku',
                                    label: 'UGS',
                                    fieldSet: self.quoteFields,
                                    defaultValue: '',
                                    regEx: /^.+$/,
                                    onChange: self.loadSku,
                                    errorText: 'Entrez une UGS valide.',
                                    helpText: self.notFound ? 'Item non trouvé!' : self.isLoading ? 'Chargement de l\'item...' : '',
                                    icon: self.isLoading ? 'fa fa-cog fa-spin' : 'fa fa-search',
                                    disabled: self.isLoading
                                })),
                                m('.column.is-half', m(InputField, {
                                    name: 'desc',
                                    label: 'Description',
                                    fieldSet: self.quoteFields,
                                    defaultValue: '',
                                    regEx: /^.+$/,
                                    errorText: 'Entrez une description valide.',
                                    disabled: self.isLoading
                                })),
                                m('.column.is-one-quarter', m(InputField, {
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
                                    errorText: 'Entrez un prix valide. (ex.: 25.00)',
                                    disabled: self.isLoading
                                })),
                                m('.column.is-one-quarter', [
                                    m(InputField, {
                                        manualGrouping: [
                                            m(SelectField, {
                                                manualGrouping: true,
                                                name: 'rebatetype',
                                                fieldSet: self.quoteFields, 
                                                defaultValue: '$',
                                                options: [
                                                    {value: '$', label: '$'},
                                                    {value: '%', label: '%'}
                                                ],
                                                disabled: self.isLoading
                                            })
                                        ],
                                        name: 'rebatevalue',
                                        label: 'Rabais',
                                        fieldSet: self.quoteFields,
                                        defaultValue: '',
                                        fullwidth: true,
                                        regEx: /^(\d+)?(?:[\,|\.](\d{1,2}))?$/,
                                        filter: function (v, r) {
                                            var m = r.exec(v);
                                            if (!m[1]) return '0.00';
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
                                        errorText: 'Entrez un rabais valide. (ex.: 25.00)',
                                        disabled: self.isLoading
                                    })
                                ])
                            ])
                        ]),
                        m('footer.card-footer', [
                            (self.quotelen <= 18 || self.editIndex > -1) ? m('button#addbtn.button.is-white.card-footer-item', {onclick: self.addQuoteItem}, self.editIndex > -1 ? 'Sauvegarder' : 'Ajouter') : '',
                            self.editIndex > -1 ? m('button#resetbtn.button.is-danger.card-footer-item', {onclick: self.deleteItem}, 'Supprimer') : '',
                            m('button#resetbtn.button.is-white.card-footer-item', {onclick: self.resetFields}, self.editIndex > -1 ? 'Annuler' : 'Réinitialiser')
                        ])
                    ])
                ])
            ]),
            m('section.section.is-small', [
                m('.container', [
                    m('h1.title.is-4', '4. Notes sur la soumission'),
                    m('h2.subtitle.is-6', 'Si vous le désirez, vous pouvez inclure des notes dans votre devis.'),
                    m(InputField, {
                        name: 'quotenotes',
                        label: 'Notes (optionnel)',
                        fieldSet: self.fieldSet,
                        defaultValue: self.quote.notes,
                        regEx: /^.*$/i,
                        onChange: self.saveFields()
                    })
                ])
            ]),
            m('section.section.is-not-spaced-top', [
                m('.container.notification', [
                    self.viewerror ? m('.notification.is-danger', self.viewerror) : '',
                    m('.field.is-grouped', [
                        m('.control', m('button.button.is-primary', {onclick: self.viewquote}, 'Visualiser la soumission')),
                        m('.control', m('a.button[href="/"]', {oncreate: m.route.link}, 'Sauvegarder et Fermer'))
                    ])
                ])
            ])
        ]),
        QuoteFooter('newquote', self.quoteid)
    ];
}

var ImportQuote = {}

ImportQuote.view = function () {
    return [
        QuoteHeader('importquote'),
        m('div.contents', [
            m('section.section', [
                m('.container', [
                    m('button.button.is-info', {onclick: function () {
                        window.open('pdfview.html#' + createPDF());
                    }}, 'Test PDF')
                ])
            ])
        ]),
        QuoteFooter('importquote')
    ];
}

var Settings = {}

Settings.oninit = function () {
    var self = this;
    self.fieldSet = {};
    self.save = function () {
        var valid = validateFieldSet(self.fieldSet);
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
        m('div.contents', [
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
                            })
                        ])
                    ]),
                    m('.field.is-grouped.notification', [
                        m('.control', m('button.button.is-primary', {onclick: self.save}, 'Sauvegarder')),
                        m('.control', m('a.button[href="/"]', {oncreate: m.route.link}, 'Annuler'))
                    ])
                ])
            ])
        ]),
        QuoteFooter('settings')
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
        '/edit/:key': ifSettings(NewQuote),
        '/load': ifSettings(ImportQuote),
        '/settings': Settings
    });
}