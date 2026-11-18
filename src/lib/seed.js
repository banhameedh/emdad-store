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

export const SEED_PRODUCTS = [
  {
    "id": "signage-1",
    "categoryId": "signage",
    "name": "الحروف البارزة المضيئة",
    "desc": "ستيل / أكريلك · إضاءة LED",
    "image": "assets/images/letters-channel-letter-a-gold-halo.jpg",
    "price": null,
    "order": 1,
    "active": true
  },
  {
    "id": "signage-2",
    "categoryId": "signage",
    "name": "لوحات الواجهات",
    "desc": "زنكور بإضاءة أمامية وخلفية",
    "image": "assets/images/letters-3d-illuminated-store-signage.jpg",
    "price": null,
    "order": 2,
    "active": true
  },
  {
    "id": "signage-3",
    "categoryId": "signage",
    "name": "واجهات الكلادينج",
    "desc": "تصميم وتنفيذ وتركيب",
    "image": "assets/images/facade-hypermarket-green-night.jpg",
    "price": null,
    "order": 3,
    "active": true
  },
  {
    "id": "signage-4",
    "categoryId": "signage",
    "name": "البايلون والتوتم",
    "desc": "لوحات طرق ومداخل",
    "image": "assets/images/pylon-almahwa-desert-highway-monument.jpg",
    "price": null,
    "order": 4,
    "active": true
  },
  {
    "id": "signage-5",
    "categoryId": "signage",
    "name": "اللوحات الإرشادية",
    "desc": "للمستشفيات والمنشآت",
    "image": "assets/images/wayfinding-oqla-hospital-monument-sign.jpg",
    "price": null,
    "order": 5,
    "active": true
  },
  {
    "id": "printing-1",
    "categoryId": "printing",
    "name": "البنرات والفليكس",
    "desc": "داخلي وخارجي · مقاسات حسب الطلب",
    "image": "assets/images/p23-05.jpg",
    "price": null,
    "order": 1,
    "active": true
  },
  {
    "id": "printing-2",
    "categoryId": "printing",
    "name": "الاستيكرات",
    "desc": "فينيل لامع / مطفي · قص كنتور",
    "image": "assets/images/retail-petrogen-fuel-dispenser-sticker.jpg",
    "price": null,
    "order": 2,
    "active": true
  },
  {
    "id": "printing-3",
    "categoryId": "printing",
    "name": "طباعة الرول أب",
    "desc": "85×200 سم · مع الحامل",
    "image": "assets/images/profile-p38-01.jpg",
    "price": null,
    "order": 3,
    "active": true
  },
  {
    "id": "printing-4",
    "categoryId": "printing",
    "name": "ملصقات المنتجات",
    "desc": "ورق / بلاستيك · مقاوم للماء",
    "image": "assets/images/branding-acrylic-business-card-display.jpg",
    "price": null,
    "order": 4,
    "active": true
  },
  {
    "id": "gifts-1",
    "categoryId": "gifts",
    "name": "دروع التكريم",
    "desc": "كريستال · ذهبي · خشب",
    "image": "assets/images/awards-luxury-gold-crystal-reem-trophy.jpg",
    "price": null,
    "order": 1,
    "active": true
  },
  {
    "id": "gifts-2",
    "categoryId": "gifts",
    "name": "الأختام الفاخرة",
    "desc": "مقابض كريستال",
    "image": "assets/images/branding-luxury-crystal-office-stamps.jpg",
    "price": null,
    "order": 2,
    "active": true
  },
  {
    "id": "gifts-3",
    "categoryId": "gifts",
    "name": "علب الهدايا المطبوعة",
    "desc": "تغليف بهوية الجهة",
    "image": "assets/images/branding-packaging-gift-box-design.jpg",
    "price": null,
    "order": 3,
    "active": true
  },
  {
    "id": "gifts-4",
    "categoryId": "gifts",
    "name": "الهدايا التذكارية",
    "desc": "أكواب · أقلام · شنط",
    "image": "assets/images/p21-02.jpg",
    "price": null,
    "order": 4,
    "active": true
  },
  {
    "id": "craft-1",
    "categoryId": "craft",
    "name": "اللوحات الفنية المؤطرة",
    "desc": "طباعة فنية بإطار خشبي",
    "image": "assets/images/03_Framed_Arabian_Horse.jpg",
    "price": null,
    "order": 1,
    "active": true
  },
  {
    "id": "craft-2",
    "categoryId": "craft",
    "name": "المجسمات والستاندات",
    "desc": "فوركس · خشب · فلين",
    "image": "assets/images/p13-03.jpg",
    "price": null,
    "order": 2,
    "active": true
  },
  {
    "id": "craft-3",
    "categoryId": "craft",
    "name": "المنصات والبوديوم",
    "desc": "تصميم حسب المناسبة",
    "image": "assets/images/booth-customer-service-curved-counter.jpg",
    "price": null,
    "order": 3,
    "active": true
  },
  {
    "id": "events-1",
    "categoryId": "events",
    "name": "بوابات الفعاليات",
    "desc": "مداخل مطبوعة بهوية المناسبة",
    "image": "assets/images/booth-national-day-entrance-portal.jpg",
    "price": null,
    "order": 1,
    "active": true
  },
  {
    "id": "events-2",
    "categoryId": "events",
    "name": "البوثات الترويجية",
    "desc": "ستاند متنقل مع طاولة",
    "image": "assets/images/booth-national-day-promotional-stand.jpg",
    "price": null,
    "order": 2,
    "active": true
  },
  {
    "id": "events-3",
    "categoryId": "events",
    "name": "أركان المعارض",
    "desc": "تصميم ثلاثي الأبعاد وتنفيذ",
    "image": "assets/images/profile-p32-01.jpg",
    "price": null,
    "order": 3,
    "active": true
  },
  {
    "id": "events-4",
    "categoryId": "events",
    "name": "بوابات التدشين",
    "desc": "للمشاريع والافتتاحات",
    "image": "assets/images/booth-exhibition-corridor-setup.jpg",
    "price": null,
    "order": 4,
    "active": true
  },
  {
    "id": "design-1",
    "categoryId": "design",
    "name": "الهوية البصرية",
    "desc": "شعار + دليل استخدام + تطبيقات",
    "image": "assets/images/p21-02.jpg",
    "price": null,
    "order": 1,
    "active": true
  },
  {
    "id": "design-2",
    "categoryId": "design",
    "name": "التصميم ثلاثي الأبعاد",
    "desc": "بوثات وواجهات ومجسمات",
    "image": "assets/images/p27-03.jpg",
    "price": null,
    "order": 2,
    "active": true
  },
  {
    "id": "design-3",
    "categoryId": "design",
    "name": "منشورات السوشال ميديا",
    "desc": "باقات شهرية",
    "image": "assets/images/profile-p38-01.jpg",
    "price": null,
    "order": 3,
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
  googleRating: 4.8,
  googleRatingCount: 3260,
  googleUrl: '',
  showLoyalty: true,
  // 0 = الأحد … 6 = السبت — ساعات 24 (open/close)، أو { closed: true }
  hours: {
    "0": {
      "open": 8,
      "close": 23
    },
    "1": {
      "open": 8,
      "close": 23
    },
    "2": {
      "open": 8,
      "close": 23
    },
    "3": {
      "open": 8,
      "close": 23
    },
    "4": {
      "open": 8,
      "close": 23
    },
    "5": {
      "open": 16,
      "close": 23
    },
    "6": {
      "open": 8,
      "close": 23
    }
  }
};

