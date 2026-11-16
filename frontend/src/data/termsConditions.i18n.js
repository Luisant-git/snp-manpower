import KN_TERMS from './termsConditions.kn.js';
import HI_TERMS from './termsConditions.hi.js';
import TE_TERMS from './termsConditions.te.js';
import TA_TERMS from './termsConditions.ta.js';

/* Localised legal content for the Terms & Conditions card and modal. */
export const TERMS_TRANSLATIONS = {
  kn: KN_TERMS,
  hi: HI_TERMS,
  te: TE_TERMS,
  ta: TA_TERMS,
};

/* Localised interface strings used around the terms content. */
export const TERMS_UI = {
  en: {
    heading: 'Terms & Conditions',
    view: 'View',
    acceptedFor: 'Terms & Conditions accepted for {label}.',
    notRecorded: 'Terms & Conditions acceptance was not recorded for this application.',
    readAgree: 'I have read and agree to the Terms & Conditions.',
    declaration: 'Declaration',
    accepted: 'Accepted',
    readAll: 'Please read all terms before accepting.',
    close: 'Close',
    agree: 'I Agree',
    closeAria: 'Close terms and conditions',
  },
  kn: {
    heading: 'ನಿಯಮ ಮತ್ತು ಷರತ್ತುಗಳು',
    view: 'ನೋಡಿ',
    acceptedFor: '{label} ಗಾಗಿ ನಿಯಮ ಮತ್ತು ಷರತ್ತುಗಳನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ.',
    notRecorded: 'ಈ ಅರ್ಜಿಗೆ ನಿಯಮ ಮತ್ತು ಷರತ್ತುಗಳ ಸ್ವೀಕೃತಿ ದಾಖಲಾಗಿಲ್ಲ.',
    readAgree: 'ನಾನು ನಿಯಮ ಮತ್ತು ಷರತ್ತುಗಳನ್ನು ಓದಿ ಒಪ್ಪುತ್ತೇನೆ.',
    declaration: 'ಘೋಷಣೆ',
    accepted: 'ಸ್ವೀಕರಿಸಲಾಗಿದೆ',
    readAll: 'ಸ್ವೀಕರಿಸುವ ಮೊದಲು ಎಲ್ಲಾ ನಿಯಮಗಳನ್ನು ಓದಿ.',
    close: 'ಮುಚ್ಚಿ',
    agree: 'ನಾನು ಒಪ್ಪುತ್ತೇನೆ',
    closeAria: 'ನಿಯಮ ಮತ್ತು ಷರತ್ತುಗಳನ್ನು ಮುಚ್ಚಿ',
  },
  hi: {
    heading: 'नियम एवं शर्तें',
    view: 'देखें',
    acceptedFor: '{label} के लिए नियम एवं शर्तें स्वीकृत हैं।',
    notRecorded: 'इस आवेदन के लिए नियम एवं शर्तों की स्वीकृति दर्ज नहीं की गई।',
    readAgree: 'मैंने नियम एवं शर्तें पढ़ ली हैं और उनसे सहमत हूँ।',
    declaration: 'घोषणा',
    accepted: 'स्वीकृत',
    readAll: 'स्वीकार करने से पहले सभी शर्तें पढ़ें।',
    close: 'बंद करें',
    agree: 'मैं सहमत हूँ',
    closeAria: 'नियम एवं शर्तें बंद करें',
  },
  te: {
    heading: 'నిబంధనలు & షరతులు',
    view: 'చూడండి',
    acceptedFor: '{label} కోసం నిబంధనలు & షరతులు అంగీకరించబడ్డాయి.',
    notRecorded: 'ఈ దరఖాస్తుకు నిబంధనలు & షరతుల అంగీకారం నమోదు చేయలేదు.',
    readAgree: 'నేను నిబంధనలు & షరతులను చదివి అంగీకరిస్తున్నాను.',
    declaration: 'ప్రకటన',
    accepted: 'అంగీకరించబడింది',
    readAll: 'అంగీకరించే ముందు అన్ని నిబంధనలను చదవండి.',
    close: 'మూసివేయి',
    agree: 'నేను అంగీకరిస్తున్నాను',
    closeAria: 'నిబంధనలు & షరతులను మూసివేయి',
  },
  ta: {
    heading: 'விதிமுறைகள் & நிபந்தனைகள்',
    view: 'பார்',
    acceptedFor: '{label} க்கான விதிமுறைகள் & நிபந்தனைகள் ஏற்கப்பட்டுள்ளன.',
    notRecorded: 'இந்த விண்ணப்பத்திற்கு விதிமுறைகள் & நிபந்தனைகளின் ஏற்பு பதிவு செய்யப்படவில்லை.',
    readAgree: 'நான் விதிமுறைகள் & நிபந்தனைகளைப் படித்து ஏற்றுக்கொள்கிறேன்.',
    declaration: 'உறுதிமொழி',
    accepted: 'ஏற்கப்பட்டது',
    readAll: 'ஏற்றுக்கொள்வதற்கு முன் அனைத்து விதிமுறைகளையும் படிக்கவும்.',
    close: 'மூடு',
    agree: 'நான் ஏற்கிறேன்',
    closeAria: 'விதிமுறைகள் & நிபந்தனைகளை மூடு',
  },
};

export function getTermsUi(lang = 'en') {
  return TERMS_UI[lang] || TERMS_UI.en;
}
