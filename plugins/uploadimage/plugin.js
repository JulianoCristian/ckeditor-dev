/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */
'use strict';

( function() {
	CKEDITOR.plugins.add( 'uploadimage', {
		requires: 'widget,clipboard,uploadmanager',
		lang: 'en', // %REMOVE_LINE_CORE%
		init: function( editor ) {
			var manager = new CKEDITOR.plugins.uploadmanager.manager(),
				uploadUrl = editor.config.imageUploadUrl ? editor.config.imageUploadUrl :
					editor.config.uploadUrl ? editor.config.uploadUrl :
					editor.config.filebrowserImageUploadUrl ? editor.config.filebrowserImageUploadUrl + '&responseType=json' :
					editor.config.filebrowserUploadUrl ? editor.config.filebrowserUploadUrl + '&responseType=json' : '';

			editor.filter.allow( 'img[data-widget]' );

			editor.widgets.add( 'uploadimage', {
				parts: {
					img: 'img'
				},

				downcast: function() {
					return new CKEDITOR.htmlParser.text( '' );
				},

				init: function() {
					var that = this,
						upload = manager.getLoader( this.parts.img.data( 'cke-upload-id' ) );

					upload.on( 'update', function() {
						if ( !that.wrapper ) {
							return;
						}

						editor.fire( 'lockSnapshot' );

						console.log( upload.status );
						if ( upload.status == 'uploading' ) {
							that.parts.img.setAttribute( 'src', upload.data );
						} else if ( upload.status == 'uploaded' ) {
							// Set width and height to prevent blinking.
							var imgHtml = '<img src="' + upload.url + '" ' +
											'width="' + that.parts.img.$.naturalWidth + '" ' +
											'height="' + that.parts.img.$.naturalHeight +'">',
								processedImg = editor.dataProcessor.toHtml( imgHtml, { context: that.wrapper.getParent().getName() } ),
								img = CKEDITOR.dom.element.createFromHtml( processedImg );
							img.replace( that.wrapper );

							editor.widgets.checkWidgets( { initOnlyNew: true } );
						} else if ( upload.status == 'error' || upload.status == 'abort' ) {
							console.log( upload.message );
							editor.widgets.del( that );
						}

						editor.fire( 'unlockSnapshot' );
					} );

					upload.update();
				}
			} );

			editor.on( 'paste', function( evt ) {
				var data = evt.data,
					dataTransfer = data.dataTransfer,
					filesCount = dataTransfer.getFilesCount(),
					supportedExtentions = { 'jpg': 1, 'jpeg': 1, 'png': 1 },
					file, ext, i;

				if ( data.dataValue || !filesCount ) {
					return;
				}

				for ( i = 0; i < filesCount; i++ ) {
					file = dataTransfer.getFile( i );

					ext = getExtention( file.name );

					if ( supportedExtentions[ ext ] ) {
						var loader = manager.createLoader( file ),
							img = new CKEDITOR.dom.element( 'img' );

						loader.loadAndUpload( uploadUrl );

						img.setAttributes( {
							'src': loadingImage,
							'data-cke-upload-id': loader.id,
							'data-widget': 'uploadimage'
						} );
						data.dataValue += img.getOuterHtml();
					}
				}

				function getExtention( filename ) {
					var splited = filename.split( '.' );
					if ( splited.length === 1 || ( splited[ 0 ] === '' && splited.length === 2 ) ) {
						return '';
					}
					return splited.pop().toLowerCase();
				}
			} );

			editor.on( 'paste', function( evt ) {
				var data = evt.data;

				var temp = new CKEDITOR.dom.element( 'div' ),
					imgs, img, i;
				temp.appendHtml( data.dataValue );
				imgs = temp.find( 'img' );

				for ( i = 0; i < imgs.count(); i++ ) {
					img = imgs.getItem( i );

					var isDataInSrc = img.getAttribute( 'src' ) && img.getAttribute( 'src' ).substring( 0, 5 ) == 'data:';
					if ( !img.data( 'cke-upload-id' ) && inEditableBlock( img ) && isDataInSrc ) {
						var loader = manager.createLoader( img.getAttribute( 'src' ) );

						loader.upload( uploadUrl );

						img.setAttributes( {
							'data-cke-upload-id': loader.id
						} );
					}
				}

				data.dataValue = temp.getHtml();

				function inEditableBlock( element ) {
					while ( element ) {
						if ( element.data( 'cke-editable' ) )
							return true;
						if ( element.getAttribute( 'contentEditable' ) == 'false' )
							return false;
						if ( element.getAttribute( 'contentEditable' ) == 'true' )
							return true;

						element = element.getParent();
					}

					return true;
				}
			} );
		}
	} );

	var loadingImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAIAAAC0tAIdAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB94JCQopEbeZwMsAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAD0lEQVQoz2NgGAWjYCgBAAKyAAGlkzepAAAAAElFTkSuQmCC';
} )();
