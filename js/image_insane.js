(function ($) {
  Drupal.behaviors.image_insane = {

    attach: function (context, settings) {

    	console.log("JS log from image insane");


    	// Check for the various File API support.
			if (window.File && window.FileReader && window.FileList && window.Blob) {
			  console.log('Great success! All the File APIs are supported.');
			} else {
			  console.log('The File APIs are not fully supported in this browser.');
			}

			//	If any image insane container exists
			if( $('.image-insane-item', context).length){

				// Setup the dnd listeners - prevent native behaviour
				window.addEventListener("dragover",function(e){
				  e = e || event;
				  e.preventDefault();
				},false);
				window.addEventListener("drop",function(e){
				  e = e || event;
				  e.preventDefault();
				},false);

				//	
				$('.image-insane-item').each(function(i){
					console.log("EVERY");

					
					$(this).parent().addClass('drop-zone');

					var dropZone = $(this).parent().get(0);
					dropZone.addEventListener('dragover', Drupal.behaviors.image_insane.handleDragOver, false);
					dropZone.addEventListener('dragleave', Drupal.behaviors.image_insane.handleDragLeave, false);
					dropZone.addEventListener('drop', Drupal.behaviors.image_insane.handleFileSelect, false);

				});


				// Drupal.behaviors.image_insane.items.parent().css('display', 'inline-block').addClass('img_zone');

				// var dropZone = $('.field-name-field-image img').parent().get(0);
				// console.log(dropZone);

				// dropZone.addEventListener('dragover', Drupal.behaviors.image_insane.handleDragOver, false);
				// dropZone.addEventListener('dragleave', Drupal.behaviors.image_insane.handleDragLeave, false);
				// dropZone.addEventListener('drop', Drupal.behaviors.image_insane.handleFileSelect, false);


				// //
				// console.log(Drupal.settings.image_insane.post_url);

			}



    },

    handleDragOver: function(evt) {
		  evt.stopPropagation();
		  evt.preventDefault();
		  evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
		  $(evt.target).parent().css('border-color', 'red');
		},

		handleDragLeave: function(evt) {
		  evt.stopPropagation();
		  evt.preventDefault();
		  $(evt.target).parent().css('border-color', '');
		},

		handleFileSelect: function(evt) {

			console.log("handling drop");
			console.log($(evt.target).attr('data-image-style'));

		  evt.stopPropagation();
		  evt.preventDefault();

		  //	Element properties and attributes
		  var data_image_style = $(evt.target).attr('data-image-style');
		  var data_nid = $(evt.target).attr('data-nid');
		  var data_image_field_name = $(evt.target).attr('data-image-field-name');

		  var files = evt.dataTransfer.files; // FileList object.
		  //console.log(evt);

		  //	We will be working only with ONE file object even if multiple images dropped
		  var fileIndex = 0;
		  var f = files[fileIndex];
		  console.log(f);

	    var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {
        	console.log(e);
        	console.log(f);

          //	Send the post thingy
     			var json_data = {
     				name: f.name,
						base64: e.target.result,
						image_style: data_image_style,
						nid: data_nid,
						image_field_name: data_image_field_name,
					}
					data_to_send = JSON.stringify(json_data);

					console.log(json_data);
					$.post(Drupal.settings.image_insane.post_url, { json: data_to_send })
					.done(function(data) {
					  console.log('successss!');
					  console.log(data);
					  $(evt.target).attr('src', data)
					})
					.fail(function(data) {
						console.log("failed post action!");
					});

        };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsDataURL(f);


		  //document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';

		  $('#drop_zone').css('border-color', '');


		}



  }

})(jQuery);
