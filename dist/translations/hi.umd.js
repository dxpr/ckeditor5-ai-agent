
( e => {
const { [ 'hi' ]: { dictionary, getPluralForm } } = {"hi":{"dictionary":{"Ai assist":"Ai सहायक","Type / to request AI content":"एआई सामग्री के लिए अनुरोध करने हेतु / टाइप करें","Browser does not support readable streams":"ब्राउज़र पठनीय स्ट्रीम्स का समर्थन नहीं करता","Oops! Something went wrong while processing your request":"ओह! आपकी अनुरोध को संसाधित करते समय कुछ गलत हुआ","An error occurred while handling the AI's response":"एआई की प्रतिक्रिया को संभालते समय एक त्रुटि हुई","We couldn't connect to the AI. Please check your internet":"हम एआई से कनेक्ट नहीं हो सके। कृपया अपनी इंटरनेट कनेक्शन की जाँच करें","Unsupported language code":"असमर्थित भाषा कोड","Failed to fetch content of : %0":"सामग्री को प्राप्त करने में विफल हुआ: %0"},getPluralForm(n){return (n > 1);}}};
e[ 'hi' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'hi' ].dictionary = Object.assign( e[ 'hi' ].dictionary, dictionary );
e[ 'hi' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
