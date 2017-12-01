var jsPDF = window.jsPDF;

// Inspired by autoTableText
jsPDF.API.textEx = function (text, x, y, styles) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        console.error('The x and y parameters are required. Missing for the text: ', text);
    }
    if (!styles) styles = {};
    var k = this.internal.scaleFactor;
    var fontSize = this.internal.getFontSize() / k;
    var splitRegex = /\r\n|\r|\n/g;
    var splitText = null;
    var lineCount = 1;
    var lineHeight = styles.lineheight || 1.15;
    splitText = typeof text === 'string' ? text.split(splitRegex) : text;
    lineCount = splitText.length || 1;
    // Align the top
    y += fontSize * (2 - lineHeight);
    if (styles.valign === 'middle')
        y -= (lineCount / 2) * fontSize * lineHeight;
    else if (styles.valign === 'bottom')
        y -= lineCount * fontSize * lineHeight;
    if (styles.halign === 'center' || styles.halign === 'right') {
        var alignSize = fontSize;
        if (styles.halign === 'center')
            alignSize *= 0.5;
        if (lineCount >= 1) {
            for (var iLine = 0; iLine < splitText.length; iLine++) {
                this.text(splitText[iLine], x - this.getStringUnitWidth(splitText[iLine]) * alignSize, y);
                y += fontSize * lineHeight;
            }
            return this;
        }
        x -= this.getStringUnitWidth(text) * alignSize;
    }
    if (lineCount >= 1) {
        for (var iLine = 0; iLine < splitText.length; iLine++) {
            this.text(splitText[iLine], x, y);
            y += fontSize * lineHeight;
        }
        return this;
    }
    this.text(text, x, y);
    return this;
};

