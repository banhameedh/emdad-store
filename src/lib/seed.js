/* بيانات أولية مأخوذة من النموذج التفاعلي (alimdadat.sa).
 * تُستخدم في حالتين: (1) زر «استيراد البيانات الأولية» في لوحة التحكم لتعبئة Firestore،
 * (2) احتياطيًا لعرض المتجر إن لم تُضبط إعدادات Firebase بعد. */

export const SEED_CATEGORIES = [
  {
    "id": "signage",
    "name": "اللوحات الإعلانية والإرشادية",
    "short": "لوحات\nوواجهات",
    "tag": "حضور يُرى. وهوية تُعرف.",
    "desc": "نحوّل هويتك إلى حضور واضح في المكان، من لوحات الواجهات إلى حلول الإرشاد وتسوير المشاريع.",
    "image": "assets/images/letters-oqla-hospital-new-angle-1.jpg",
    "items": [
      "الحروف البارزة",
      "لوحات الأكريلك",
      "لوحات الفليكس",
      "تسوير المشاريع والمواقع الإنشائية",
      "لوحات المكاتب",
      "لوحات الحديد والخشب",
      "لوحات المشاريع",
      "لوحات الشوارع",
      "لوحات المحلات",
      "لوحات الزنكور بإضاءة أمامية وخلفية",
      "حروف بارزة ستيل ذهبي وفضي",
      "حروف زنكور مدهونة بدون إضاءة",
      "الشعارات واللوحات الداخلية",
      "واجهات الكلادينج",
      "تركيب ودهان الواجهات",
      "لوحات اليونيبول",
      "لوحات البايلون والتوتم",
      "لوحات الموبي والميقا",
      "أعمدة يونيبول المحلات",
      "الشاشات الإعلانية"
    ],
    "works": [
      "assets/images/letters-oqla-hospital-3d-channel-night-front.jpg",
      "assets/images/facade-hypermarket-green-night.jpg",
      "assets/images/pylon-almahwa-desert-highway-monument.jpg"
    ],
    "order": 1,
    "active": true
  },
  {
    "id": "printing",
    "name": "الطباعة الرقمية",
    "short": "طباعة\nرقمية",
    "tag": "تفاصيل واضحة. وألوان تتحدث.",
    "desc": "حلول طباعة للبنرات والفليكس والاستيكرات، تدعم رسالتك الإعلانية في المساحات الداخلية والخارجية.",
    "image": "assets/images/retail-petrogen-fuel-dispenser-sticker.jpg",
    "items": [
      "البنرات",
      "الفليكس",
      "الاستيكرات",
      "طباعة الكانفس",
      "طباعة الوايت فيلم",
      "طباعة وتجهيز الرول أب",
      "استيكرات UV DTF",
      "ملصقات المنتجات",
      "الطباعة والشد والتركيب"
    ],
    "works": [
      "assets/images/p23-05.jpg",
      "assets/images/retail-petrogen-fuel-dispenser-sticker.jpg",
      "assets/images/profile-p38-01.jpg"
    ],
    "order": 2,
    "active": true
  },
  {
    "id": "gifts",
    "name": "الهدايا الدعائية المخصصة",
    "short": "هدايا\nدعائية",
    "tag": "أثر يبقى مع عملائك.",
    "desc": "هدايا تحمل هويتك، من دروع التكريم والهدايا التذكارية إلى المطبوعات على المنتجات اليومية.",
    "image": "assets/images/awards-luxury-gold-crystal-reem-trophy.jpg",
    "items": [
      "دروع التكريم",
      "الطباعة على التيشرتات",
      "الهدايا التذكارية",
      "الأكواب",
      "الأقلام",
      "الشنط القماشية",
      "تصميم وتنفيذ الأختام",
      "الطباعة على القماش والأعلام"
    ],
    "works": [
      "assets/images/awards-luxury-gold-crystal-reem-trophy.jpg",
      "assets/images/branding-luxury-crystal-office-stamps.jpg",
      "assets/images/branding-packaging-gift-box-design.jpg"
    ],
    "order": 3,
    "active": true
  },
  {
    "id": "craft",
    "name": "الأعمال الفنية والمجسمات الخشبية",
    "short": "أعمال فنية\nوخشبية",
    "tag": "من تصور إبداعي إلى قطعة ملموسة.",
    "desc": "تنفيذ المباخر والمكعبات والمجسمات الخشبية، ومجسمات الفلين للمدارس بحسب متطلبات المشروع.",
    "image": "assets/images/03_Framed_Arabian_Horse.jpg",
    "items": [
      "المباخر",
      "المكعبات الخشبية",
      "المجسمات",
      "مجسمات الفلين للمدارس",
      "أعمال الزخارف والقص",
      "الديكورات الهندسية",
      "المنحوتات الخشبية",
      "الاستاندات والطاولات",
      "المنصات والبوديوم",
      "ستاندات الفلين والفوركس"
    ],
    "works": [
      "assets/images/03_Framed_Arabian_Horse.jpg",
      "assets/images/p13-03.jpg",
      "assets/images/booth-customer-service-curved-counter.jpg"
    ],
    "order": 4,
    "active": true
  },
  {
    "id": "events",
    "name": "المعارض والفعاليات والمناسبات",
    "short": "المعارض\nوالفعاليات",
    "tag": "مساحات وتجهيزات تليق بمناسبتك.",
    "desc": "تصميم وتنفيذ البوثات وأركان المعارض والاستقبال، وتجهيز المهرجانات والاحتفالات وخلفيات المنصات والديكورات.",
    "image": "assets/images/booth-national-day-entrance-portal.jpg",
    "items": [
      "تصميم وتنفيذ البوثات والمعارض",
      "تجهيز أركان المعارض والاستقبال",
      "تجهيز المهرجانات والاحتفالات",
      "خلفيات المنصات والفعاليات",
      "المطبوعات والمواد الإعلانية",
      "ديكورات المناسبات"
    ],
    "works": [
      "assets/images/booth-national-day-promotional-stand.jpg",
      "assets/images/profile-p32-01.jpg",
      "assets/images/booth-exhibition-corridor-setup.jpg"
    ],
    "order": 5,
    "active": true
  },
  {
    "id": "design",
    "name": "التصميم والإبداع البصري",
    "short": "التصميم\nوالإبداع",
    "tag": "تصاميم تمنح أفكارك شكلًا واضحًا.",
    "desc": "تصميم الشعارات والهويات البصرية ومنشورات التواصل والبروفايلات والبروشورات، إلى جانب التصميم ثلاثي الأبعاد.",
    "image": "assets/images/p21-02.jpg",
    "items": [
      "الشعارات والهويات البصرية",
      "منشورات السوشال ميديا",
      "البروفايلات والبروشورات",
      "التصميم ثلاثي الأبعاد (3D)",
      "تصميم النقوش والزخارف",
      "تصميم الطاولات والكاونترات"
    ],
    "works": [
      "assets/images/p21-02.jpg",
      "assets/images/p27-03.jpg",
      "assets/images/branding-packaging-gift-box-design.jpg"
    ],
    "order": 6,
    "active": true
  }
];

