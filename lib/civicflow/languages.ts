import type { ChatReply } from "./types";

export const languageCodes = { LANG_EN: "en", LANG_AF: "af", LANG_ZU: "zu", LANG_NR: "nr", LANG_ST: "st" } as const;
export const languageNames: Record<string, string> = { en: "English", af: "Afrikaans", zu: "isiZulu", nr: "isiNdebele", st: "Sesotho" };
type Translation = [string, string, string, string];
// Each entry preserves the English source and the same numbered interpolation slots.
// Draft municipal wording: keep translations versioned and review before public launch.
export const translations: Record<string, Translation> = {
  "Main menu": ["Hoofkieslys", "Imenyu enkulu", "Imenyu ekulu", "Lenane le leholo"],
  "Continue my application": ["Gaan voort met my aansoek", "Qhubeka nesicelo sami", "Ragela phambili nesibawo sami", "Tswela pele ka kopo ya ka"],
  "Recommendation": ["Aanbeveling", "Isincomo", "Isiphakamiso", "Kgothaletso"],
  "Under review": ["Onder hersiening", "Kuyabuyekezwa", "Kuyabuyekezwa", "E a hlahlojwa"],
  "Declined": ["Afgekeur", "Kwenqatshiwe", "Kwaliwe", "E hanwe"],
  "Approved": ["Goedgekeur", "Kuvunyelwe", "Kuvunyelwe", "E amohetswe"],
  "Information required": ["Inligting nodig", "Kudingeka imininingwane", "Kufuneka ilwazi", "Tlhahisoleseding e hlokeha"],
  "Site visit required": ["Terreinbesoek nodig", "Kudingeka ukuvakashelwa kwendawo", "Kufuneka ukuvakatjhelwa kwendawo", "Ketelo ya sebaka e hlokeha"],
  "This is a recommendation, not a final municipal decision. An authorised official must still decide.": ["Dit is ’n aanbeveling, nie ’n finale munisipale besluit nie. ’n Gemagtigde beampte moet nog besluit.", "Lesi yisincomo, akusona isinqumo sokugcina sikamasipala. Isikhulu esigunyaziwe kusafanele sinqume.", "Lesi siphakamiso, akusiso isiqunto sokugcina sikamasipala. Isiphathimandla esivunyelweko kusafanele siqunte.", "Ena ke kgothaletso, ha se qeto ya ho qetela ya masepala. Ofisiri e dumelletsweng e ntse e lokela ho etsa qeto."],
  "Your application remains under municipal review.": ["Jou aansoek is steeds onder munisipale hersiening.", "Isicelo sakho sisabuyekezwa ngumasipala.", "Isibawo sakho sisabuyekezwa ngumasipala.", "Kopo ya hao e ntse e hlahlojwa ke masepala."],
  "Property-rates rebates for pensioners, people with disabilities and people medically retired need a separate workflow. The 2026/27 income formula and effective dates await GMM confirmation. This test service cannot calculate or promise a rebate.": ["Eiendomsbelastingkortings vir pensioenarisse, mense met gestremdhede en mense wat om mediese redes afgetree het, vereis ’n afsonderlike proses. Die 2026/27-inkomsteformule en ingangsdatums wag op GMM se bevestiging. Hierdie toetsdiens kan nie ’n korting bereken of belowe nie.", "Izaphulelo zentela yendawo zabahola impesheni, abantu abakhubazekile nabathathe umhlalaphansi ngenxa yezempilo zidinga inqubo ehlukile. Indlela yokubala imali nezinsuku zokuqala zango-2026/27 zilinde ukuqinisekiswa yi-GMM. Le nkonzo yokuhlola ayikwazi ukubala noma ukuthembisa isaphulelo.", "Iimphulelo zomthelo wendawo zabahola ipentjheni, abantu abakhubazekileko nabathethe umhlalaphasi ngebanga lezepilo zifuna ikambiso ehlukileko. Indlela yokubala imali namalanga wokuthoma wango-2026/27 zilinde ukuqinisekiswa yi-GMM. Isevisi yokuhlola le ayikwazi ukubala namkha ukuthembisa isephulelo.", "Diphokotso tsa lekgetho la thepa bakeng sa ba penshene, batho ba nang le bokooa le ba tlohetseng mosebetsi ka mabaka a bophelo di hloka tsamaiso e arohaneng. Mokgwa wa ho bala lekeno le matsatsi a ho qala a 2026/27 di emetse netefatso ya GMM. Tshebeletso ena ya teko e ke ke ya bala kapa ya tshepisa phokotso."],
  "Application summary": ["Aansoekopsomming", "Isifinyezo sesicelo", "Isirhunyezo sesibawo", "Kakaretso ya kopo"],
  "application in progress": ["aansoek aan die gang", "isicelo siyaqhubeka", "isibawo siyaragela phambili", "kopo e ntse e tswela pele"],
  "documents outstanding": ["dokumente uitstaande", "amaphepha asadingeka", "amaphepha asafunekako", "ditokomane di sa hlokeha"],
  "ready for submission": ["gereed vir indiening", "silungele ukuthunyelwa", "silungele ukuthunyelwa", "e loketse ho romelwa"],
  "official certification required": ["amptelike sertifisering nodig", "kudingeka ukuqinisekiswa ngokusemthethweni", "kufuneka ukuqinisekiswa ngokusemthethweni", "netefatso ya semmuso e hlokeha"],
  "I could not find that case reference. Check it and try again, or choose I need help.": ["Ek kon nie daardie saakverwysing vind nie. Kontroleer dit en probeer weer, of kies Ek het hulp nodig.", "Angiyitholanga le nombolo yesicelo. Yihlole bese uzama futhi, noma ukhethe Ngidinga usizo.", "Angikayitholi inomboro yesibawo le. Yihlole bese uzama godu, namkha ukhethe Ngitlhoga isizo.", "Ha ke a fumana nomoro eo ya kopo. E hlahlobe mme o leke hape, kapa o kgethe Ke hloka thuso."],
  "Khula can save an application, collect supporting documents and return information to the same case. It does not grant or refuse benefits. Choose an option to continue.": ["Khula kan ’n aansoek stoor, stawende dokumente versamel en inligting aan dieselfde saak koppel. Dit keur nie voordele goed of af nie. Kies ’n opsie om voort te gaan.", "UKhula angagcina isicelo, aqoqe amaphepha asekelayo futhi axhumanise ulwazi nesicelo esifanayo. Akavumi noma enqabe izinzuzo. Khetha ukuze uqhubeke.", "UKhula angagcina isibawo, abuthelele amaphepha asekelako begodu ahlanganise ilwazi nesibawo esifanako. Akavumeli namkha ale izinzuzo. Khetha bona uragele phambili.", "Khula e ka boloka kopo, ya bokella ditokomane tse tshehetsang mme ya hokela tlhahisoleseding kopong e tshwanang. Ha e amohele kapa e hane melemo. Kgetha ho tswela pele."],
  "Enter your existing case reference. CivicFlow will distinguish annual verification from full reapplication without creating a duplicate case.": ["Voer jou bestaande saakverwysing in. CivicFlow onderskei jaarlikse verifikasie van ’n volle heraansoek sonder om ’n dubbele saak te skep.", "Faka inombolo yesicelo esikhona. I-CivicFlow izohlukanisa ukuqinisekiswa konyaka nokufaka isicelo kabusha ngaphandle kokuphinda isicelo.", "Faka inomboro yesibawo esikhona. I-CivicFlow izokuhlukanisa ukuqinisekiswa komnyaka nokufaka isibawo kabutjha ngaphandle kokuphinda isibawo.", "Kenya nomoro ya kopo e seng e le teng. CivicFlow e tla kgetholla netefatso ya selemo le kopo e ntjha e felletseng ntle le ho etsa kopo e iphetang."],
  "Your CivicFlow reference begins CF-GMM. A municipal service centre can also help locate a case after identity verification.": ["Jou CivicFlow-verwysing begin met CF-GMM. ’n Munisipale dienssentrum kan ook ná identiteitsverifikasie help om ’n saak te vind.", "Inombolo yakho ye-CivicFlow iqala ngo-CF-GMM. Isikhungo sikamasipala singakusiza ukuthola isicelo ngemva kokuqinisekisa ubuwena.", "Inomboro yakho ye-CivicFlow ithoma ngo-CF-GMM. Iziko likamasipala lingakusiza ukuthola isibawo ngemva kokuqinisekisa ubuwena.", "Nomoro ya hao ya CivicFlow e qala ka CF-GMM. Setsi sa ditshebeletso sa masepala se ka thusa ho fumana kopo kamora netefatso ya boitsebiso."],
  "Enter a valid mobile number with at least nine digits.": ["Voer ’n geldige selfoonnommer met minstens nege syfers in.", "Faka inombolo yeselula efanele enamadijithi okungenani ayisishiyagalolunye.", "Faka inomboro yeselula efaneleko eneenomboro okungasenani ezilithoba.", "Kenya nomoro e nepahetseng ya selefouno e nang le dinomoro tse robong kapa ho feta."],
  "That PIN is not correct. Enter the six-digit PIN sent for this session.": ["Daardie PIN is verkeerd. Voer die ses-syfer PIN vir hierdie sessie in.", "Leyo PIN ayilungile. Faka i-PIN enamadijithi ayisithupha ethunyelwe kule ngxoxo.", "I-PIN leyo ayikalungi. Faka i-PIN yeenomboro ezisithandathu ethunyelwe engcocweni le.", "PIN eo ha e a nepahala. Kenya PIN ya dinomoro tse tsheletseng e rometsweng bakeng sa puisano ena."],
  "Sandbox PIN: {0}. In production this will be delivered through the approved provider.": ["Toets-PIN: {0}. In die werklike diens word dit deur die goedgekeurde verskaffer gestuur.", "I-PIN yokuhlola: {0}. Enkonzweni yangempela izothunyelwa ngumhlinzeki ogunyaziwe.", "I-PIN yokuhlola: {0}. Emsebenzini wamambala izokuthunyelwa mnikeli ovunyelweko.", "PIN ya teko: {0}. Tshebeletsong ya nnete e tla romelwa ke mofani ya amohetsweng."],
  "Your application has been started and saved. Reference: {0}. Which identity document does {1} use?": ["Jou aansoek is begin en gestoor. Verwysing: {0}. Watter identiteitsdokument gebruik {1}?", "Isicelo sakho sesiqalisiwe futhi sagcinwa. Inombolo: {0}. Yiliphi iphepha likamazisi elisetshenziswa ngu-{1}?", "Isibawo sakho sithonyiwe begodu sagcinwa. Inomboro: {0}. Ngiliphi iphepha likamazisi elisetjenziswa ngu-{1}?", "Kopo ya hao e qadile mme e bolokilwe. Nomoro: {0}. {1} o sebedisa tokomane efe ya boitsebiso?"],
  "The application is saved. A municipal official must help with the approved alternative identity route before protected account information can be disclosed.": ["Die aansoek is gestoor. ’n Munisipale beampte moet help met die goedgekeurde alternatiewe identiteitsroete voordat beskermde rekeninginligting bekend gemaak kan word.", "Isicelo sigciniwe. Isikhulu sikamasipala kufanele sisize ngendlela egunyaziwe ehlukile yokuqinisekisa ubuwena ngaphambi kokuveza imininingwane ye-akhawunti evikelwe.", "Isibawo sigciniwe. Isiphathimandla sikamasipala kufanele sisize ngenye indlela evunyelweko yokuqinisekisa ubuwena ngaphambi kokuveza ilwazi le-akhawunti elivikelweko.", "Kopo e bolokilwe. Ofisiri ya masepala e lokela ho thusa ka tsela e nngwe e amohetsweng ya boitsebiso pele dintlha tse sireleditsweng tsa akhaonto di ka senolwa."],
  "Continue with property information": ["Gaan voort met eiendomsinligting", "Qhubeka ngemininingwane yendawo", "Ragela phambili ngelwazi lendawo", "Tswela pele ka dintlha tsa thepa"],
  "The application remains saved. Verification cannot proceed until the municipality addresses the consent or lawful verification route with the applicant.": ["Die aansoek bly gestoor. Verifikasie kan nie voortgaan totdat die munisipaliteit toestemming of die wettige verifikasieroete met die aansoeker behandel het nie.", "Isicelo sisagciniwe. Ukuqinisekiswa ngeke kuqhubeke kuze umasipala axoxe nomfakisicelo ngemvume noma ngendlela esemthethweni yokuqinisekisa.", "Isibawo sisagciniwe. Ukuqinisekiswa angekhe kuragele phambili bekube umasipala ukhuluma nomfakisibawo ngemvume namkha ngendlela esemthethweni yokuqinisekisa.", "Kopo e ntse e bolokilwe. Netefatso e ke ke ya tswela pele ho fihlela masepala o sebetsana le tumello kapa tsela ya molao ya netefatso le mokopi."],
  "That requirement is already satisfied or no longer available. Choose an outstanding item.": ["Daardie vereiste is reeds nagekom of nie meer beskikbaar nie. Kies ’n uitstaande item.", "Lelo phepha selithunyelwe noma alisadingeki. Khetha okusadingeka.", "Iphepha lelo selithunyelwe namkha alisafuneki. Khetha okusafunekako.", "Tlhoko eo e se e phethilwe kapa ha e sa fumaneha. Kgetha ntho e sa ntseng e hlokeha."],
  "Upload {0} now. PDF, JPEG and PNG files up to 10 MB are accepted.": ["Laai {0} nou op. PDF-, JPEG- en PNG-lêers tot 10 MB word aanvaar.", "Thumela {0} manje. Kwamukelwa amafayela e-PDF, JPEG ne-PNG angafiki ngaphezu kuka-10 MB.", "Thumela {0} nje. Kwamukelwa amafayili we-PDF, JPEG ne-PNG angadluli ku-10 MB.", "Kenya {0} jwale. Difaele tsa PDF, JPEG le PNG tse sa feteng 10 MB di a amohelwa."],
  "I still need {0} items. Upload each outstanding item before continuing.": ["Ek benodig nog {0} items. Laai elke uitstaande item op voordat jy voortgaan.", "Ngisadinga izinto ezingu-{0}. Thumela konke okusadingeka ngaphambi kokuqhubeka.", "Ngisafuna izinto ezi-{0}. Thumela koke okusafunekako ngaphambi kokuragela phambili.", "Ke ntse ke hloka dintho tse {0}. Kenya ntho ka nngwe e hlokehang pele o tswela pele."],
  "I still need {0} item. Upload each outstanding item before continuing.": ["Ek benodig nog {0} item. Laai die uitstaande item op voordat jy voortgaan.", "Ngisadinga into engu-{0}. Yithumele ngaphambi kokuqhubeka.", "Ngisafuna into e-{0}. Yithumele ngaphambi kokuragela phambili.", "Ke ntse ke hloka ntho e {0}. E kenye pele o tswela pele."],
  "The application remains saved. A municipal official can help before it is submitted and frozen.": ["Die aansoek bly gestoor. ’n Munisipale beampte kan help voordat dit ingedien en gesluit word.", "Isicelo sisagciniwe. Isikhulu sikamasipala singasiza ngaphambi kokuba sithunyelwe futhi sivalwe.", "Isibawo sisagciniwe. Isiphathimandla sikamasipala singasiza ngaphambi kokuthi sithunyelwe begodu sivalwe.", "Kopo e ntse e bolokilwe. Ofisiri ya masepala e ka thusa pele e romelwa le ho kwalwa."],
  "Case {0} is waiting for official certification and municipal assessment.": ["Saak {0} wag op amptelike sertifisering en munisipale beoordeling.", "Isicelo {0} silinde ukuqinisekiswa ngokusemthethweni nokuhlolwa ngumasipala.", "Isibawo {0} silinde ukuqinisekiswa ngokusemthethweni nokuhlolwa ngumasipala.", "Kopo {0} e emetse netefatso ya semmuso le tekolo ya masepala."],
  "Upload the item requested for {0}. Each file will be linked to the existing case.": ["Laai die item wat vir {0} gevra is op. Elke lêer word aan die bestaande saak gekoppel.", "Thumela iphepha eliceliwe ngesicelo {0}. Ifayela ngalinye lizoxhunywa kuleso sicelo.", "Thumela iphepha elibawelwe isibawo {0}. Ifayili ngalinye lizokuhlanganiswa nesibawo esikhona.", "Kenya ntho e kopilweng bakeng sa {0}. Faele ka nngwe e tla hokelwa kopong e seng e le teng."],
  "Your appeal request for {0} has been recorded for validation. The original decision remains unchanged.": ["Jou appèlversoek vir {0} is vir bevestiging aangeteken. Die oorspronklike besluit bly onveranderd.", "Isicelo sakho sokudlulisa isikhalo ngo-{0} sirekhodiwe ukuze siqinisekiswe. Isinqumo sokuqala asikashintshi.", "Isibawo sakho sokudlulisa isililo ngo-{0} sirekhodiwe bona siqinisekiswe. Isiqunto sokuthoma asikatjhuguluki.", "Kopo ya hao ya boipiletso ka {0} e tlalehilwe hore e netefatswe. Qeto ya pele ha e fetohe."],
  "Your change report for {0} has been linked to the existing case. A municipal official must assess the effect.": ["Jou veranderingsmelding vir {0} is aan die bestaande saak gekoppel. ’n Munisipale beampte moet die uitwerking beoordeel.", "Umbiko wakho woshintsho ngo-{0} uxhunywe esicelweni esikhona. Isikhulu sikamasipala kufanele sihlole umthelela.", "Umbiko wakho wetjhuguluko ngo-{0} uhlanganiswe nesibawo esikhona. Isiphathimandla sikamasipala kufanele sihlole umthelela.", "Tlaleho ya hao ya phetoho ka {0} e hoketswe kopong e seng e le teng. Ofisiri ya masepala e lokela ho lekola phello."],
  "{0} is currently “{1}”. The case was last updated {2}.": ["{0} se huidige status is “{1}”. Die saak is laas op {2} bygewerk.", "Isimo sika-{0} manje ngu-“{1}”. Isicelo sagcina ukubuyekezwa ngo-{2}.", "Ubujamo buka-{0} nje ngu-“{1}”. Isibawo sagcina ukubuyekezwa ngo-{2}.", "Boemo ba {0} hona jwale ke “{1}”. Kopo e qetetse ho ntjhafatswa ka {2}."],
  "Start or resume an application before uploading a document.": ["Begin of hervat ’n aansoek voordat jy ’n dokument oplaai.", "Qala noma uqhubeke nesicelo ngaphambi kokuthumela iphepha.", "Thoma namkha uragele phambili nesibawo ngaphambi kokuthumela iphepha.", "Qala kapa o tswele pele ka kopo pele o kenya tokomane."],
  "Choose which outstanding requirement this file satisfies, then upload it again.": ["Kies watter uitstaande vereiste hierdie lêer bevredig en laai dit dan weer op.", "Khetha ukuthi leli fayela lihlangabezana nayiphi into esadingeka, bese ulithumela futhi.", "Khetha bona ifayili leli lihlangabezana nayiphi into esafunekako, bese ulithumela godu.", "Kgetha tlhoko e phethwang ke faele ena, mme o e kenye hape."],
  "There is no outstanding document requirement to attach this file to. Choose the requested-information route if the municipality asked for something new.": ["Daar is geen uitstaande dokumentvereiste vir hierdie lêer nie. Kies die roete vir gevraagde inligting as die munisipaliteit iets nuuts gevra het.", "Alikho iphepha elisadingeka ongaxhuma kulo leli fayela. Khetha ukuthumela ulwazi oluceliwe uma umasipala ecele okusha.", "Alikho iphepha elisafunekako ongahlanganisa kilo ifayili leli. Khetha ukuthumela ilwazi elibawiweko nangabe umasipala ubawe okutjha.", "Ha ho tokomane e sa ntseng e hlokeha eo faele ena e ka hokelwang ho yona. Kgetha ho kenya tlhahisoleseding e kopilweng haeba masepala o kopile ntho e ntjha."],
  "Received: {0}.": ["Ontvang: {0}.", "Kutholiwe: {0}.", "Kutholiwe: {0}.", "E amohetswe: {0}."],
  "What would you like to do?": ["Wat wil jy doen?", "Ungathanda ukwenzani?", "Ungathanda ukwenzani?", "O ka rata ho etsa eng?"],
  "Apply for indigent support": ["Doen aansoek om hulp", "Cela usizo lwabahlwempu", "Bawa isizo labatlhagako", "Kopa thuso ya ba hlokang"],
  "Renew or verify my support": ["Hernu of bevestig my hulp", "Vuselela noma qinisekisa usizo", "Vuselela namkha qinisekisa isizo", "Ntjhafatsa kapa netefatsa thuso"],
  "Property-rates rebate": ["Eiendomsbelastingkorting", "Isaphulelo sentela yendawo", "Isephulelo somthelo wendawo", "Phokotso ya lekgetho la thepa"],
  "Check my application": ["Gaan my aansoek na", "Hlola isicelo sami", "Hlola isibawo sami", "Sheba kopo ya ka"],
  "Upload requested information": ["Laai gevraagde inligting op", "Thumela ulwazi oluceliwe", "Thumela ilwazi elibawiweko", "Kenya tlhahisoleseding e kopilweng"],
  "Report a change": ["Meld ’n verandering", "Bika ushintsho", "Bika itjhuguluko", "Tlaleha phetoho"],
  "Appeal a decision": ["Teken appèl teen ’n besluit aan", "Dlulisa isikhalo ngesinqumo", "Dlulisa isililo ngesiqunto", "Etsa boipiletso ka qeto"],
  "I need help": ["Ek het hulp nodig", "Ngidinga usizo", "Ngitlhoga isizo", "Ke hloka thuso"],
  "Change language": ["Verander taal", "Shintsha ulimi", "Tjhugulula ilimi", "Fetola puo"],
  "Choose an option": ["Kies ’n opsie", "Khetha", "Khetha", "Kgetha"],
  "Choose an option to continue.": ["Kies ’n opsie om voort te gaan.", "Khetha ukuze uqhubeke.", "Khetha bona uragele phambili.", "Kgetha ho tswela pele."],
  "Reference": ["Verwysing", "Inombolo yesicelo", "Inomboro yesibawo", "Nomoro ya kopo"],
  "Not supplied": ["Nie verskaf nie", "Akunikeziwe", "Akunikelwa", "Ha e fumanwe"],
  "Return to main menu": ["Terug na hoofkieslys", "Buyela kumenyu enkulu", "Buyela kumenyu ekulu", "Kgutlela lenaneng le leholo"],
  "Yes": ["Ja", "Yebo", "Iye", "Ee"],
  "No": ["Nee", "Cha", "Awa", "Tjhe"],
  "I’m not sure": ["Ek is nie seker nie", "Angiqiniseki", "Angiqiniseki", "Ha ke na bonnete"],
  "No, I am helping someone": ["Nee, ek help iemand", "Cha, ngisiza omunye umuntu", "Awa, ngisiza omunye umuntu", "Tjhe, ke thusa motho e mong"],
  "Do you have a municipal account for the property?": ["Het jy ’n munisipale rekening vir die eiendom?", "Unayo i-akhawunti kamasipala yale ndawo?", "Une-akhawunti kamasipala yendawo le?", "Na o na le akhaonto ya masepala bakeng sa thepa ee?"],
  "Are you applying for yourself?": ["Doen jy vir jouself aansoek?", "Uzifakela wena isicelo?", "Uzifakela wena isibawo?", "Na o ikopela wena?"],
  "What is your first name?": ["Wat is jou voornaam?", "Ubani igama lakho?", "Ngubani ibizo lakho?", "Lebitso la hao ke mang?"],
  "What is the applicant’s first name?": ["Wat is die aansoeker se voornaam?", "Ubani igama lomfakisicelo?", "Ngubani ibizo lomfakisibawo?", "Lebitso la mokopi ke mang?"],
  "What is your surname?": ["Wat is jou van?", "Ubani isibongo sakho?", "Ngubani isibongo sakho?", "Fane ya hao ke mang?"],
  "What is the applicant’s surname?": ["Wat is die aansoeker se van?", "Ubani isibongo somfakisicelo?", "Ngubani isibongo somfakisibawo?", "Fane ya mokopi ke mang?"],
  "First name": ["Voornaam", "Igama", "Ibizo", "Lebitso"],
  "Surname": ["Van", "Isibongo", "Isibongo", "Fane"],
  "Full legal name": ["Volle naam soos op ID", "Igama eligcwele elisemthethweni", "Ibizo elipheleleko elisemthethweni", "Lebitso le felletseng la molao"],
  "the applicant": ["die aansoeker", "umfakisicelo", "umfakisibawo", "mokopi"],
  "this adult": ["hierdie volwassene", "lo muntu omdala", "umuntu omdala lo", "motho enwa e moholo"],
  "Which identity document does {0} use?": ["Watter identiteitsdokument gebruik {0}?", "Yiliphi iphepha likamazisi elisetshenziswa ngu-{0}?", "Ngiliphi iphepha likamazisi elisetjenziswa ngu-{0}?", "{0} o sebedisa tokomane efe ya boitsebiso?"],
  "South African ID": ["Suid-Afrikaanse ID", "Umazisi waseNingizimu Afrika", "Umazisi weSewula Afrika", "Boitsebiso ba Afrika Borwa"],
  "Passport": ["Paspoort", "Iphasiphothi", "Iphasipoti", "Pasepoto"],
  "Another approved document": ["Ander goedgekeurde dokument", "Elinye iphepha eligunyaziwe", "Elinye iphepha elivunyelweko", "Tokomane e nngwe e amohetsweng"],
  "No identity document": ["Geen identiteitsdokument", "Anginalo iphepha likamazisi", "Anginalo iphepha likamazisi", "Ha ke na tokomane ya boitsebiso"],
  "Enter the identity or passport number. It will be masked in ordinary screens.": ["Voer die ID- of paspoortnommer in. Dit word op gewone skerms versteek.", "Faka inombolo kamazisi noma yephasiphothi. Izofihlwa ezikrinini ezijwayelekile.", "Faka inomboro kamazisi namkha yephasipoti. Izokufihlwa eenkrinini ezijayelekileko.", "Kenya nomoro ya boitsebiso kapa pasepoto. E tla patwa dikrineng tse tlwaelehileng."],
  "Identity reference": ["ID- of paspoortnommer", "Inombolo kamazisi", "Inomboro kamazisi", "Nomoro ya boitsebiso"],
  "Enter {0}’s identity reference.": ["Voer {0} se ID- of paspoortnommer in.", "Faka inombolo kamazisi ka-{0}.", "Faka inomboro kamazisi ka-{0}.", "Kenya nomoro ya boitsebiso ya {0}."],
  "Enter the municipal account number. This sandbox records it for later Munsoft matching and will not display protected account data.": ["Voer die munisipale rekeningnommer in. Hierdie toetsomgewing stoor dit vir latere Munsoft-koppeling en vertoon nie beskermde rekeningdata nie.", "Faka inombolo ye-akhawunti kamasipala. Lolu hlelo lokuhlola luyayigcina ukuze ihlanganiswe ne-Munsoft kamuva; aluvezi imininingwane ye-akhawunti evikelwe.", "Faka inomboro ye-akhawunti kamasipala. Ihlelo lokuhlola liyigcinela ukuyihlanganisa ne-Munsoft ngokukhamba kwesikhathi; alivezi ilwazi le-akhawunti elivikelweko.", "Kenya nomoro ya akhaonto ya masepala. Tsamaiso ena ya teko e e boloka hore e bapiswe le Munsoft hamorao; ha e bontshe dintlha tse sireleditsweng tsa akhaonto."],
  "Municipal account number": ["Munisipale rekeningnommer", "Inombolo ye-akhawunti kamasipala", "Inomboro ye-akhawunti kamasipala", "Nomoro ya akhaonto ya masepala"],
  "Describe where the property is located. Include the town or settlement and the street, stand or landmark if known.": ["Beskryf waar die eiendom is. Gee die dorp of nedersetting en, indien bekend, die straat, erf of landmerk.", "Chaza ukuthi indawo ikuphi. Faka idolobha noma indawo yokuhlala nomgwaqo, isiza noma uphawu lwendawo uma kwaziwa.", "Hlathulula bona indawo ikuphi. Faka idorobho namkha indawo yokuhlala nendlela, isiza namkha itshwayo lendawo nangabe liyaziwa.", "Hlalosa moo thepa e leng teng. Kenya toropo kapa motse le seterata, setsha kapa letshwao la sebaka haeba o le tseba."],
  "Property or settlement location": ["Ligging van eiendom", "Indawo yesakhiwo noma yokuhlala", "Indawo yesakhiwo namkha yokuhlala", "Sebaka sa thepa kapa motse"],
  "Which of these best describes the applicant’s connection to the property?": ["Wat beskryf die aansoeker se verbintenis met die eiendom die beste?", "Yikuphi okuchaza kahle ubudlelwane bomfakisicelo nale ndawo?", "Ngikuphi okuhlathulula kuhle ubuhlobo bomfakisibawo nendawo le?", "Ke efe e hlalosang kamano ya mokopi le thepa hantle?"],
  "I own the property": ["Ek besit die eiendom", "Indawo ingeyami", "Indawo ngeyami", "Ke monga thepa"],
  "I jointly own the property": ["Ek is ’n mede-eienaar", "Indawo ngiyiphethe ngokuhlanganyela", "Indawo ngiyiphethe ngokuhlanganyela", "Ke monga thepa le ba bang"],
  "The municipal account is in my name": ["Munisipale rekening op my naam", "I-akhawunti kamasipala isegameni lami", "I-akhawunti kamasipala isebizweni lami", "Akhaonto ya masepala e lebitsong la ka"],
  "I rent a municipal property": ["Ek huur munisipale eiendom", "Ngiqasha indawo kamasipala", "Ngiqatjha indawo kamasipala", "Ke hira thepa ya masepala"],
  "I am dealing with a deceased estate": ["Ek hanteer ’n bestorwe boedel", "Ngisingatha ifa lomufi", "Ngisingatha ilifa lomufi", "Ke sebetsana le lefa la mofu"],
  "I am an heir or successor": ["Ek is ’n erfgenaam of opvolger", "Ngiyindlalifa noma umlandeli", "Ngiyindlalifa namkha umlandeli", "Ke mojalefa kapa mohlahlami"],
  "I am the household guardian": ["Ek is die huishouding se voog", "Ngingumqaphi womndeni", "Ngingumtlhogomeli womndeni", "Ke mohlokomedi wa lelapa"],
  "The property was awarded to me in a divorce": ["Eiendom by egskeiding toegeken", "Nganikwa indawo esahlukanisweni", "Nganikelwa indawo ngesehlukaniso", "Ke abetswe thepa tlhalo"],
  "None of these / I need help": ["Geen hiervan nie / hulp nodig", "Akukho kulokhu / ngidinga usizo", "Akukho kilokhu / ngitlhoga isizo", "Ha ho le e nngwe / ke hloka thuso"],
  "Does the applicant normally live at this property as their home?": ["Woon die aansoeker gewoonlik by hierdie eiendom as hul tuiste?", "Ingabe umfakisicelo uvame ukuhlala kule ndawo njengekhaya lakhe?", "Ingabe umfakisibawo ujayele ukuhlala endaweni le njengekhaya lakhe?", "Na mokopi o tlwaetse ho dula thepa ena e le lehae la hae?"],
  "Temporarily away": ["Tydelik weg", "Ukude okwesikhashana", "Ukude kwesikhatjhana", "Ha a yo nakwana"],
  "I’m not sure / help": ["Onseker / hulp nodig", "Angiqiniseki / ngisize", "Angiqiniseki / ngisize", "Ha ke na bonnete / thuso"],
  "How is the property mainly used?": ["Waarvoor word die eiendom hoofsaaklik gebruik?", "Indawo isetshenziselwa ini kakhulu?", "Indawo isetjenziselwa ini khulu?", "Thepa e sebedisetswa eng haholoholo?"],
  "Only as a home": ["Slegs as ’n tuiste", "Ikhaya kuphela", "Ikhaya kwaphela", "Lehae feela"],
  "Home with a small business": ["Tuiste met ’n klein besigheid", "Ikhaya nebhizinisi elincane", "Ikhaya nebhizinisi elincani", "Lehae le kgwebo e nyane"],
  "Mainly for business": ["Hoofsaaklik vir besigheid", "Ibhizinisi ikakhulu", "Ibhizinisi khulukazi", "Kgwebo haholoholo"],
  "Rented to someone else": ["Aan iemand anders verhuur", "Iqashiswe omunye umuntu", "Iqatjhiselwe omunye umuntu", "E hirilwe ke motho e mong"],
  "Other / not sure": ["Ander / onseker", "Okunye / angiqiniseki", "Okhunye / angiqiniseki", "Tse ding / ha ke na bonnete"],
  "How many people aged 18 or older normally live at this property, including the applicant?": ["Hoeveel mense van 18 jaar of ouer woon gewoonlik hier, insluitend die aansoeker?", "Bangaki abantu abaneminyaka engu-18 noma ngaphezulu abavame ukuhlala lapha, kuhlanganise nomfakisicelo?", "Bangaki abantu abaneminyaka eli-18 namkha ngaphezulu abajayele ukuhlala lapha, kufaka hlangana umfakisibawo?", "Ke batho ba bakae ba dilemo tse 18 kapa ho feta ba tlwaetseng ho dula mona, ho kenyeletswa mokopi?"],
  "Number of adults": ["Aantal volwassenes", "Inani labantu abadala", "Inani labantu abadala", "Palo ya batho ba baholo"],
  "Enter the full legal name of adult {0}.": ["Voer volwassene {0} se volle naam soos op hul ID in.", "Faka igama eligcwele elisemthethweni lomuntu omdala ongunombolo {0}.", "Faka ibizo elipheleleko elisemthethweni lomuntu omdala ongunomboro {0}.", "Kenya lebitso le felletseng la molao la motho e moholo wa {0}."],
  "Does {0} receive money from work, a pension, a grant, a business, rent or another source?": ["Ontvang {0} geld uit werk, ’n pensioen, toelae, besigheid, huur of ’n ander bron?", "Ingabe u-{0} uthola imali emsebenzini, empeshenini, esibonelelweni, ebhizinisini, erentini noma komunye umthombo?", "Ingabe u-{0} uthola imali emsebenzini, epentjhenini, esibonelelweni, ebhizinisini, ekurenteni namkha komunye umthombo?", "Na {0} o fumana tjhelete mosebetsing, pensheneng, thusong ya mmuso, kgwebong, hirong kapa mohloding o mong?"],
  "No income": ["Geen inkomste", "Akukho mali engenayo", "Akunamali engenako", "Ha ho lekeno"],
  "Select {0}’s income source.": ["Kies {0} se inkomstebron.", "Khetha umthombo wemali ka-{0}.", "Khetha umthombo wemali ka-{0}.", "Kgetha mohlodi wa lekeno wa {0}."],
  "Salary or wages": ["Salaris of loon", "Umholo", "Umrholo", "Moputso"],
  "Casual or temporary work": ["Los of tydelike werk", "Umsebenzi wesikhashana", "Umsebenzi wesikhatjhana", "Mosebetsi wa nakwana"],
  "Self-employment or informal trade": ["Eie werk of informele handel", "Ukuzisebenza noma ukuhweba", "Ukuzisebenza namkha ukurhweba", "Ho it sebeletsa kapa kgwebo"],
  "Pension": ["Pensioen", "Impesheni", "Ipentjheni", "Penshene"],
  "Social grant": ["Maatskaplike toelae", "Isibonelelo sikahulumeni", "Isibonelelo sikarhulumende", "Thuso ya mmuso"],
  "Rent or board": ["Huur- of losiesinkomste", "Irenti noma imali yokuhlala", "Irente namkha imali yokuhlala", "Hiro kapa tjhelete ya bodulo"],
  "Maintenance or support": ["Onderhoud of ondersteuning", "Isondlo noma usizo", "Isondlo namkha isizo", "Tjhelete ya tlhokomelo kapa thuso"],
  "Other income": ["Ander inkomste", "Enye imali engenayo", "Enye imali engenako", "Lekeno le leng"],
  "Enter the gross amount received per month, before deductions. Irregular income will be flagged for staff review.": ["Voer die bruto maandelikse bedrag in, voor aftrekkings. Onreëlmatige inkomste word vir personeel se hersiening gemerk.", "Faka imali ephelele oyitholayo ngenyanga ngaphambi kokudonswa. Imali engajwayelekile izobhekwa ngabasebenzi.", "Faka imali epheleleko oyitholako ngenyanga ngaphambi kokudonswa. Imali engakajayeleki izokuhlolwa basebenzi.", "Kenya tjhelete yohle ya kgwedi pele ho ditheolelo. Lekeno le sa tsitsang le tla hlahlojwa ke basebetsi."],
  "Amount in rand": ["Bedrag in rand", "Imali ngamarandi", "Imali ngamaranda", "Tjhelete ka diranta"],
  "Does {0} have another income source?": ["Het {0} nog ’n inkomstebron?", "Ingabe u-{0} unomunye umthombo wemali?", "Ingabe u-{0} unomunye umthombo wemali?", "Na {0} o na le mohlodi o mong wa lekeno?"],
  "Yes, add another": ["Ja, voeg nog een by", "Yebo, engeza omunye", "Iye, ungeze omunye", "Ee, kenya o mong"],
  "No, continue": ["Nee, gaan voort", "Cha, qhubeka", "Awa, ragela phambili", "Tjhe, tswela pele"],
  "Do you authorise the municipality to verify the information supplied for this application through approved sources? This consent is separate from the required sworn affidavit.": ["Magtig jy die munisipaliteit om die inligting vir hierdie aansoek deur goedgekeurde bronne te verifieer? Hierdie toestemming is afsonderlik van die vereiste beëdigde verklaring.", "Uyawugunyaza umasipala ukuthi uqinisekise imininingwane yalesi sicelo ngemithombo egunyaziwe? Le mvume yehlukile esitatimendeni esifungelwe esidingekayo.", "Uyawuvumela umasipala bona uqinisekise ilwazi lesibawo lesi ngemithombo evunyelweko? Imvume le ihlukile esitatimendeni esifungelweko esifunekako.", "Na o dumella masepala ho netefatsa tlhahisoleseding ya kopo ena ka mehlodi e amohetsweng? Tumello ena e arohane le afidaviti e hlokehang."],
  "I authorise verification": ["Ek magtig verifikasie", "Ngivumela ukuqinisekiswa", "Ngivumela ukuqinisekiswa", "Ke dumella netefatso"],
  "I do not authorise it": ["Ek magtig dit nie", "Angikuniki imvume", "Angikunikeli imvume", "Ha ke fane ka tumello"],
  "I now authorise verification": ["Ek magtig nou verifikasie", "Manje ngivumela ukuqinisekiswa", "Nje ngivumela ukuqinisekiswa", "Jwale ke dumella netefatso"],
  "Upload each required document below. Files remain linked to this case; an upload is recorded as pending municipal review.": ["Laai elke vereiste dokument hieronder op. Lêers bly aan die saak gekoppel en wag ná oplaai op munisipale hersiening.", "Thumela iphepha ngalinye elidingekayo ngezansi. Amafayela ahlala exhunywe kulesi sicelo futhi alinda ukubuyekezwa ngumasipala.", "Thumela iphepha ngalinye elifunekako ngezasi. Amafayili ahlala ahlanganiswe nesibawo lesi begodu alinda ukubuyekezwa ngumasipala.", "Kenya tokomane ka nngwe e hlokehang ka tlase. Difaele di dula di hoketswe kopong ena mme di emela tlhahlobo ya masepala."],
  "I have finished": ["Ek is klaar", "Sengiqedile", "Sengiqedile", "Ke qetile"],
  "I have finished uploading": ["Ek het klaar opgelaai", "Sengiqedile ukuthumela", "Sengiqedile ukuthumela", "Ke qetile ho kenya"],
  "Check again": ["Gaan weer na", "Hlola futhi", "Hlola godu", "Sheba hape"],
  "Review the application summary. Submission freezes this version. A municipal official must still review the evidence and complete the required certification.": ["Gaan die aansoekopsomming na. Indiening sluit hierdie weergawe. ’n Munisipale beampte moet nog die bewyse hersien en die vereiste sertifisering voltooi.", "Buyekeza isifinyezo sesicelo. Uma usithumela, le nguqulo iyavalwa. Isikhulu sikamasipala kusafanele sihlole ubufakazi futhi siqede ukuqinisekisa okudingekayo.", "Buyekeza isirhunyezo sesibawo. Ukusithumela kuvala ihlelo leli. Isiphathimandla sikamasipala kusafanele sihlole ubufakazi besiqede ukuqinisekisa okufunekako.", "Hlahloba kakaretso ya kopo. Ho e romela ho koala mofuta ona. Ofisiri ya masepala e ntse e lokela ho hlahloba bopaki le ho phetha netefatso e hlokehang."],
  "Confirm and submit": ["Bevestig en dien in", "Qinisekisa bese uthumela", "Qinisekisa bese uthumela", "Netefatsa mme o romele"],
  "I need help before submitting": ["Hulp nodig voor indiening", "Ngidinga usizo ngaphambi kokuthumela", "Ngitlhoga isizo ngaphambi kokuthumela", "Ke hloka thuso pele ke romela"],
  "Your application has been submitted. It is waiting for municipal certification and assessment. A screening result is not a final decision.": ["Jou aansoek is ingedien en wag op munisipale sertifisering en beoordeling. ’n Voorlopige siftingsuitslag is nie ’n finale besluit nie.", "Isicelo sakho sithunyelwe. Silinde ukuqinisekiswa nokuhlolwa ngumasipala. Umphumela wokuhlola kokuqala awusona isinqumo sokugcina.", "Isibawo sakho sithunyelwe. Silinde ukuqinisekiswa nokuhlolwa ngumasipala. Umphumela wokuhlola kokuthoma awusiso isiqunto sokugcina.", "Kopo ya hao e rometswe. E emetse netefatso le tekolo ya masepala. Sephetho sa tlhahlobo ya pele ha se qeto ya ho qetela."],
  "Check application status": ["Gaan aansoekstatus na", "Hlola isimo sesicelo", "Hlola ubujamo besibawo", "Sheba boemo ba kopo"],
  "Enter the CivicFlow case reference, for example CF-GMM-2026-123456.": ["Voer die CivicFlow-saakverwysing in, byvoorbeeld CF-GMM-2026-123456.", "Faka inombolo yesicelo ye-CivicFlow, isibonelo CF-GMM-2026-123456.", "Faka inomboro yesibawo ye-CivicFlow, isibonelo CF-GMM-2026-123456.", "Kenya nomoro ya kopo ya CivicFlow, mohlala CF-GMM-2026-123456."],
  "Case reference": ["Saakverwysing", "Inombolo yesicelo", "Inomboro yesibawo", "Nomoro ya kopo"],
  "Enter the mobile number you want to use for this application.": ["Voer die selfoonnommer vir hierdie aansoek in.", "Faka inombolo yeselula ofuna ukuyisebenzisa kulesi sicelo.", "Faka inomboro yeselula ofuna ukuyisebenzisa esibaweni lesi.", "Kenya nomoro ya selefouno eo o batlang ho e sebedisa kopong ena."],
  "I will verify the WhatsApp number you are using. Reply with the one-time PIN in my next message.": ["Ek gaan jou WhatsApp-nommer verifieer. Antwoord met die eenmalige PIN in my volgende boodskap.", "Ngizoqinisekisa inombolo yakho ye-WhatsApp. Phendula nge-PIN yesikhathi esisodwa emlayezweni olandelayo.", "Ngizoqinisekisa inomboro yakho ye-WhatsApp. Phendula nge-PIN yesikhathi sinye emlayezweni olandelako.", "Ke tla netefatsa nomoro ya hao ya WhatsApp. Araba ka PIN ya hang feela molaetseng o latelang."],
  "Enter the six-digit one-time PIN.": ["Voer die ses-syfer eenmalige PIN in.", "Faka i-PIN yesikhathi esisodwa enamadijithi ayisithupha.", "Faka i-PIN yesikhathi sinye eneenomboro ezisithandathu.", "Kenya PIN ya hang feela ya dinomoro tse tsheletseng."],
  "6-digit PIN": ["6-syfer PIN", "I-PIN yamadijithi ayisithupha", "I-PIN yeenomboro ezisithandathu", "PIN ya dinomoro tse 6"],
  "Your one-time PIN is {0}. Enter it to continue.": ["Jou eenmalige PIN is {0}. Voer dit in om voort te gaan.", "I-PIN yakho yesikhathi esisodwa ngu-{0}. Yifake ukuze uqhubeke.", "I-PIN yakho yesikhathi sinye ngu-{0}. Yifake bona uragele phambili.", "PIN ya hao ya hang feela ke {0}. E kenye ho tswela pele."],
  "Enter the applicant’s first name.": ["Voer die aansoeker se voornaam in.", "Faka igama lomfakisicelo.", "Faka ibizo lomfakisibawo.", "Kenya lebitso la mokopi."],
  "Enter the applicant’s surname.": ["Voer die aansoeker se van in.", "Faka isibongo somfakisicelo.", "Faka isibongo somfakisibawo.", "Kenya fane ya mokopi."],
  "Enter a valid identity reference.": ["Voer ’n geldige ID- of paspoortnommer in.", "Faka inombolo kamazisi efanele.", "Faka inomboro kamazisi efaneleko.", "Kenya nomoro e nepahetseng ya boitsebiso."],
  "Enter the municipal account number.": ["Voer die munisipale rekeningnommer in.", "Faka inombolo ye-akhawunti kamasipala.", "Faka inomboro ye-akhawunti kamasipala.", "Kenya nomoro ya akhaonto ya masepala."],
  "Add enough information for a municipal official to identify the property.": ["Gee genoeg inligting sodat ’n munisipale beampte die eiendom kan identifiseer.", "Nikeza imininingwane eyanele ukuze isikhulu sikamasipala sithole indawo.", "Nikela ilwazi elaneleko bona isiphathimandla sikamasipala sithole indawo.", "Fana ka tlhahisoleseding e lekaneng hore ofisiri ya masepala e fumane thepa."],
  "Enter a number from 1 to 20, including the applicant.": ["Voer ’n getal van 1 tot 20 in, insluitend die aansoeker.", "Faka inani elisuka ku-1 kuya ku-20, kuhlanganise nomfakisicelo.", "Faka inani elisuka ku-1 ukuya ku-20, kufaka hlangana umfakisibawo.", "Kenya palo e pakeng tsa 1 le 20, ho kenyeletswa mokopi."],
  "Enter this adult’s full legal name.": ["Voer hierdie volwassene se volle naam soos op hul ID in.", "Faka igama eligcwele elisemthethweni lalo muntu omdala.", "Faka ibizo elipheleleko elisemthethweni lomuntu omdala lo.", "Kenya lebitso le felletseng la molao la motho enwa e moholo."],
  "Enter a valid gross monthly amount in rand.": ["Voer ’n geldige bruto maandelikse bedrag in rand in.", "Faka imali ephelele yenyanga efanele ngamarandi.", "Faka imali epheleleko yenyanga efaneleko ngamaranda.", "Kenya tjhelete yohle e nepahetseng ya kgwedi ka diranta."],
  "Applicant": ["Aansoeker", "Umfakisicelo", "Umfakisibawo", "Mokopi"],
  "Municipal account": ["Munisipale rekening", "I-akhawunti kamasipala", "I-akhawunti kamasipala", "Akhaonto ya masepala"],
  "Property": ["Eiendom", "Indawo", "Indawo", "Thepa"],
  "Capacity": ["Hoedanigheid", "Ubudlelwane nendawo", "Ubuhlobo nendawo", "Kamano le thepa"],
  "Ordinarily resident": ["Gewoonlik woonagtig", "Uhlala khona ngokujwayelekile", "Uhlala lapho ngokujayelekileko", "O dula moo ka tlwaelo"],
  "Property use": ["Gebruik van eiendom", "Ukusetshenziswa kwendawo", "Ukusetjenziswa kwendawo", "Tshebediso ya thepa"],
  "Adult occupants": ["Volwasse inwoners", "Abantu abadala abahlala khona", "Abantu abadala abahlala lapho", "Baahi ba baholo"],
  "Declared gross monthly household income": ["Verklaarde bruto maandelikse huishoudelike inkomste", "Imali ephelele yomndeni ngenyanga edaluliwe", "Imali epheleleko yomndeni ngenyanga eveziweko", "Lekeno lohle la kgwedi la lelapa le boletsweng"],
  "Policy result": ["Beleidsuitslag", "Umphumela wenqubomgomo", "Umphumela wekambiso", "Sephetho sa leano"],
  "Captured": ["Vasgelê", "Irekhodiwe", "Irekhodiwe", "E tlalehilwe"],
  "No conventional account": ["Geen gewone rekening", "Ayikho i-akhawunti ejwayelekile", "Akunayo i-akhawunti ejayelekileko", "Ha ho akhaonto e tlwaelehileng"],
  "Uncertain — staff matching required": ["Onseker — personeel moet koppel", "Akucaci — abasebenzi kufanele bahlole", "Akucaci — abasebenzi kufanele bahlole", "Ha ho bonnete — basebetsi ba lokela ho bapisa"],
  "Municipal matching required": ["Munisipale koppeling nodig", "Kudingeka ukufaniswa ngumasipala", "Kufuneka ukufaniswa ngumasipala", "Masepala o lokela ho bapisa"],
  "Not decided — municipal review required": ["Nog nie besluit nie — munisipale hersiening nodig", "Akukanqunywa — kudingeka ukubuyekezwa ngumasipala", "Akukaquntwa — kufuneka ukubuyekezwa ngumasipala", "Ha ho qeto — tlhahlobo ya masepala e hlokeha"],
  "Certified identity document for {0}": ["Gesertifiseerde identiteitsdokument vir {0}", "Iphepha likamazisi eliqinisekisiwe lika-{0}", "Iphepha likamazisi eliqinisekisiweko lika-{0}", "Tokomane ya boitsebiso e netefaditsweng ya {0}"],
  "Sworn no-income declaration for {0}": ["Beëdigde verklaring van geen inkomste vir {0}", "Isitatimende esifungelwe sokungabi namali ka-{0}", "Isitatimende esifungelweko sokungabi nemali ka-{0}", "Polelo e hlapanyeditsweng ya ho hloka lekeno ya {0}"],
  "Proof of {0}’s {1}": ["Bewys van {0} se {1}", "Ubufakazi bemali ka-{0}: {1}", "Ubufakazi bemali ka-{0}: {1}", "Bopaki ba lekeno la {0}: {1}"],
  "Executed and commissioned application affidavit": ["Ondertekende aansoekverklaring deur ’n kommissaris beëdig", "I-afidavithi yesicelo esayiniwe yafungiswa ngumfungisi", "I-afidavithi yesibawo esayiniweko yafungiswa ngumfungisi", "Afidaviti ya kopo e saennweng le e hlapanyeditsweng ka pela mokomishenara"],
  "Letter of Authority or estate appointment": ["Magtigingsbrief of boedelaanstelling", "Incwadi yegunya noma yokuqokwa kwefa", "Incwadi yegunya namkha yokuqotjhwa kwelifa", "Lengolo la matla kapa la thonyo ya lefa"],
  "Estate authority or Special Indigent supporting document": ["Boedelmagtiging of bewys vir spesiale hulpbehoewendheid", "Igunya lefa noma iphepha elisekela usizo olukhethekile lwabahlwempu", "Igunya lelifa namkha iphepha elisekela isizo elikhethekileko labatlhagako", "Matla a lefa kapa tokomane e tshehetsang thuso e kgethehileng ya ba hlokang"],
  "Guardianship letter or approved authority": ["Voogdybrief of goedgekeurde magtiging", "Incwadi yobuqaphi noma igunya eligunyaziwe", "Incwadi yokutlhogomela namkha igunya elivunyelweko", "Lengolo la bohlokomedi kapa matla a amohetsweng"],
  "Certified divorce decree recording the property award": ["Gesertifiseerde egskeidingsbevel wat die eiendom toeken", "Umyalelo wesehlukaniso oqinisekisiwe onikeza indawo", "Umyalelo wesehlukaniso oqinisekisiweko onikela indawo", "Taelo ya tlhalo e netefaditsweng e bontshang kabo ya thepa"],
  "Municipal residential lease or source confirmation": ["Munisipale woonhuurkontrak of bronbevestiging", "Isivumelwano sokuqasha ikhaya likamasipala noma ukuqinisekiswa komthombo", "Isivumelwano sokuqatjha ikhaya likamasipala namkha ukuqinisekiswa komthombo", "Tumellano ya ho hira lehae la masepala kapa netefatso ya mohlodi"],
};