var logo = {
    src: 'data:image/png;base64,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',
    w: 156,
    h: 48
}
var terms = [
    "1. Produits et services. Conformément aux modalités énoncées aux présentes, le client peut acheter et Staples fournira les produits et services aux prix stipulés dans le devis de Staples/Bureau en Gros, à moins que les parties en aient convenu autrement par écrit.",
    "2. Livraison standard. Staples/Bureau en Gros doit déployer des efforts commercialement raisonnables pour expédier les produits commandés par le client avant 16 h, heure locale, dans un délai d’un (1) jour ouvrable après l’acceptation d’un bon de commande, sauf pour les produits de commande spéciale, les meubles, les produits en rupture de stock ou les livraisons demandées en dehors des zones de distribution précisées de Staples/Bureau en Gros. Les commandes de produits en rupture de stock resteront ouvertes et seront livrées dès que les produits seront disponibles, à moins d’instructions contraires du client avant la livraison. Le client reconnaît et accepte que Staples/Bureau en Gros puisse fournir des produits de substitution de temps à autre. Tous les autres produits seront livrés selon un calendrier de livraison mutuellement acceptable. Le ou les représentants autorisés du client dans chaque établissement devront signer des documents écrits ou électroniques ou des dispositifs électroniques fournis par Staples/Bureau en Gros au moment de la livraison des produits. Le client accepte que Staples/Bureau en Gros puisse laisser des produits au client s’il obtient la signature d’un autre employé ou s’il ne peut obtenir aucune signature au moment de la livraison. Les livraisons normales au Canada sont aux frais de Staples/Bureau en Gros. Les livraisons accélérées, les livraisons électroniques ou les livraisons en dehors du réseau de distribution de Staples/Bureau en Gros peuvent entraîner des frais supplémentaires.",
    "3. (a) Titre, risque de perte et garantie. Le titre et le risque de perte relatifs aux produits sont transférés au client dès le moment où les produits sont livrés à ce dernier. Staples/Bureau en Gros garantit qu’elle transmettra au client toutes les garanties du fabricant pour tous les produits vendus au client à la place de toutes les autres garanties, expresses ou implicites, de Staples/Bureau en Gros. CES GARANTIES SONT EXCLUSIVES ET REMPLACENT TOUTES LES AUTRES GARANTIES, VERBALES OU ÉCRITES, EXPLICITES OU IMPLICITES. STAPLES/BUREAU EN GROS EXCLUT EXPRESSÉMENT TOUTE GARANTIE IMPLICITE, Y COMPRIS, SANS LIMITATION, TOUTE GARANTIE IMPLICITE DE QUALITÉ MARCHANDE, D’ADÉQUATION À UN USAGE PARTICULIER, OU TOUTE AUTRE GARANTIE LÉGALE OU EN VERTU DE LA COMMON LAW.",
    "(b) Garantie du client. Le client déclare et garantit que le client (i) suivra toutes les instructions fournies par Staples/Bureau en Gros concernant l’utilisation, la dilution ou l’installation des produits d’entretien et (ii) utilisera et éliminera les produits de l’installation conformément à l’ensemble des lois et règlements fédéraux, provinciaux et locaux applicables, y compris les règles et réglementations environnementales. Le nom respect de cette section par le client entraînera l’annulation de toute les garanties liées aux produits d’entretien.",
    "4. Résiliation. L’une ou l’autre des parties peut résilier la présente entente, pour quelque raison que ce soit pendant la durée de celle-ci, moyennant un avis écrit à l’autre partie au moins trente (30) jours avant la date d’effet de la résiliation. Si l’une ou l’autre des parties contrevient à la présente entente, la partie qui n’a pas commis le manquement doit donner à la partie contrevenante un avis écrit concernant ce manquement et un délai de trente (30) jours pour le corriger. Si ce manquement n’est pas corrigé dans un délai de trente (30) jours, la présente entente peut être résiliée par la partie non contrevenante. L’une ou l’autre des parties peut également résilier immédiatement la présente entente moyennant un préavis écrit à l’autre partie si cette partie devient insolvable, effectue une cession générale au profit de ses créanciers, permet la nomination d’un séquestre pour son entreprise ou ses biens, entame une procédure en vertu de toute loi sur la faillite ou l’insolvabilité ou si elle y est assujettie ou si elle a liquidé ou dissous ses affaires. Nonobstant la résiliation de la présente entente en vertu de cet article 4, chaque partie veillera au respect de ses obligations en vertu des présentes jusqu’à la date de résiliation, y compris, sans s’y limiter, la responsabilité du client de payer tous les produits et services qui ont été fournis ou commandés en vertu de la présente entente.",
    "5. Retours. Staples/Bureau en Gros acceptera les retours de produits en stock conformément aux modalités de sa politique sur les retours alors en vigueur publiée sur le site www.staples.ca/www.bureauengros.com (une copie de celle-ci sera mise à la disposition du client sur demande).",
    "6. Paiement. Sauf si Staples/Bureau en Gros en convient autrement par écrit, le client paiera les produits et services intégralement au point de vente. Les produits et services seront facturés par Staples/Bureau en Gros aux clients qui peuvent prétendre à l’ouverture d’un compte de crédit auprès de Staples/Bureau en Gros (les « clients titulaires d’un compte ») et qui y sont admissibles, comme déterminé à la seule discrétion de Staples/Bureau en Gros.  Les clients titulaires d’un compte verseront tous les paiements de factures, y compris toutes les taxes sur les achats, à Staples/Bureau en Gros dans un délai de trente (30) jours suivant la date de réception de la facture, sauf si Staples/Bureau en Gros en convient autrement par écrit.",
    "7. Confidentialité. Les parties conviennent de ne divulguer aucun renseignement confidentiel fourni par l’autre partie à moins d’y être contraintes par la loi. Aux fins des présentes, de telles informations confidentielles incluent, mais sans s’y limiter, la liste des clients des parties, les prix, les habitudes d’achat, l’information de nature financière fournie par l’autre partie, peu importe si ces informations sont identifies ou signalées comme étant confidentielles. Si une partie croit qu’elle est obligée de divulguer des renseignements confidentiels reçus de l’autre partie en raison d’une assignation à produire des pièces ou de toute autre procédure légale, elle informera sans délai et par écrit l’autre partie avant de procéder à toute divulgation.",
    "8. Limitation de responsabilité.  La responsabilité globale de Staples/Bureau en Gros à l’égard des dommages directs en vertu de la présente entente ne peut excéder le prix total payé par le client à Staples/Bureau en Gros en vertu de la présente entente. Aucune des parties ne peut être tenue responsable, envers l’autre partie, de dommages particuliers, indirects, consécutifs ou punitifs quelconques, même si la possibilité en est évoquée.",
    "9. Force majeure. Les parties ne sont pas responsables des délais ou autres défauts d’exécution résultant directement ou partiellement de cas de force majeure, de conflits de travail, de pénuries, de l’incapacité de se procurer un produit, des fournitures ou des matières premières, de mauvaises conditions météorologiques, d’actes posés par des sous-traitants, d’une interruption des services publics, d’actes de toute unité ou agence gouvernementale, ou de toute autre circonstance ou cause imprévisible échappant au contrôle de l’une ou l’autre des parties dans le cadre de leurs activités respectives.",
    "10. Cession. Aucune partie ne peut céder la présente entente sans le consentement écrit préalable de l’autre partie. Toutefois, Staples/Bureau en Gros peut céder la présente entente à toute société affiliée, filiale ou entité qu’elle contrôle. Toute partie qui hérite des obligations stipulées dans la présente entente est liée par l’ensemble des conditions que celle-ci contient. Toute cession contrevenant aux présentes sera non avenue.",
    "11. Droit applicable. Les dispositions de la présente entente sont régies par les lois de la province de l’Ontario, à l’exclusion des dispositions relatives aux conflits de lois. Les parties, par les présentes, excluent expressément l’application de la Convention des Nations Unies sur les contrats de vente internationale de marchandises.  Tout recours découlant de la présente entente doit être déposé devant les cours provinciales ou fédérales situées dans la province de l’Ontario ayant compétence. Les parties reconnaissent la juridiction personnelle et exclusive de ces tribunaux et renoncent par le fait même à toute défense reposant sur le forum, la compétence ou l’incompétence du tribunal, ou toute autre question semblable.",
    "12. Modalités. Les présentes modalités constituent l’entente indivisible entre les parties en ce qui concerne précisément les présentes. Pour être pleinement effectives, les modifications doivent être présentées par écrit, signées par un représentant autorisé des deux parties et jointes aux présentes. Tous les bons de commande soumis à Staples/Bureau en Gros seront régis par les modalités énoncées aux présentes. Toute disposition prévue dans les factures, les relevés de facturation, les formulaires de reconnaissance ou d’autres documents similaires qui contredit les dispositions de la présente entente est réputée inopérante à moins qu’elle ait été entérinée par écrit par Staples/Bureau en Gros. Toute déclaration voulant que l’acceptation du client soit conditionnelle à l’acquiescement par Staples/Bureau en Gros de conditions supplémentaires ou différentes est inopérante et exclue par les présentes.  La renonciation à quelque droit ou recours prévus aux présentes et relatifs à tout événement ou occurrence ayant eu lieu qu’une fois ne doit pas être interprétée comme une renonciation à ce droit ou ce recours pour un autre événement ou une occurrence passé ou futur. Si une disposition de la présente entente venait à être déclarée illégale ou bien inapplicable par une cour ou tout autre tribunal administratif ou judiciaire, cette disposition est annulée et l’ensemble des autres dispositions de l’entente demeurent pleinement en vigueur. Sauf disposition contraire énoncée dans les présentes, les droits et obligations de toute partie qui par leur nature se prolongent après l’expiration ou la résiliation du présent contrat-cadre demeureront pleinement en vigueur nonobstant l’expiration ou la résiliation du présent contrat-cadre.",
    "13. Devis. Le devis de Staples/Bureau en Gros n’inclut pas toutes les taxes applicables, à moins que les parties en aient convenu autrement par écrit. Le devis de Staples/Bureau en Gros expire trente (30) jours après la date du devis et est soumis à la confirmation de Staples/Bureau en Gros sur réception de tout bon de commande de la part du client. À moins que les parties en aient convenu autrement par écrit, les prix de Staples/Bureau en Gros peuvent changer moyennant un avis écrit au client. N’importe lequel des actes suivants par le client constitue une acceptation du devis et de toutes les modalités susmentionnées : signer et retourner une copie du devis; la livraison de tout produit ou service commandé; informer Staples/Bureau en Gros de toute forme de commencement d’exécution; ou retourner la propre forme d’acceptation ou de bon d’achat du client."
]

