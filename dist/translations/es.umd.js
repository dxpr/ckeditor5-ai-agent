
( e => {
const { [ 'es' ]: { dictionary, getPluralForm } } = {"es":{"dictionary":{"Ai assist":"Asistente AI","Type / to request AI content":"Escribe / para solicitar contenido de AI","Browser does not support readable streams":"El navegador no soporta flujos legibles","Oops! Something went wrong while processing your request":"¡Ups! Algo salió mal al procesar tu solicitud","An error occurred while handling the AI's response":"Ocurrió un error al manejar la respuesta de la AI","We couldn't connect to the AI. Please check your internet":"No pudimos conectarnos a la AI. Por favor, verifica tu conexión a internet","Unsupported language code":"Código de idioma no soportado","Failed to fetch content of : %0":"No se pudo obtener el contenido de : %0"},getPluralForm(n){return (n > 1);}}};
e[ 'es' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'es' ].dictionary = Object.assign( e[ 'es' ].dictionary, dictionary );
e[ 'es' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