const compiled = Object.entries(translations).map(([source, values]) => {
  const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { source, values, pattern: new RegExp("^" + escaped.replace(/\\\{\d+\\\}/g, "([\\s\\S]+?)") + "$") };
});

export function translate(text: string, language = "en"): string {
  const index = ["af", "zu", "nr", "st"].indexOf(language);
  if (index < 0) return text;
  const exact = translations[text];
  if (exact) return exact[index];
  for (const entry of compiled) {
    if (!entry.source.includes("{0}")) continue;
    const match = text.match(entry.pattern);
    if (match) return entry.values[index].replace(/\{(\d+)\}/g, (_, slot) => {
      const value = match[Number(slot) + 1];
      // Only translate recognised built-in values; names and references remain unchanged.
      const slotNumber = Number(slot);
      const translatable = value === "the applicant" || value === "this adult" ||
        entry.source.startsWith("Upload ") || entry.source.startsWith("Received:") ||
        (entry.source.startsWith("Proof of ") && slotNumber === 1) ||
        (entry.source.startsWith("{0} is currently") && slotNumber === 1);
      if (!translatable) return value;
      const incomeLabel = incomeLabels[value];
      return translate(incomeLabel || value, language);
    });
  }
  return text;
}

const incomeLabels: Record<string, string> = {
  "salary wages": "Salary or wages", "casual temporary work": "Casual or temporary work",
  "self employment": "Self-employment or informal trade", "pension": "Pension",
  "social grant": "Social grant", "rental income": "Rent or board",
  "maintenance support": "Maintenance or support", "other regular income": "Other income",
};
const summaryValues: Record<string, string> = {
  OWNER: "I own the property", JOINT_OWNER: "I jointly own the property", ACCOUNT_HOLDER: "The municipal account is in my name",
  MUNICIPAL_TENANT: "I rent a municipal property", ESTATE: "I am dealing with a deceased estate", HEIR: "I am an heir or successor",
  GUARDIAN: "I am the household guardian", DIVORCE: "The property was awarded to me in a divorce", CAPACITY_HELP: "None of these / I need help",
  YES: "Yes", NO: "No", AWAY: "Temporarily away", HELP: "I’m not sure / help",
  HOME: "Only as a home", SMALL_BUSINESS: "Home with a small business", BUSINESS: "Mainly for business", RENTED: "Rented to someone else", OTHER: "Other / not sure",
};

export function localizeReply(reply: ChatReply): ChatReply {
  if (reply.localized) return reply;
  const language = reply.language || "en";
  const t = (text: string) => translate(text, language);
  return {
    ...reply,
    localized: true,
    message: t(reply.message),
    placeholder: reply.placeholder ? t(reply.placeholder) : undefined,
    choices: reply.choices?.map(choice => ({ ...choice, label: t(choice.label), description: choice.description ? t(choice.description) : undefined })),
    requirements: reply.requirements?.map(item => ({ ...item, label: t(item.label) })),
    summary: reply.summary ? Object.fromEntries(Object.entries(reply.summary).map(([key, value]) => {
      const preserved = ["Applicant", "Property", "Declared gross monthly household income"].includes(key);
      const rendered = typeof value === "string" && !preserved ? t(summaryValues[value] || value) : value;
      return [t(key), rendered];
    })) : undefined,
  };
}
