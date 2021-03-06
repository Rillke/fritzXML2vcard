/* jshint node: true, esversion: 6 */
(function() {
	'use strict';

	var $ = require('jquery'),
		$window = $(window),
		$body = $(document.body),
		$loader = $('#loader'),
		$dropZone = $('#drop-zone'),
		$inputForm = $('#input-form'),
		$fritzXmlFile = $('#fritzxml-file'),
		$fritzXmlText = $('#fritzxml-text'),
		$areaCode = $('#area-code'),
		$countryCode = $('#country-code'),
		$run = $('#run'),
		$output = $('#output'),
		$vCards = $('#vcards'),
		$getAll = $('#get-all'),
		$getMulti = $('#get-multi'),
		$deleteAll = $('#delete-all'),
		$vCardTemplate = $('#vcf-template').detach(),
		$version = $('#version'),
		baseName = 'vCards_from_FritzBox_Phone_book',
		libConvert = require('./lib-convert'),
		// https://github.com/zenorocha/clipboard.js/issues/535
		ClipboardJS = require('clipboard/dist/clipboard.min'),
		FileSaver = require('file-saver'),
		JSZip = require('jszip'),
		version = require('./version'),
		lastTarget;

	// Allow non-node-scripts use jQuery
	window.jQuery = $;
	require('jquery-modal');

	// Set up event handlers
	$window.on('dragenter', dragenter).on('dragleave', dragleave);
	$dropZone.on('drop', dropped).on('dragover', dragover);
	$fritzXmlFile.on('change', fileInputChanged);
	$fritzXmlText.on('change input', textInputChanged);
	$inputForm.on('submit', run);

	$body.on('click', 'a[href="#view"]', viewVCard);
	$body.on('click', 'a[href="#get"]', getVCard);
	new ClipboardJS('a[href="#copy"]', {
		text: copyVCard
	}).on('success', copiedVCard);
	$body.on('click', 'a[href="#delete"]', deleteVCard);

	$getAll.on('click', getAll);
	$getMulti.on('click', getMulti);
	$deleteAll.on('click', deleteAll);

	$version.text(version.hash);
	$loader.fadeOut();

	function dragenter(e) {
		lastTarget = e.target;
		$dropZone.css({
			'visibility': 'visible',
			'opacity': 1
		});
	}

	function dragleave(e) {
		if (e.target === lastTarget || e.target === document) {
			$dropZone.css({
				'visibility': 'hidden',
				'opacity': 0
			});
		}
	}

	function dropped(e) {
		// Prevent default behavior (Prevent file from being opened)
		e.preventDefault();
		var ev = e.originalEvent,
			i;

		$dropZone.css({
			'visibility': 'hidden',
			'opacity': 0
		});

		if (ev.dataTransfer.items) {
			// Use DataTransferItemList interface to access the file(s)
			for (i = 0; i < ev.dataTransfer.items.length; i++) {
				// If dropped items aren't files, reject them
				if (ev.dataTransfer.items[i].kind === 'file') {
					var file = ev.dataTransfer.items[i].getAsFile();
					gotXmlFile(file, ev);
				}
			}
		} else {
			// Use DataTransfer interface to access the file(s)
			for (i = 0; i < ev.dataTransfer.files.length; i++) {
				gotXmlFile(ev.dataTransfer.files[i], ev);
			}
		}
	}

	function dragover(e) {
		// Prevent default behavior (Prevent file from being opened)
		e.preventDefault();
	}

	function removeDragData(ev) {
		if (ev.dataTransfer.items) {
			// Use DataTransferItemList interface to remove the drag data
			ev.dataTransfer.items.clear();
		} else {
			// Use DataTransfer interface to remove the drag data
			ev.dataTransfer.clearData();
		}
	}

	function fileInputChanged(e) {
		var files = $fritzXmlFile.prop('files');
		if (files && files.length > 0) {
			gotXmlFile(files[0]);
		}
	}

	function textInputChanged() {
		if ($fritzXmlText.val().length) {
			$run.addClass('button-primary');
		}
	}

	function gotXmlFile(xmlFile, ev) {
		var fileReader = new FileReader();
		fileReader.onload = function() {
			if (ev) {
				removeDragData(ev);
			}
			$fritzXmlText
				.val(fileReader.result)
				.trigger('change');
		};
		// Assume UTF-8 coded files
		fileReader.readAsText(xmlFile);
		if (xmlFile && xmlFile.name && /(?:fritz|xml)/.test(xmlFile.name)) {
			baseName = xmlFile.name.replace(/(.+)\.\w+$/, '$1');
		}
	}

	function run(e) {
		e.preventDefault();

		var fritzXML = $fritzXmlText.val(),
			areaCode = $areaCode.val(),
			countryCode = $countryCode.val(),
			vCards, vCardStrings, vCardObjects;

		// prevent duplicating contacts by double-clicking
		$run.attr('disabled', 'disabled');
		setTimeout(function() {
			$run.removeAttr('disabled');
		}, 2000);

		try {
			vCards = libConvert.fritzXML2vcardObjects(fritzXML, areaCode, countryCode);
			vCardStrings = vCards.vCardStrings;
			vCardObjects = vCards.vCardObjects;
		} catch (ex) {
			alert('Sorry, there was an error processing your XML. Maybe truncated?\n' +
				'Here is the error message:\n' + ex.message);
			return;
		}

		$output.fadeIn('fast');
		for (var vCard in vCardStrings) {
			if (vCardStrings.hasOwnProperty(vCard)) {
				var vCardObject = vCardObjects[vCard],
					$vCard = $vCardTemplate.clone().removeAttr('id'),
					$fileName = $vCard.find('.vcf-filename'),
					$name = $vCard.find('.vcf-name'),
					name = vCardObject.firstName ? 
						(vCardObject.firstName + ' ' + vCardObject.lastName) : 
						vCardObject.lastName;

				$name.text(name);
				$fileName.text(vCard);
				$vCard
					.data('card', vCardStrings[vCard])
					.data('name', vCard)
					.appendTo($vCards);
			}
		}
	}

	function viewVCard(e) {
		e.preventDefault();
		$('<div>').append(
			$('<pre>').append(
				$('<code>').text(
					$(e.target)
					.parents('.vcard')
					.data('card')
				)
			)
		).appendTo($body).modal();
	}

	function getVCard(e) {
		e.preventDefault();
		var $vCard = $(e.target).parents('.vcard'),
			vCard = $vCard.data('card'),
			vCardName = $vCard.data('name'),
			blob = new Blob([vCard], {
				type: 'text/plain;charset=utf-8'
			});

		FileSaver.saveAs(blob, vCardName);
	}

	function copyVCard(trigger) {
		return $(trigger).parents('.vcard').data('card');
	}

	function copiedVCard(e) {
		var $fas = $(e.trigger)
			.find('.fas')
			.removeClass('fa-clipboard-list')
			.addClass('fa-clipboard-check');
		setTimeout(function() {
			$fas
				.removeClass('fa-clipboard-check')
				.addClass('fa-clipboard-list');
		}, 2000);
	}

	function deleteVCard(e) {
		e.preventDefault();
		$(e.target)
			.parents('.vcard')
			.remove();
	}

	function getAll(e) {
		e.preventDefault();
		var zip = new JSZip();

		$vCards.find('li').each(function() {
			var $vCard = $(this),
				vCard = $vCard.data('card'),
				vCardName = $vCard.data('name');

			zip.file(vCardName, vCard);
		});
		zip
			.generateAsync({
				type: 'blob'
			})
			.then(function(content) {
				FileSaver.saveAs(content, baseName + '.zip');
			});
	}

	function getMulti(e) {
		e.preventDefault();
		var multiCard = [],
			blob;

		$vCards.find('li').each(function() {
			var $vCard = $(this),
				vCard = $vCard.data('card');

			multiCard.push(vCard);
		});

		blob = new Blob([multiCard.join('\r\n')], {
			type: 'text/plain;charset=utf-8'
		});

		FileSaver.saveAs(blob, baseName + '.vcf');
	}

	function deleteAll(e) {
		e.preventDefault();
		$vCards.text('');
	}
}());

