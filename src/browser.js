/* jshint node: true, esversion: 6 */
(function() {
	'use strict';

	var $ = require('jquery'),
		$window = $(window),
		$body = $(document.body),
		$dropZone = $('#drop-zone'),
		$fritzXmlFile = $('#fritzxml-file'),
		$fritzXmlText = $('#fritzxml-text'),
		$run = $('#run'),
		$vCards = $('#vcards'),
		$getAll = $('#get-all'),
		$deleteAll = $('#delete-all'),
		$vCardTemplate = $('#vcf-template').detach(),
		$version = $('#version'),
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
	$run.on('click', run);

	$body.on('click', 'a[href="#view"]', viewVCard);
	$body.on('click', 'a[href="#get"]', getVCard);
	new ClipboardJS('a[href="#copy"]', {
		text: copyVCard
	}).on('success', copiedVCard);
	$body.on('click', 'a[href="#delete"]', deleteVCard);

	$getAll.on('click', getAll);
	$deleteAll.on('click', deleteAll);

	$version.text(version.hash);

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
	}

	function run() {
		var fritzXML = $fritzXmlText.val(),
			vCards = libConvert.fritzXML2vcardObjects(fritzXML),
			vCardStrings = vCards.vCardStrings,
			vCardObjects = vCards.vCardObjects;

		$getAll.add($deleteAll).show();
		for (var vCard in vCardStrings) {
			if (vCardStrings.hasOwnProperty(vCard)) {
				var $vCard = $vCardTemplate.clone().removeAttr('id'),
					$fileName = $vCard.find('.vcf-filename');

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
				FileSaver.saveAs(content, 'vCards_from_FritzBox_Phone_book.zip');
			});
	}

	function deleteAll(e) {
		e.preventDefault();
		$vCards.text('');
	}
}());
