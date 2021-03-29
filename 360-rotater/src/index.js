import './scss/style.scss';

const canvasImageRotator = {
	init: ( objSettings ) => {
		canvasImageRotator.canvasSettings = objSettings;

		if ( canvasImageRotator.canvasSettings.selectorId ) {
			canvasImageRotator.canvasElement = document.getElementById( canvasImageRotator.canvasSettings.selectorId );
		}

		if ( !canvasImageRotator.canvasElement ) {
			return;
		}

		canvasImageRotator.canvasContext = canvasImageRotator.canvasElement.getContext( '2d' );
		canvasImageRotator.load();
		canvasImageRotator.buildMarkup();
		canvasImageRotator.bindEvents();
		canvasImageRotator.makePublic();
	},
	makePublic: () => {
		window.canvasImageRotator = canvasImageRotator;
	},
	update: ( objNewSettings ) => {
		var objUpdatedSettings = Object.assign( canvasImageRotator.canvasSettings, objNewSettings );
		canvasImageRotator.load( objUpdatedSettings );
	},
	destroy: () => {

	},
	load: ( objSettings = null ) => {
		if ( objSettings !== null ) {
			canvasImageRotator.canvasSettings = Object.assign( canvasImageRotator.canvasSettings, objSettings );
		}
		canvasImageRotator.canvasElement.width = canvasImageRotator.canvasSettings.width;
		canvasImageRotator.canvasElement.height = canvasImageRotator.canvasSettings.height;

		canvasImageRotator.currentIndex = 0;

		canvasImageRotator.preload().then( ( results ) => {
			let loader = document.querySelector( '.canvas-image-rotator-loader' );
			canvasImageRotator.imageList = results;
			canvasImageRotator.canvasElement.width = canvasImageRotator.imageList[ 0 ].naturalWidth;
			canvasImageRotator.canvasElement.height = canvasImageRotator.imageList[ 0 ].naturalHeight;
			canvasImageRotator.canvasElement.style.maxWidth = canvasImageRotator.imageList[ 0 ].naturalWidth + 'px';
			canvasImageRotator.canvasElement.style.maxHeight = canvasImageRotator.imageList[ 0 ].naturalHeight + 'px';
			loader.classList.remove( 'is-loading' );
			canvasImageRotator.loadFrame( 0, canvasImageRotator.animate );
		} );

	},
	getImageList: () => {
		const settings = canvasImageRotator.canvasSettings;
		let imageArray = [];

		for ( let i = 0; i < settings.count; i++ ) {
			let leadingZeros = '';
			if ( settings.leadingZeros && settings.leadingZeros > 0 ) {

				for ( let j = 1; j < settings.leadingZeros; j++ ) {
					leadingZeros += '0';
				}

				if ( i > ( 9 - 1 ) || i > ( 99 - 1 ) || i > ( 999 - 1 ) ) {
					leadingZeros = leadingZeros.substring( 0, leadingZeros.length - 1 )
				}
			}

			const imagePath = settings.src + settings.prefix + leadingZeros + ( i + 1 ) + settings.postfix + '.' + settings.extension;
			imageArray[ i ] = new Image();
			imageArray[ i ].src = imagePath;
		}

		return imageArray;
	},
	preload: () => {
		const imageArray = canvasImageRotator.getImageList();
		let promises;

		promises = imageArray.map( ( image ) => {
			return new Promise( ( resolve ) => {
				image.onload = () => {
					resolve( image );
				};
			} );
		} );
		return Promise.all( promises ).then( ( results ) => {
			return results;
		} );
	},
	animate: () => {
		canvasImageRotator.interval = setInterval( () => {
			if ( canvasImageRotator.currentIndex === canvasImageRotator.imageList.length - 1 ) {
				clearInterval( canvasImageRotator.interval );
			}
			let nextIndex = canvasImageRotator.getNextIndex();
			canvasImageRotator.loadFrame( nextIndex );
		}, canvasImageRotator.canvasSettings.animateSpeed * 10 );
	},
	loadFrame: ( imageIndex, fnCallback ) => {
		const imageElement = canvasImageRotator.imageList[ imageIndex ];
		const scale = Math.min( canvasImageRotator.canvasElement.width / imageElement.width, canvasImageRotator.canvasElement.height / imageElement.height );

		const x = ( canvasImageRotator.canvasElement.width / 2 ) - ( imageElement.width / 2 ) * scale;
		const y = ( canvasImageRotator.canvasElement.height / 2 ) - ( imageElement.height / 2 ) * scale;

		canvasImageRotator.canvasContext.drawImage( imageElement, x, y, imageElement.width * scale, imageElement.height * scale );

		if ( canvasImageRotator.canvasSettings.showIndicator === true ) {
			let indicator = document.querySelector( '.canvas-image-rotator-nav-indicator' );
			indicator.value = imageIndex;
		}

		if ( typeof fnCallback === 'function' ) {
			fnCallback();
		}

	},
	getNextIndex: ( event = null ) => {
		const currentIndex = canvasImageRotator.currentIndex;
		let nextIndex = null;

		if ( event !== null ) {
			if ( canvasImageRotator.mouseDirection === 'right' ) {
				nextIndex = currentIndex + 1
			} else {
				nextIndex = currentIndex - 1
			}

		} else {
			nextIndex = currentIndex + 1
		}

		if ( nextIndex < 0 ) {
			nextIndex = canvasImageRotator.imageList.length - 1;
		} else if ( nextIndex > ( canvasImageRotator.imageList.length - 1 ) ) {
			nextIndex = 0;
		}
		canvasImageRotator.currentIndex = nextIndex;

		return nextIndex;
	},
	buildMarkup: () => {
		let canvasWrapper = document.createElement( 'div' );
		canvasWrapper.className = 'canvas-image-rotator-container';
		canvasImageRotator.canvasElement.parentNode.appendChild( canvasWrapper );
		canvasWrapper.appendChild( canvasImageRotator.canvasElement );

		let canvasLoader = document.createElement( 'div' );
		canvasLoader.className = 'canvas-image-rotator-loader is-loading';
		canvasWrapper.appendChild( canvasLoader );
		canvasImageRotator.buildNavigation();

	},
	buildNavigation() {
		const canvasWrapper = document.querySelector('.canvas-image-rotator-container');
		if ( canvasImageRotator.canvasSettings.showArrows === true ) {
			let navContainer = document.createElement( 'div' );
			navContainer.className = 'canvas-image-rotator-nav';
			for ( let i = 0; i < 2; i++ ) {
				( ( count ) => {
					let arrow = document.createElement( 'a' );
					arrow.className = 'canvas-image-rotator-nav-item ' + ( count === 0 ? 'left' : 'right' );
					navContainer.appendChild( arrow );
					if ( canvasImageRotator.canvasSettings.showIndicator === true && count === 0 ) {
						let indicator = document.createElement( 'input' );
						indicator.type = 'range';
						indicator.min = 0;
						indicator.max = ( canvasImageRotator.canvasSettings.count - 1 );
						indicator.step = 1;
						indicator.value = canvasImageRotator.currentIndex;
						indicator.className = 'canvas-image-rotator-nav-indicator';
						navContainer.appendChild( indicator );
					}
				} )( i );
			}
			canvasWrapper.appendChild( navContainer );
		}
	},
	bindEvents: () => {
		let navigation = document.querySelectorAll( '.canvas-image-rotator-nav-item' );

		if ( navigation !== null ) {

			//navigation
			navigation.forEach( ( domElm ) => {
				domElm.addEventListener( 'mousedown', ( event ) => {
					canvasImageRotator.navigationInterval = setInterval( () => {
						if ( event.target.className.indexOf( 'left' ) > -1 ) {
							canvasImageRotator.mouseDirection = 'left';

						} else if ( event.target.className.indexOf( 'right' ) > -1 ) {
							canvasImageRotator.mouseDirection = 'right';
						}
						let nextIndex = canvasImageRotator.getNextIndex( event );
						canvasImageRotator.loadFrame( nextIndex );
					}, canvasImageRotator.canvasSettings.animateSpeed )
				} );
				domElm.addEventListener( 'touchstart', ( event ) => {
					canvasImageRotator.navigationInterval = setInterval( () => {
						if ( event.target.className.indexOf( 'left' ) > -1 ) {
							canvasImageRotator.mouseDirection = 'left';

						} else if ( event.target.className.indexOf( 'right' ) > -1 ) {
							canvasImageRotator.mouseDirection = 'right';
						}
						let nextIndex = canvasImageRotator.getNextIndex( event );
						canvasImageRotator.loadFrame( nextIndex );
					}, canvasImageRotator.canvasSettings.animateSpeed )
				} );
				domElm.addEventListener( 'mouseup', () => {
					clearInterval( canvasImageRotator.navigationInterval );
				} );
			} );

			if ( canvasImageRotator.canvasSettings.showIndicator === true ) {
				//indicator
				let indicator = document.querySelector( '.canvas-image-rotator-nav-indicator' );

				indicator.addEventListener( 'input', ( event ) => {
					const value = parseInt( event.target.value );
					canvasImageRotator.loadFrame( value );
				} );

				indicator.addEventListener( 'mouseover', ( event ) => {
					let previewCurrentElement = document.querySelector( '.canvas-image-rotator-nav-indicator-preview' );

					if ( previewCurrentElement !== null ) {
						previewCurrentElement.parentNode.removeChild( previewCurrentElement );
					}

					const intTick = Math.round( ( event.offsetX / event.target.clientWidth ) * parseInt( event.target.max, 10 ) );
					let previewElement = document.createElement( 'div' );
					previewElement.className = 'canvas-image-rotator-nav-indicator-preview';
					previewElement.appendChild( canvasImageRotator.imageList[ intTick ] );
					previewElement.style.left = event.offsetX + 'px';
					previewElement.style.bottom = '25px';
					indicator.parentNode.appendChild( previewElement );
				} );
				indicator.addEventListener( 'mouseleave', () => {
					let previewElement = document.querySelector( '.canvas-image-rotator-nav-indicator-preview' );
					previewElement.parentNode.removeChild( previewElement );
				} );
			}


		}

		//canvas mouse
		canvasImageRotator.canvasElement.addEventListener( 'mousedown', canvasImageRotator.readyRotation );
		window.addEventListener( 'mouseup', canvasImageRotator.endRotation );
		canvasImageRotator.canvasElement.addEventListener( 'mousemove', canvasImageRotator.rotate );

		//canvas touch
		canvasImageRotator.canvasElement.addEventListener( 'touchstart', ( event ) => {
			const touch = event.touches[ 0 ];
			const mouseEvent = new MouseEvent( 'mousedown', {
				clientX: touch.clientX,
				clientY: touch.clientY
			} );
			canvasImageRotator.readyRotation( mouseEvent );
		}, false );
		canvasImageRotator.canvasElement.addEventListener( 'touchmove', ( event ) => {
			const touch = event.touches[ 0 ];
			const velocity = touch.screenX - canvasImageRotator.touchPrevScreenX;
			canvasImageRotator.touchPrevScreenX = touch.screenX;
			const mouseEvent = new MouseEvent( 'mousemove', {
				clientX: touch.clientX,
				clientY: touch.clientY,
				movementX: velocity
			} );
			canvasImageRotator.rotate( mouseEvent );
		}, false );

		document.body.addEventListener( 'touchend', () => {
			clearInterval( canvasImageRotator.navigationInterval );
			const mouseEvent = new MouseEvent( 'mouseup', {} );
			canvasImageRotator.endRotation( mouseEvent );
		} );

	},
	readyRotation: ( event ) => {
		canvasImageRotator.isReady = true;
		canvasImageRotator.initialPosition = event.pageX;
		canvasImageRotator.touchPrevScreenX = event.screenX;
		canvasImageRotator.canvasElement.style.cursor = 'grabbing';
		clearInterval( canvasImageRotator.interval );

	},
	endRotation: () => {
		canvasImageRotator.isReady = false;
		canvasImageRotator.initialPosition = null;
		canvasImageRotator.canvasElement.style.cursor = 'grab';
	},
	rotate: ( event ) => {
		if ( canvasImageRotator.isReady === true ) {
			const velocity = Math.abs( event.movementX );
			const distance = Math.abs( canvasImageRotator.initialPosition - event.pageX );
			canvasImageRotator.mouseDirection = event.pageX >= canvasImageRotator.initialPosition ? 'left' : 'right';

			if ( distance % velocity === 0 ) {
				let nextIndex = canvasImageRotator.getNextIndex( event );
				canvasImageRotator.initialPosition = event.pageX;
				canvasImageRotator.loadFrame( nextIndex );
			}

		}
	}
};


document.addEventListener( 'DOMContentLoaded', () => {
	canvasImageRotator.init( {
		selectorId: 'canvas-image-rotator',
		src: 'https://next360.lacora.eu/prod/gJyziYDb8/BxOTb6fZk/imagesOriginal/',
		prefix: 'mint_green_vespa',
		postfix: '',
		leadingZeros: 4,
		count: 71,
		extension: 'jpg',
		width: 800,
		height: 600,
		animateSpeed: 10,
		showArrows: true,
		showIndicator: true
	} );
} );


/*
canvasImageRotator.update({
src: 'https://www.jqueryscript.net/demo/Interactive-360-Image-Rotator-Plugin-Turntable-js/fred/',
		prefix: 'fred',
		postfix: '',
		leadingZeros: 0,
		count: 14,
extension: 'JPG'
})
*/