export const SEED_PORTFOLIO = [
  {
    "id": "pf-01",
    "image": "assets/images/facade-hypermarket-green-night.jpg",
    "title": "الكلادينج والواجهات",
    "desc": "واجهات تحمل هوية المكان",
    "group": "الكلادينج والواجهات",
    "height": 190,
    "order": 1,
    "active": true
  },
  {
    "id": "pf-02",
    "image": "assets/images/p21-02.jpg",
    "title": "الهويات التجارية",
    "desc": "هوية متكاملة في كل تفصيل",
    "group": "الهويات التجارية",
    "height": 120,
    "order": 2,
    "active": true
  },
  {
    "id": "pf-03",
    "image": "assets/images/letters-channel-letter-r-orange-acrylic.jpg",
    "title": "الحروف البارزة",
    "desc": "حروف تضيف بُعدًا لهويتك",
    "group": "الحروف البارزة",
    "height": 160,
    "order": 3,
    "active": true
  },
  {
    "id": "pf-04",
    "image": "assets/images/booth-national-day-entrance-portal.jpg",
    "title": "بوثات المعارض",
    "desc": "مساحات تروي حكاية العلامة",
    "group": "بوثات المعارض",
    "height": 200,
    "order": 4,
    "active": true
  },
  {
    "id": "pf-05",
    "image": "assets/images/pylon-almahwa-desert-highway-monument.jpg",
    "title": "لوحات اليونيبول والبايلون",
    "desc": "حضور إعلاني على امتداد الطريق",
    "group": "اليونيبول والبايلون",
    "height": 200,
    "order": 5,
    "active": true
  },
  {
    "id": "pf-06",
    "image": "assets/images/wayfinding-oqla-hospital-monument-sign.jpg",
    "title": "اللوحات الإرشادية",
    "desc": "وجهة واضحة من النظرة الأولى",
    "group": "اللوحات الإرشادية",
    "height": 150,
    "order": 6,
    "active": true
  },
  {
    "id": "pf-07",
    "image": "assets/images/p23-05.jpg",
    "title": "البنرات والاستيكرات",
    "desc": "الرسالة في مكانها الصحيح",
    "group": "البنرات والاستيكرات",
    "height": 130,
    "order": 7,
    "active": true
  },
  {
    "id": "pf-08",
    "image": "assets/images/branding-luxury-crystal-office-stamps.jpg",
    "title": "الدروع والهدايا",
    "desc": "أعمال الدروع والهدايا",
    "group": "الدروع والهدايا",
    "height": 170,
    "order": 8,
    "active": true
  },
  {
    "id": "pf-09",
    "image": "assets/images/03_Framed_Arabian_Horse.jpg",
    "title": "الأعمال الخشبية والقص",
    "desc": "أعمال الخشب والزخارف والقص",
    "group": "الأعمال الخشبية",
    "height": 190,
    "order": 9,
    "active": true
  },
  {
    "id": "pf-10",
    "image": "assets/images/letters-eve-association-gold-backlit.jpg",
    "title": "الحروف البارزة",
    "desc": "حروف تضيف بُعدًا لهويتك",
    "group": "الحروف البارزة",
    "height": 120,
    "order": 10,
    "active": true
  },
  {
    "id": "pf-11",
    "image": "assets/images/facade-alsaleh-fruits-store.jpg",
    "title": "الكلادينج والواجهات",
    "desc": "واجهات تحمل هوية المكان",
    "group": "الكلادينج والواجهات",
    "height": 150,
    "order": 11,
    "active": true
  },
  {
    "id": "pf-12",
    "image": "assets/images/booth-national-day-promotional-stand.jpg",
    "title": "بوثات المعارض",
    "desc": "مساحات تروي حكاية العلامة",
    "group": "بوثات المعارض",
    "height": 180,
    "order": 12,
    "active": true
  }
];