var pageWidth = 612,
    pageHeight = 792,
    margin = 36,
    lineHeight = 1.15,
    fontSize = 10;

var data = {
    id: '13917113001',
    associate: {
        number: '1256614',
        name: 'Jean-François Desrochers'
    },
    store: {
        no: '139',
        addr: '565 Boul. St-Joseph',
        city: 'Drummondville, QC',
        postcode: 'J2C 2B6',
        phone: '(819) 474-3147'
    },
    customer: {
        name: 'Nicole Gagnon',
        company: 'Cégep de Drummondville',
        addr: '960 rue St-Georges',
        city: 'Drummondville, QC',
        postcode: 'J2C 6A2',
        phone: '(819) 478-4671'
    }
}

var createPDF = function () {
    var doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: [pageWidth, pageHeight]
    });
    doc.setProperties({title: 'Soumission ' + data.id, author: 'Bureau en Gros #' + data.store.no, creator: 'Soumissions par J-F Desrochers'});
    doc.setFont('arial');

    // Page 1 - Soumission

    // Heading
    var y = margin;
    doc.addImage(logo.src, 'PNG', margin, y, logo.w, logo.h);
    fontSize = 20;
    doc.setFontSize(fontSize);
    doc.setFontStyle('italic');
    doc.textEx('Devis', pageWidth / 2, y, {halign: 'center'});
    var fieldWidth = 90;
    fontSize = 11;
    doc.setFontSize(fontSize);
    doc.setFontStyle('normal');
    doc.textEx('No de référence : ', pageWidth - margin - fieldWidth, y, {halign: 'right'});
    doc.line(pageWidth - margin - fieldWidth, y + fontSize, pageWidth - margin, y + fontSize);
    doc.setFontSize(9.5);
    doc.setTextColor(0, 112, 192);
    doc.textEx(data.id, pageWidth - margin - fieldWidth / 2, y, {halign: 'center'});
    doc.setFontSize(fontSize);
    doc.setTextColor(0);
    y += fontSize * 1.5;
    doc.textEx('Date du devis : ', pageWidth - margin - fieldWidth, y, {halign: 'right'});
    doc.line(pageWidth - margin - fieldWidth, y + fontSize, pageWidth - margin, y + fontSize);
    doc.setTextColor(0, 112, 192);
    doc.textEx('30/11/2017', pageWidth - margin - fieldWidth / 2, y, {halign: 'center'});
    doc.setTextColor(0);
    y += fontSize * 1.5;
    doc.setFontStyle('bold')
    doc.textEx('Date d\'expiration : ', pageWidth - margin - fieldWidth, y, {halign: 'right'});
    doc.setFontStyle('normal');
    doc.line(pageWidth - margin - fieldWidth, y + fontSize, pageWidth - margin, y + fontSize);
    doc.textEx('30/01/2018', pageWidth - margin - fieldWidth / 2, y, {halign: 'center'});
    fontSize = 9;
    doc.setFontSize(fontSize);
    y += fontSize * 1.5;
    doc.textEx('jj/mm/aaaa', pageWidth - margin - fieldWidth / 2, y, {halign: 'center'});

    // Contacts
    fontSize = 11;
    doc.setFontSize(fontSize);
    y = margin + logo.h + fontSize;
    doc.textEx('Destinataire :', margin * 2, y);
    doc.textEx('Préparé par :', pageWidth / 2, y);
    y += fontSize * 1.5;
    doc.setTextColor(0, 112, 192);
    lineHeight = 1.3;
    doc.textEx([data.customer.name, data.customer.company, data.customer.addr, data.customer.city, data.customer.postcode + '        ' + data.customer.phone], margin * 2, y, {lineheight: lineHeight});
    doc.textEx([data.associate.name, 'Bureau en Gros #' + data.store.no, data.store.addr, data.store.city, data.store.postcode + '        ' + data.store.phone], pageWidth / 2, y, {lineheight: lineHeight});
    y += fontSize * lineHeight * 5 + fontSize;
    doc.setTextColor(0);
    lineHeight = 1.15;
    
    // Page 2 - Modalités
    doc.addPage();
    y = margin;
    fontSize = 8;
    doc.setFontSize(fontSize);
    doc.setFontStyle('bold');
    doc.textEx(['STAPLES CANADA INC./BUREAU EN GROS (« Staples/Bureau en Gros »)', 'MODALITÉS'], margin, y);
    y += fontSize * 3 * lineHeight;
    fontSize = 7;
    doc.setFontSize(fontSize);
    doc.setFontStyle('normal');
    for (var i = 0; i < terms.length; i++) {
        var splitText = doc.splitTextToSize(terms[i], pageWidth - margin * 2);
        doc.textEx(splitText, margin, y);
        y += splitText.length * fontSize * lineHeight + fontSize * lineHeight;
    }
    return doc.output('datauristring');
}