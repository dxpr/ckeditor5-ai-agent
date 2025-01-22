module.exports = function( config ) {
	config.set( {
		// Other configurations...
		browsers: [ 'ChromeHeadless' ],
		customLaunchers: {
			ChromeHeadless: {
				base: 'ChromeHeadless',
				flags: [ '--no-sandbox', '--disable-gpu' ]
			}
		}
	} );
};