export const SEED_SETTINGS = {
  storeName: 'الإمدادات الذكية الحديثة',
  legalName: 'مؤسسة الإمدادات الذكية الحديثة للدعاية والإعلان',
  // بيانات تُدخلها الإدارة (تظهر للزائر كحقل بانتظار الاعتماد حتى تُعبّأ)
  email: '',
  crNumber: '',
  vatNumber: '',
  phone: '0573838818',
  whatsapp: '966573838818',
  mapsUrl: 'https://maps.app.goo.gl/MUCBUbeKTxsrvJK98',
  address: 'منطقة القصيم، محافظة عقلة الصقور، بجوار البنك الأهلي السعودي',
  branchName: 'المقر الرئيسي — عقلة الصقور',
  city: 'عقلة الصقور',
  snapchat: 'https://www.snapchat.com/@emdad_ads',
  tiktok: 'https://www.tiktok.com/@emdad_ads',
  instagram: '',
  youtube: '',
  // التقييم في النموذج الأولي كان افتراضيًا؛ يُدخل التقييم الفعلي من لوحة التحكم
  googleRating: null,
  googleRatingCount: null,
  googleUrl: '',
  // برنامج الولاء تجريبي (نقاط محلية دون نظام فعلي) — مخفي حتى تُعتمد قواعده ويُربط بنظام نقاط
  showLoyalty: false,
  // شعارات بوابات الدفع (مدى، Apple Pay…) تُخفى حتى يُفعَّل الدفع الإلكتروني فعليًا
  showPaymentLogos: false,
  // التسعير
  vatRate: 15,
  pricesIncludeVat: true,
  pricesApprovedNote: 'الأسعار المعلَّمة «سعر مبدئي» تقديرية وتُؤكد قبل التنفيذ.',
  // طرق الدفع الفعلية (لا تتطلب بوابة دفع)
  payments: { cod: true, store: true, bank: false },
  bankName: '', iban: '', accountName: '',
  // الاستلام والتوصيل
  pickupEnabled: true,
  deliveryEnabled: true,
  deliveryFee: null, // null = تُحدد حسب المدينة وتُؤكد قبل التنفيذ
  // سلايدر الرئيسية (قابل للتعديل من لوحة التحكم ← الإعدادات). link = مسار داخل المتجر مثل category/printing
  heroSlides: [
    { title: 'حلول الطباعة والتصميم باحترافية', desc: 'نصمم ونطبع هويتك ونحول أفكارك إلى واقع.', cta: 'اكتشف خدمات الطباعة', link: 'category/printing', image: 'assets/images/profile-p38-01.jpg' },
    { title: 'اجعل علامتك التجارية أكثر حضورًا', desc: 'لوحات إعلانية وواجهات احترافية بجودة عالية.', cta: 'استكشف خدمات اللوحات', link: 'category/signage', image: 'assets/images/letters-oqla-hospital-3d-channel-night-front.jpg' },
    { title: 'هدايا دعائية تترك أثرًا', desc: 'منتجات دعائية مخصصة تعزز حضور علامتك التجارية.', cta: 'تسوق الآن', link: 'shop/cat:gifts', image: 'assets/images/awards-luxury-gold-crystal-reem-trophy.jpg' },
    { title: 'جميع احتياجات منشأتك في مكان واحد', desc: 'نوفر حلول التجهيز والتوريد والطباعة بمختلف أنواعها.', cta: 'اكتشف خدماتنا', link: 'services', image: 'assets/images/facade-emdad-building-and-fleet.jpg' },
  ],
  heroInterval: 4.5,
  // الصيانة
  maintenance: false,
  maintenanceMessage: 'نعمل على تحديث المتجر لخدمتكم بشكل أفضل، وسنعود قريبًا.',
  // 0 = الأحد … 6 = السبت — ساعات 24 (open/close)، أو { closed: true }
  hours: { 0: { open: 8, close: 23 }, 1: { open: 8, close: 23 }, 2: { open: 8, close: 23 }, 3: { open: 8, close: 23 }, 4: { open: 8, close: 23 }, 5: { open: 16, close: 23 }, 6: { open: 8, close: 23 } },
  hoursApproved: false,
};

/* استخدامات ومميزات كل قسم (صفحة «خدماتنا») */
const CATEGORY_EXTRA = {
  signage: { uses: ['واجهات المحلات والمراكز التجارية', 'المستشفيات والجهات الحكومية', 'المشاريع الإنشائية والطرق'], benefits: ['تصميم وتصنيع وتركيب من جهة واحدة', 'خامات وإضاءة مناسبة للأجواء الخارجية', 'لوحات إرشادية بدليل هوية موحد'] },
  printing: { uses: ['الحملات الإعلانية والعروض', 'الفعاليات والمعارض', 'تغليف المنتجات وتمييزها'], benefits: ['طباعة عالية الدقة بألوان ثابتة', 'مقاسات حسب الطلب', 'تنفيذ سريع للكميات الصغيرة والكبيرة'] },
  gifts: { uses: ['حفلات التكريم والتخرج', 'المؤتمرات والمعارض', 'هدايا العملاء والموظفين'], benefits: ['تخصيص كامل بالشعار والنص', 'خيارات خامات متعددة', 'تغليف بهوية الجهة'] },
  craft: { uses: ['المجالس والمكاتب', 'الأنشطة المدرسية', 'نقاط البيع والحملات'], benefits: ['قص دقيق للخشب والفوركس والفلين', 'تصاميم مخصصة حسب المناسبة', 'تشطيبات فنية متقنة'] },
  events: { uses: ['المناسبات الوطنية والمهرجانات', 'المعارض والمؤتمرات', 'التدشين والافتتاحات'], benefits: ['تصميم ثلاثي الأبعاد قبل التنفيذ', 'تركيب وفك في الموقع', 'تجهيز متكامل بهوية المناسبة'] },
  design: { uses: ['المشاريع الناشئة', 'الشركات التي تحدّث هويتها', 'حسابات التواصل الاجتماعي'], benefits: ['هوية متكاملة بدليل استخدام', 'ملفات جاهزة للطباعة والنشر', 'جولات تعديل واضحة'] },
};
SEED_CATEGORIES.forEach((c) => Object.assign(c, CATEGORY_EXTRA[c.id] || {}));

export { SEED_PRODUCTS } from './seed-products.js';
export { SEED_PAGES, POLICY_PAGES } from './seed-pages.js';
